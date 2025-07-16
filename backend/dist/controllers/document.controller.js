"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentController = void 0;
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../errors/errorHandler");
const extractText_1 = require("../utils/extractText");
const enhancedPlagiarism_service_1 = require("../services/enhancedPlagiarism.service");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const prisma = new client_1.PrismaClient();
class DocumentController {
}
exports.DocumentController = DocumentController;
_a = DocumentController;
DocumentController.uploadDocument = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const file = req.file;
    const userId = req.user?.userId;
    if (!file) {
        throw new errorHandler_1.AppError('File tidak ditemukan', 400);
    }
    if (!userId) {
        throw new errorHandler_1.AppError('User tidak terautentikasi', 401);
    }
    try {
        const fullPath = path_1.default.join(__dirname, '../../uploads', file.filename);
        const extractedText = await (0, extractText_1.extractTextFromFile)(fullPath);
        if (!extractedText || extractedText.trim().length < 100) {
            // Hapus file jika ekstraksi gagal
            fs_1.default.unlinkSync(fullPath);
            throw new errorHandler_1.AppError('Tidak dapat mengekstrak teks dari file atau teks terlalu pendek (minimal 100 karakter)', 400);
        }
        const document = await prisma.document.create({
            data: {
                title: req.body.title || file.originalname,
                content: extractedText,
                filename: file.filename,
                originalName: file.originalname,
                fileSize: file.size,
                fileType: file.mimetype,
                userId,
                status: 'PENDING'
            }
        });
        res.status(201).json({
            status: 'success',
            message: 'File berhasil diunggah dan diproses!',
            data: {
                document: {
                    id: document.id,
                    title: document.title,
                    filename: document.filename,
                    originalName: document.originalName,
                    fileSize: document.fileSize,
                    fileType: document.fileType,
                    uploadedAt: document.uploadedAt,
                    status: document.status
                }
            }
        });
    }
    catch (error) {
        // Hapus file jika terjadi error
        if (file?.filename) {
            const fullPath = path_1.default.join(__dirname, '../../uploads', file.filename);
            if (fs_1.default.existsSync(fullPath)) {
                fs_1.default.unlinkSync(fullPath);
            }
        }
        throw error;
    }
});
DocumentController.checkPlagiarism = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const docId = parseInt(req.params.id);
    const algorithm = req.query.algorithm || 'RABIN_KARP';
    const userId = req.user?.userId;
    // Verify document ownership
    const document = await prisma.document.findUnique({
        where: { id: docId }
    });
    if (!document) {
        throw new errorHandler_1.AppError('Dokumen tidak ditemukan', 404);
    }
    if (document.userId !== userId && req.user?.role !== 'ADMIN') {
        throw new errorHandler_1.AppError('Anda tidak memiliki akses ke dokumen ini', 403);
    }
    const results = await enhancedPlagiarism_service_1.PlagiarismService.checkPlagiarism(docId, algorithm);
    res.json({
        status: 'success',
        message: 'Pemeriksaan plagiarisme selesai!',
        data: {
            document: {
                id: document.id,
                title: document.title
            },
            algorithm,
            results: results.map(result => ({
                documentId: result.doc2Id,
                documentTitle: result.doc2Title,
                similarity: Math.round(result.similarity * 100) / 100,
                matchedSegments: result.matchedSegments.slice(0, 5), // Limit to 5 segments for overview
                totalMatches: result.matchedSegments.length
            })),
            summary: {
                totalChecked: results.length,
                highRisk: results.filter(r => r.similarity > 70).length,
                mediumRisk: results.filter(r => r.similarity > 40 && r.similarity <= 70).length,
                lowRisk: results.filter(r => r.similarity <= 40).length,
                averageSimilarity: Math.round((results.reduce((sum, r) => sum + r.similarity, 0) / results.length) * 100) / 100 || 0
            }
        }
    });
});
DocumentController.getDetailedResult = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const doc1Id = parseInt(req.params.doc1Id);
    const doc2Id = parseInt(req.params.doc2Id);
    const userId = req.user?.userId;
    // Verify document ownership
    const document = await prisma.document.findUnique({
        where: { id: doc1Id }
    });
    if (!document) {
        throw new errorHandler_1.AppError('Dokumen tidak ditemukan', 404);
    }
    if (document.userId !== userId && req.user?.role !== 'ADMIN') {
        throw new errorHandler_1.AppError('Anda tidak memiliki akses ke dokumen ini', 403);
    }
    const result = await enhancedPlagiarism_service_1.PlagiarismService.getDetailedResult(doc1Id, doc2Id);
    res.json({
        status: 'success',
        data: { result }
    });
});
DocumentController.getUserDocuments = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search;
    const status = req.query.status;
    const skip = (page - 1) * limit;
    const whereClause = { userId };
    if (search) {
        whereClause.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { originalName: { contains: search, mode: 'insensitive' } }
        ];
    }
    if (status) {
        whereClause.status = status;
    }
    const [documents, total] = await Promise.all([
        prisma.document.findMany({
            where: whereClause,
            orderBy: { uploadedAt: 'desc' },
            skip,
            take: limit,
            include: {
                _count: {
                    select: {
                        plagiarismResults1: true
                    }
                }
            }
        }),
        prisma.document.count({ where: whereClause })
    ]);
    res.json({
        status: 'success',
        data: {
            documents: documents.map(doc => ({
                id: doc.id,
                title: doc.title,
                originalName: doc.originalName,
                fileSize: doc.fileSize,
                fileType: doc.fileType,
                uploadedAt: doc.uploadedAt,
                status: doc.status,
                checksPerformed: doc._count.plagiarismResults1
            })),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        }
    });
});
DocumentController.getDocument = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const docId = parseInt(req.params.id);
    const userId = req.user?.userId;
    const document = await prisma.document.findUnique({
        where: { id: docId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true
                }
            },
            _count: {
                select: {
                    plagiarismResults1: true,
                    plagiarismResults2: true
                }
            }
        }
    });
    if (!document) {
        throw new errorHandler_1.AppError('Dokumen tidak ditemukan', 404);
    }
    if (document.userId !== userId && req.user?.role !== 'ADMIN') {
        throw new errorHandler_1.AppError('Anda tidak memiliki akses ke dokumen ini', 403);
    }
    res.json({
        status: 'success',
        data: { document }
    });
});
DocumentController.deleteDocument = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const docId = parseInt(req.params.id);
    const userId = req.user?.userId;
    const document = await prisma.document.findUnique({
        where: { id: docId }
    });
    if (!document) {
        throw new errorHandler_1.AppError('Dokumen tidak ditemukan', 404);
    }
    if (document.userId !== userId && req.user?.role !== 'ADMIN') {
        throw new errorHandler_1.AppError('Anda tidak memiliki akses ke dokumen ini', 403);
    }
    // Hapus file fisik
    const fullPath = path_1.default.join(__dirname, '../../uploads', document.filename);
    if (fs_1.default.existsSync(fullPath)) {
        fs_1.default.unlinkSync(fullPath);
    }
    // Hapus dari database (cascade akan menghapus plagiarism results)
    await prisma.document.delete({
        where: { id: docId }
    });
    res.json({
        status: 'success',
        message: 'Dokumen berhasil dihapus!'
    });
});
DocumentController.updateDocument = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const docId = parseInt(req.params.id);
    const userId = req.user?.userId;
    const { title } = req.body;
    const document = await prisma.document.findUnique({
        where: { id: docId }
    });
    if (!document) {
        throw new errorHandler_1.AppError('Dokumen tidak ditemukan', 404);
    }
    if (document.userId !== userId && req.user?.role !== 'ADMIN') {
        throw new errorHandler_1.AppError('Anda tidak memiliki akses ke dokumen ini', 403);
    }
    const updatedDocument = await prisma.document.update({
        where: { id: docId },
        data: { title }
    });
    res.json({
        status: 'success',
        message: 'Dokumen berhasil diupdate!',
        data: { document: updatedDocument }
    });
});
DocumentController.getPlagiarismHistory = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await enhancedPlagiarism_service_1.PlagiarismService.getPlagiarismHistory(userId, page, limit);
    res.json({
        status: 'success',
        data: result
    });
});
DocumentController.getStatistics = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.role === 'ADMIN' ? undefined : req.user?.userId;
    const stats = await enhancedPlagiarism_service_1.PlagiarismService.getStatistics(userId);
    res.json({
        status: 'success',
        data: { statistics: stats }
    });
});
