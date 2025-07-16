import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';

const router = Router();

/**
 * @swagger
 * /analytics/dashboard:
 *   get:
 *     summary: Get dashboard analytics data
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalDocuments:
 *                       type: number
 *                     processedDocuments:
 *                       type: number
 *                     pendingDocuments:
 *                       type: number
 *                     totalChecks:
 *                       type: number
 *                     avgSimilarity:
 *                       type: number
 *                     highSimilarityCount:
 *                       type: number
 *                     recentChecks:
 *                       type: array
 *                       items:
 *                         type: object
 */
router.get('/dashboard', AnalyticsController.getDashboardData);

/**
 * @swagger
 * /analytics/detailed:
 *   get:
 *     summary: Get detailed analytics statistics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Detailed analytics statistics
 */
router.get('/detailed', AnalyticsController.getDetailedAnalytics);

/**
 * @swagger
 * /analytics/export:
 *   get:
 *     summary: Export analytics data
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Exported analytics data
 */
router.get('/export', AnalyticsController.exportAnalytics);

export default router;
