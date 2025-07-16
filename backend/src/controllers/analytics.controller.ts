import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../errors/errorHandler';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
    role: string;
  };
}

export class AnalyticsController {
  static getDashboardData = asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      console.log('Analytics dashboard request:', { user: req.user });
      
      const userId = req.user?.userId;
      const isAdmin = req.user?.role === 'ADMIN';

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      console.log('User info:', { userId, isAdmin });

      const whereClause = isAdmin ? {} : { userId };

      console.log('Starting database queries...');

      // Get basic statistics - simplified version
      const totalDocuments = await prisma.document.count({ where: whereClause });
      
      const totalChecks = await prisma.plagiarismResult.count();
      
      console.log('Database queries completed');

      // Return simplified response for now
      const dashboardData = {
        totalDocuments,
        processedDocuments: totalDocuments,
        pendingDocuments: 0,
        totalChecks,
        avgSimilarity: 0,
        highSimilarityCount: 0,
        recentChecks: [],
        monthlyTrends: [],
        algorithmStats: []
      };

      console.log('Sending response:', dashboardData);

      res.status(200).json({
        success: true,
        data: dashboardData
      });

    } catch (error) {
      console.error('Analytics dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  static getDetailedAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
    res.status(200).json({
      success: true,
      data: {
        message: 'Detailed analytics coming soon'
      }
    });
  });

  static exportAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
    res.status(200).json({
      success: true,
      data: {
        message: 'Export analytics coming soon'
      }
    });
  });
}
