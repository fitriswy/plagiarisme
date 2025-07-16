import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import textract from 'textract';
import mammoth from 'mammoth';

export async function extractTextFromFile(filePath: string): Promise<string> {
  if (!fs.existsSync(filePath)) {
    throw new Error('File tidak ditemukan');
  }

  const ext = path.extname(filePath).toLowerCase();
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

  } catch (error: any) {
    console.error(`Error extracting text from ${filePath}:`, error);
    throw new Error(`Gagal mengekstrak teks: ${error.message}`);
  }
}

async function extractFromPDF(filePath: string): Promise<string> {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer, {
    max: 0, // Extract all pages
    version: 'v1.10.100'
  });
  return data.text;
}

async function extractFromDocx(filePath: string): Promise<string> {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

async function extractFromDoc(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    textract.fromFileWithPath(filePath, { preserveLineBreaks: true }, (err, text) => {
      if (err) {
        reject(new Error(`Gagal ekstrak .doc file: ${err.message}`));
      } else {
        resolve(text || '');
      }
    });
  });
}

async function extractFromTxt(filePath: string): Promise<string> {
  return fs.readFileSync(filePath, 'utf-8');
}

function cleanText(text: string): string {
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

export function getFileInfo(filePath: string) {
  const stats = fs.statSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  
  return {
    size: stats.size,
    extension: ext,
    isSupported: ['.pdf', '.doc', '.docx', '.txt'].includes(ext),
    lastModified: stats.mtime
  };
}

export function validateFileSize(filePath: string, maxSize: number = 10 * 1024 * 1024): boolean {
  const stats = fs.statSync(filePath);
  return stats.size <= maxSize;
}
