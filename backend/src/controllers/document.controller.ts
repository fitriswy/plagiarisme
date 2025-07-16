import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, AppError } from '../errors/errorHandler';
import { extractTextFromFile } from '../utils/extractText';
import { PlagiarismService } from '../services/enhancedPlagiarism.service';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
    role: string;
  };
}

export class DocumentController {
  static uploadDocument = asyncHandler(async (req: AuthRequest, res: Response) => {
    const file = req.file;
    const userId = req.user?.userId;

    if (!file) {
      throw new AppError('File tidak ditemukan', 400);
    }

    if (!userId) {
      throw new AppError('User tidak terautentikasi', 401);
    }

    try {
      const fullPath = path.join(__dirname, '../../uploads', file.filename);
      const extractedText = await extractTextFromFile(fullPath);

      if (!extractedText || extractedText.trim().length < 100) {
        // Hapus file jika ekstraksi gagal
        fs.unlinkSync(fullPath);
        throw new AppError('Tidak dapat mengekstrak teks dari file atau teks terlalu pendek (minimal 100 karakter)', 400);
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

    } catch (error: any) {
      // Hapus file jika terjadi error
      if (file?.filename) {
        const fullPath = path.join(__dirname, '../../uploads', file.filename);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
      throw error;
    }
  });

  static checkPlagiarism = asyncHandler(async (req: AuthRequest, res: Response) => {
    const docId = parseInt(req.params.id);
    const userId = req.user?.userId;

    // Verify document ownership
    const document = await prisma.document.findUnique({
      where: { id: docId }
    });

    if (!document) {
      throw new AppError('Dokumen tidak ditemukan', 404);
    }

    if (document.userId !== userId && req.user?.role !== 'ADMIN') {
      throw new AppError('Anda tidak memiliki akses ke dokumen ini', 403);
    }

    const results = await PlagiarismService.checkPlagiarism(docId);

    res.json({
      status: 'success',
      message: 'Pemeriksaan plagiarisme selesai!',
      data: {
        document: {
          id: document.id,
          title: document.title
        },
        algorithm: 'RABIN_KARP',
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

  static getDetailedResult = asyncHandler(async (req: AuthRequest, res: Response) => {
    const doc1Id = parseInt(req.params.doc1Id);
    const doc2Id = parseInt(req.params.doc2Id);
    const userId = req.user?.userId;

    // Verify document ownership
    const document = await prisma.document.findUnique({
      where: { id: doc1Id }
    });

    if (!document) {
      throw new AppError('Dokumen tidak ditemukan', 404);
    }

    if (document.userId !== userId && req.user?.role !== 'ADMIN') {
      throw new AppError('Anda tidak memiliki akses ke dokumen ini', 403);
    }

    const result = await PlagiarismService.getDetailedResult(doc1Id, doc2Id);

    res.json({
      status: 'success',
      data: { result }
    });
  });

  static getUserDocuments = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const status = req.query.status as string;

    const skip = (page - 1) * limit;

    const whereClause: any = { userId };

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

  static getDocument = asyncHandler(async (req: AuthRequest, res: Response) => {
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
      throw new AppError('Dokumen tidak ditemukan', 404);
    }

    if (document.userId !== userId && req.user?.role !== 'ADMIN') {
      throw new AppError('Anda tidak memiliki akses ke dokumen ini', 403);
    }

    res.json({
      status: 'success',
      data: { document }
    });
  });

  static deleteDocument = asyncHandler(async (req: AuthRequest, res: Response) => {
    const docId = parseInt(req.params.id);
    const userId = req.user?.userId;

    const document = await prisma.document.findUnique({
      where: { id: docId }
    });

    if (!document) {
      throw new AppError('Dokumen tidak ditemukan', 404);
    }

    if (document.userId !== userId && req.user?.role !== 'ADMIN') {
      throw new AppError('Anda tidak memiliki akses ke dokumen ini', 403);
    }

    // Hapus file fisik
    const fullPath = path.join(__dirname, '../../uploads', document.filename);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
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

  static updateDocument = asyncHandler(async (req: AuthRequest, res: Response) => {
    const docId = parseInt(req.params.id);
    const userId = req.user?.userId;
    const { title } = req.body;

    const document = await prisma.document.findUnique({
      where: { id: docId }
    });

    if (!document) {
      throw new AppError('Dokumen tidak ditemukan', 404);
    }

    if (document.userId !== userId && req.user?.role !== 'ADMIN') {
      throw new AppError('Anda tidak memiliki akses ke dokumen ini', 403);
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

  static getPlagiarismHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await PlagiarismService.getPlagiarismHistory(userId!, page, limit);

    res.json({
      status: 'success',
      data: result
    });
  });

  static getStatistics = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.role === 'ADMIN' ? undefined : req.user?.userId;

    const stats = await PlagiarismService.getStatistics(userId);

    res.json({
      status: 'success',
      data: { statistics: stats }
    });
  });
}
