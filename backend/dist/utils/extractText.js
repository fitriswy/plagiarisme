"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTextFromFile = extractTextFromFile;
exports.getFileInfo = getFileInfo;
exports.validateFileSize = validateFileSize;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const textract_1 = __importDefault(require("textract"));
const mammoth_1 = __importDefault(require("mammoth"));
async function extractTextFromFile(filePath) {
    if (!fs_1.default.existsSync(filePath)) {
        throw new Error('File tidak ditemukan');
    }
    const ext = path_1.default.extname(filePath).toLowerCase();
    let extractedText = '';
    try {
        switch (ext) {
            case '.pdf':
                extractedText = await extractFromPDF(filePath);
                break;
            case '.docx':
                extractedText = await extractFromDocx(filePath);
                break;
            case '.doc':
                extractedText = await extractFromDoc(filePath);
                break;
            case '.txt':
                extractedText = await extractFromTxt(filePath);
                break;
            default:
                throw new Error(`Format file ${ext} tidak didukung. Gunakan PDF, DOC, DOCX, atau TXT.`);
        }
        // Clean and validate extracted text
        extractedText = cleanText(extractedText);
        if (!extractedText || extractedText.trim().length < 50) {
            throw new Error('Teks yang diekstrak terlalu pendek atau kosong. Minimal 50 karakter.');
        }
        return extractedText;
    }
    catch (error) {
        console.error(`Error extracting text from ${filePath}:`, error);
        throw new Error(`Gagal mengekstrak teks: ${error.message}`);
    }
}
async function extractFromPDF(filePath) {
    const dataBuffer = fs_1.default.readFileSync(filePath);
    const data = await (0, pdf_parse_1.default)(dataBuffer, {
        max: 0, // Extract all pages
        version: 'v1.10.100'
    });
    return data.text;
}
async function extractFromDocx(filePath) {
    const result = await mammoth_1.default.extractRawText({ path: filePath });
    return result.value;
}
async function extractFromDoc(filePath) {
    return new Promise((resolve, reject) => {
        textract_1.default.fromFileWithPath(filePath, { preserveLineBreaks: true }, (err, text) => {
            if (err) {
                reject(new Error(`Gagal ekstrak .doc file: ${err.message}`));
            }
            else {
                resolve(text || '');
            }
        });
    });
}
async function extractFromTxt(filePath) {
    return fs_1.default.readFileSync(filePath, 'utf-8');
}
function cleanText(text) {
    return text
        // Remove excessive whitespace
        .replace(/\s+/g, ' ')
        // Remove special characters but keep punctuation
        .replace(/[^\w\s\.,!?;:()-]/g, ' ')
        // Remove multiple spaces
        .replace(/\s{2,}/g, ' ')
        // Trim
        .trim();
}
function getFileInfo(filePath) {
    const stats = fs_1.default.statSync(filePath);
    const ext = path_1.default.extname(filePath).toLowerCase();
    return {
        size: stats.size,
        extension: ext,
        isSupported: ['.pdf', '.doc', '.docx', '.txt'].includes(ext),
        lastModified: stats.mtime
    };
}
function validateFileSize(filePath, maxSize = 10 * 1024 * 1024) {
    const stats = fs_1.default.statSync(filePath);
    return stats.size <= maxSize;
}
