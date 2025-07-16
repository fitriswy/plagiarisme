import { PrismaClient } from '@prisma/client';
import { rabinKarp } from './rabinKarp.service';
import emailService from './email.service';

const prisma = new PrismaClient();

export interface PlagiarismResult {
  doc2Id: number;
  doc2Title: string;
  similarity: number;
  matchedSegments: string[];
  algorithm: string;
}

export class PlagiarismService {
  // Rabin-Karp algorithm untuk exact matching
  static checkWithRabinKarp(targetContent: string, otherContent: string): { similarity: number; matches: string[] } {
    const sentences = targetContent.split(/[.?!]\s+/).filter(s => s.trim().length > 10);
    const matches: string[] = [];
    let matchCount = 0;

    for (const sentence of sentences) {
      if (rabinKarp(otherContent, sentence.trim())) {
        matchCount++;
        matches.push(sentence.trim());
      }
    }

    const similarity = sentences.length > 0 ? (matchCount / sentences.length) * 100 : 0;
    return { similarity, matches };
  }

  static async checkPlagiarism(docId: number, algorithm: 'RABIN_KARP' = 'RABIN_KARP'): Promise<PlagiarismResult[]> {
    const targetDoc = await prisma.document.findUnique({ 
      where: { id: docId },
      include: { user: true }
    });
    
    if (!targetDoc) throw new Error('Dokumen tidak ditemukan.');

    // Update status dokumen
    await prisma.document.update({
      where: { id: docId },
      data: { status: 'PROCESSED' }
    });

    const allDocs = await prisma.document.findMany({ 
      where: { 
        id: { not: docId },
        status: 'PROCESSED'
      }
    });

    const results: PlagiarismResult[] = [];

    for (const otherDoc of allDocs) {
      // Hanya menggunakan Rabin-Karp algorithm
      const result = this.checkWithRabinKarp(targetDoc.content, otherDoc.content);

      // Simpan ke database
      await prisma.plagiarismResult.upsert({
        where: {
          doc1Id_doc2Id: {
            doc1Id: docId,
            doc2Id: otherDoc.id
          }
        },
        update: {
          similarity: result.similarity,
          matchedText: result.matches.join('\n---\n'),
          algorithm: 'RABIN_KARP',
          checkedAt: new Date()
        },
        create: {
          doc1Id: docId,
          doc2Id: otherDoc.id,
          similarity: result.similarity,
          matchedText: result.matches.join('\n---\n'),
          algorithm: 'RABIN_KARP',
        }
      });

      results.push({
        doc2Id: otherDoc.id,
        doc2Title: otherDoc.title,
        similarity: result.similarity,
        matchedSegments: result.matches,
        algorithm: 'RABIN_KARP'
      });
    }

    // Kirim email notifikasi jika ada similarity tinggi
    const highSimilarity = results.find(r => r.similarity > 70);
    if (highSimilarity && targetDoc.user.email) {
      try {
        await emailService.sendPlagiarismReport(
          targetDoc.user.email,
          targetDoc.title,
          highSimilarity.similarity
        );
      } catch (error) {
        console.error('Failed to send plagiarism report email:', error);
      }
    }

    return results.sort((a, b) => b.similarity - a.similarity);
  }

  static async getDetailedResult(doc1Id: number, doc2Id: number): Promise<any> {
    const result = await prisma.plagiarismResult.findUnique({
      where: {
        doc1Id_doc2Id: {
          doc1Id,
          doc2Id
        }
      },
      include: {
        doc1: true,
        doc2: true
      }
    });

    if (!result) throw new Error('Hasil plagiarisme tidak ditemukan.');

    return {
      ...result,
      matchedSegments: result.matchedText ? result.matchedText.split('\n---\n') : []
    };
  }

  static async getPlagiarismHistory(userId: number, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const results = await prisma.plagiarismResult.findMany({
      where: {
        doc1: {
          userId
        }
      },
      include: {
        doc1: true,
        doc2: true
      },
      orderBy: {
        checkedAt: 'desc'
      },
      skip,
      take: limit
    });

    const total = await prisma.plagiarismResult.count({
      where: {
        doc1: {
          userId
        }
      }
    });

    return {
      data: results,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async getStatistics(userId?: number) {
    const whereClause = userId ? { userId } : {};

    const [
      totalDocuments,
      processedDocuments,
      totalChecks,
      highSimilarityCount,
      averageSimilarity
    ] = await Promise.all([
      prisma.document.count({ where: whereClause }),
      prisma.document.count({ where: { ...whereClause, status: 'PROCESSED' } }),
      prisma.plagiarismResult.count({
        where: userId ? { doc1: { userId } } : {}
      }),
      prisma.plagiarismResult.count({
        where: {
          ...(userId ? { doc1: { userId } } : {}),
          similarity: { gte: 70 }
        }
      }),
      prisma.plagiarismResult.aggregate({
        where: userId ? { doc1: { userId } } : {},
        _avg: { similarity: true }
      })
    ]);

    return {
      totalDocuments,
      processedDocuments,
      totalChecks,
      highSimilarityCount,
      averageSimilarity: averageSimilarity._avg.similarity || 0
    };
  }
}
