"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../errors/errorHandler");
const prisma = new client_1.PrismaClient();
class AnalyticsController {
}
exports.AnalyticsController = AnalyticsController;
_a = AnalyticsController;
AnalyticsController.getDashboardData = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const isAdmin = req.user?.role === 'ADMIN';
    const whereClause = isAdmin ? {} : { userId };
    // Get basic statistics
    const [totalDocuments, processedDocuments, pendingDocuments, totalChecks, highSimilarityCount, recentChecks] = await Promise.all([
        // Total documents
        prisma.document.count({ where: whereClause }),
        // Processed documents
        prisma.document.count({
            where: { ...whereClause, status: 'PROCESSED' }
        }),
        // Pending documents
        prisma.document.count({
            where: { ...whereClause, status: 'PENDING' }
        }),
        // Total plagiarism checks
        prisma.plagiarismResult.count({
            where: isAdmin ? {} : { doc1: { userId } }
        }),
        // High similarity count (>70%)
        prisma.plagiarismResult.count({
            where: {
                ...(isAdmin ? {} : { doc1: { userId } }),
                similarity: { gte: 70 }
            }
        }),
        // Recent checks (last 7 days)
        prisma.plagiarismResult.findMany({
            where: {
                ...(isAdmin ? {} : { doc1: { userId } }),
                checkedAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                }
            },
            include: {
                doc1: { select: { title: true } },
                doc2: { select: { title: true } }
            },
            orderBy: { checkedAt: 'desc' },
            take: 10
        })
    ]);
    // Calculate average similarity
    const avgSimilarity = await prisma.plagiarismResult.aggregate({
        where: isAdmin ? {} : { doc1: { userId } },
        _avg: { similarity: true }
    });
    // Get monthly upload trends (last 12 months)
    const monthlyUploads = await prisma.$queryRaw `
      SELECT 
        DATE_TRUNC('month', "uploadedAt") as month,
        COUNT(*)::integer as count
      FROM documents 
      WHERE "uploadedAt" >= NOW() - INTERVAL '12 months'
      ${isAdmin ? prisma.$queryRaw `` : prisma.$queryRaw `AND "userId" = ${userId}`}
      GROUP BY DATE_TRUNC('month', "uploadedAt")
      ORDER BY month DESC
    `;
    // Get similarity distribution
    const similarityDistribution = await prisma.$queryRaw `
      SELECT 
        CASE 
          WHEN similarity >= 90 THEN 'Very High (90-100%)'
          WHEN similarity >= 70 THEN 'High (70-89%)'
          WHEN similarity >= 50 THEN 'Medium (50-69%)'
          WHEN similarity >= 30 THEN 'Low (30-49%)'
          ELSE 'Very Low (0-29%)'
        END as range,
        COUNT(*)::integer as count
      FROM plagiarism_results pr
      ${isAdmin ?
        prisma.$queryRaw `` :
        prisma.$queryRaw `JOIN documents d ON pr."doc1Id" = d.id WHERE d."userId" = ${userId}`}
      GROUP BY range
      ORDER BY 
        CASE 
          WHEN range = 'Very High (90-100%)' THEN 1
          WHEN range = 'High (70-89%)' THEN 2
          WHEN range = 'Medium (50-69%)' THEN 3
          WHEN range = 'Low (30-49%)' THEN 4
          ELSE 5
        END
    `;
    // Get top similar documents
    const topSimilarResults = await prisma.plagiarismResult.findMany({
        where: isAdmin ? {} : { doc1: { userId } },
        include: {
            doc1: { select: { title: true } },
            doc2: { select: { title: true } }
        },
        orderBy: { similarity: 'desc' },
        take: 5
    });
    res.json({
        status: 'success',
        data: {
            overview: {
                totalDocuments,
                processedDocuments,
                pendingDocuments,
                totalChecks,
                highSimilarityCount,
                averageSimilarity: Math.round((avgSimilarity._avg.similarity || 0) * 100) / 100
            },
            trends: {
                monthlyUploads,
                similarityDistribution
            },
            recent: {
                checks: recentChecks.map(check => ({
                    id: check.id,
                    doc1Title: check.doc1.title,
                    doc2Title: check.doc2.title,
                    similarity: Math.round(check.similarity * 100) / 100,
                    algorithm: check.algorithm,
                    checkedAt: check.checkedAt
                })),
                topSimilar: topSimilarResults.map(result => ({
                    doc1Title: result.doc1.title,
                    doc2Title: result.doc2.title,
                    similarity: Math.round(result.similarity * 100) / 100,
                    checkedAt: result.checkedAt
                }))
            }
        }
    });
});
AnalyticsController.getDetailedAnalytics = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const isAdmin = req.user?.role === 'ADMIN';
    const { startDate, endDate, algorithm } = req.query;
    const whereClause = isAdmin ? {} : { doc1: { userId } };
    if (startDate && endDate) {
        whereClause.checkedAt = {
            gte: new Date(startDate),
            lte: new Date(endDate)
        };
    }
    if (algorithm) {
        whereClause.algorithm = algorithm;
    }
    // Algorithm performance comparison
    const algorithmStats = await prisma.plagiarismResult.groupBy({
        by: ['algorithm'],
        where: whereClause,
        _count: { _all: true },
        _avg: { similarity: true },
        _max: { similarity: true },
        _min: { similarity: true }
    });
    // Daily check trends
    const dailyTrends = await prisma.$queryRaw `
      SELECT 
        DATE("checkedAt") as date,
        COUNT(*)::integer as checks,
        AVG(similarity)::float as avg_similarity
      FROM plagiarism_results pr
      ${isAdmin ?
        prisma.$queryRaw `` :
        prisma.$queryRaw `JOIN documents d ON pr."doc1Id" = d.id`}
      WHERE 1=1
      ${startDate && endDate ?
        prisma.$queryRaw `AND pr."checkedAt" BETWEEN ${new Date(startDate)} AND ${new Date(endDate)}` :
        prisma.$queryRaw `AND pr."checkedAt" >= NOW() - INTERVAL '30 days'`}
      ${isAdmin ? prisma.$queryRaw `` : prisma.$queryRaw `AND d."userId" = ${userId}`}
      GROUP BY DATE("checkedAt")
      ORDER BY date DESC
      LIMIT 30
    `;
    // Most checked documents
    const popularDocuments = await prisma.document.findMany({
        where: isAdmin ? {} : { userId },
        include: {
            _count: {
                select: {
                    plagiarismResults1: true,
                    plagiarismResults2: true
                }
            }
        },
        orderBy: {
            plagiarismResults1: {
                _count: 'desc'
            }
        },
        take: 10
    });
    res.json({
        status: 'success',
        data: {
            algorithmStats: algorithmStats.map(stat => ({
                algorithm: stat.algorithm,
                totalChecks: stat._count._all,
                averageSimilarity: Math.round((stat._avg.similarity || 0) * 100) / 100,
                maxSimilarity: Math.round((stat._max.similarity || 0) * 100) / 100,
                minSimilarity: Math.round((stat._min.similarity || 0) * 100) / 100
            })),
            dailyTrends,
            popularDocuments: popularDocuments.map(doc => ({
                id: doc.id,
                title: doc.title,
                uploadedAt: doc.uploadedAt,
                checksAsSource: doc._count.plagiarismResults1,
                checksAsTarget: doc._count.plagiarismResults2,
                totalChecks: doc._count.plagiarismResults1 + doc._count.plagiarismResults2
            }))
        }
    });
});
AnalyticsController.exportAnalytics = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const isAdmin = req.user?.role === 'ADMIN';
    const { format = 'json', startDate, endDate } = req.query;
    const whereClause = isAdmin ? {} : { doc1: { userId } };
    if (startDate && endDate) {
        whereClause.checkedAt = {
            gte: new Date(startDate),
            lte: new Date(endDate)
        };
    }
    const data = await prisma.plagiarismResult.findMany({
        where: whereClause,
        include: {
            doc1: {
                select: {
                    title: true,
                    originalName: true,
                    uploadedAt: true,
                    user: { select: { name: true, email: true } }
                }
            },
            doc2: {
                select: {
                    title: true,
                    originalName: true,
                    uploadedAt: true,
                    user: { select: { name: true, email: true } }
                }
            }
        },
        orderBy: { checkedAt: 'desc' }
    });
    const exportData = data.map(result => ({
        checkId: result.id,
        sourceDocument: result.doc1.title,
        sourceOriginalName: result.doc1.originalName,
        sourceUploadedAt: result.doc1.uploadedAt,
        sourceUser: result.doc1.user.name,
        targetDocument: result.doc2.title,
        targetOriginalName: result.doc2.originalName,
        targetUploadedAt: result.doc2.uploadedAt,
        targetUser: result.doc2.user.name,
        similarity: result.similarity,
        algorithm: result.algorithm,
        checkedAt: result.checkedAt
    }));
    if (format === 'csv') {
        const csvHeaders = Object.keys(exportData[0] || {}).join(',');
        const csvRows = exportData.map(row => Object.values(row).map(val => typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val).join(','));
        const csvContent = [csvHeaders, ...csvRows].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="plagiarism-analytics-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvContent);
    }
    else {
        res.json({
            status: 'success',
            data: exportData,
            meta: {
                totalRecords: exportData.length,
                exportedAt: new Date().toISOString(),
                dateRange: { startDate, endDate }
            }
        });
    }
});
