"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlagiarismService = void 0;
const client_1 = require("@prisma/client");
const rabinKarp_service_1 = require("./rabinKarp.service");
const email_service_1 = __importDefault(require("./email.service"));
const prisma = new client_1.PrismaClient();
class PlagiarismService {
    // Rabin-Karp algorithm untuk exact matching
    static checkWithRabinKarp(targetContent, otherContent) {
        const sentences = targetContent.split(/[.?!]\s+/).filter(s => s.trim().length > 10);
        const matches = [];
        let matchCount = 0;
        for (const sentence of sentences) {
            if ((0, rabinKarp_service_1.rabinKarp)(otherContent, sentence.trim())) {
                matchCount++;
                matches.push(sentence.trim());
            }
        }
        const similarity = sentences.length > 0 ? (matchCount / sentences.length) * 100 : 0;
        return { similarity, matches };
    }
    // Cosine Similarity untuk semantic matching
    static checkWithCosineSimilarity(targetContent, otherContent) {
        // Preprocessing
        const cleanText = (text) => {
            return text.toLowerCase()
                .replace(/[^\w\s]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        };
        const text1 = cleanText(targetContent);
        const text2 = cleanText(otherContent);
        // Create word frequency vectors
        const words1 = text1.split(' ');
        const words2 = text2.split(' ');
        const allWords = [...new Set([...words1, ...words2])];
        const vector1 = allWords.map(word => words1.filter(w => w === word).length);
        const vector2 = allWords.map(word => words2.filter(w => w === word).length);
        // Calculate cosine similarity
        const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
        const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
        const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));
        if (magnitude1 === 0 || magnitude2 === 0)
            return { similarity: 0, matches: [] };
        const similarity = (dotProduct / (magnitude1 * magnitude2)) * 100;
        // Find common phrases untuk matches
        const phrases1 = text1.split(/[.!?]/).filter(p => p.trim().length > 20);
        const phrases2 = text2.split(/[.!?]/).filter(p => p.trim().length > 20);
        const matches = [];
        phrases1.forEach(phrase1 => {
            phrases2.forEach(phrase2 => {
                const phraseWords1 = phrase1.trim().split(' ');
                const phraseWords2 = phrase2.trim().split(' ');
                const commonWords = phraseWords1.filter(word => phraseWords2.includes(word));
                if (commonWords.length / phraseWords1.length > 0.7) {
                    matches.push(phrase1.trim());
                }
            });
        });
        return { similarity, matches: [...new Set(matches)] };
    }
    // Jaccard Similarity untuk set-based matching
    static checkWithJaccardSimilarity(targetContent, otherContent) {
        const cleanText = (text) => {
            return text.toLowerCase()
                .replace(/[^\w\s]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        };
        const text1 = cleanText(targetContent);
        const text2 = cleanText(otherContent);
        // Create n-grams (3-word sequences)
        const createNGrams = (text, n = 3) => {
            const words = text.split(' ');
            const ngrams = new Set();
            for (let i = 0; i <= words.length - n; i++) {
                ngrams.add(words.slice(i, i + n).join(' '));
            }
            return ngrams;
        };
        const ngrams1 = createNGrams(text1);
        const ngrams2 = createNGrams(text2);
        const intersection = new Set([...ngrams1].filter(x => ngrams2.has(x)));
        const union = new Set([...ngrams1, ...ngrams2]);
        const similarity = union.size > 0 ? (intersection.size / union.size) * 100 : 0;
        const matches = Array.from(intersection);
        return { similarity, matches };
    }
    static async checkPlagiarism(docId, algorithm = 'RABIN_KARP') {
        const targetDoc = await prisma.document.findUnique({
            where: { id: docId },
            include: { user: true }
        });
        if (!targetDoc)
            throw new Error('Dokumen tidak ditemukan.');
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
        const results = [];
        for (const otherDoc of allDocs) {
            let result;
            switch (algorithm) {
                case 'COSINE_SIMILARITY':
                    result = this.checkWithCosineSimilarity(targetDoc.content, otherDoc.content);
                    break;
                case 'JACCARD':
                    result = this.checkWithJaccardSimilarity(targetDoc.content, otherDoc.content);
                    break;
                default:
                    result = this.checkWithRabinKarp(targetDoc.content, otherDoc.content);
            }
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
                    algorithm,
                    checkedAt: new Date()
                },
                create: {
                    doc1Id: docId,
                    doc2Id: otherDoc.id,
                    similarity: result.similarity,
                    matchedText: result.matches.join('\n---\n'),
                    algorithm,
                }
            });
            results.push({
                doc2Id: otherDoc.id,
                doc2Title: otherDoc.title,
                similarity: result.similarity,
                matchedSegments: result.matches,
                algorithm
            });
        }
        // Kirim email notifikasi jika ada similarity tinggi
        const highSimilarity = results.find(r => r.similarity > 70);
        if (highSimilarity && targetDoc.user.email) {
            try {
                await email_service_1.default.sendPlagiarismReport(targetDoc.user.email, targetDoc.title, highSimilarity.similarity);
            }
            catch (error) {
                console.error('Failed to send plagiarism report email:', error);
            }
        }
        return results.sort((a, b) => b.similarity - a.similarity);
    }
    static async getDetailedResult(doc1Id, doc2Id) {
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
        if (!result)
            throw new Error('Hasil plagiarisme tidak ditemukan.');
        return {
            ...result,
            matchedSegments: result.matchedText ? result.matchedText.split('\n---\n') : []
        };
    }
    static async getPlagiarismHistory(userId, page = 1, limit = 10) {
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
    static async getStatistics(userId) {
        const whereClause = userId ? { userId } : {};
        const [totalDocuments, processedDocuments, totalChecks, highSimilarityCount, averageSimilarity] = await Promise.all([
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
exports.PlagiarismService = PlagiarismService;
