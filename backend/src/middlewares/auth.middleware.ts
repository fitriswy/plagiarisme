import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AppError, asyncHandler } from '../errors/errorHandler';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    email: string;
    role: string;
    iat?: number;
    exp?: number;
  };
}

export const authenticate = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  console.log('Auth middleware - Headers:', {
    authorization: authHeader,
    userAgent: req.headers['user-agent'],
    path: req.path
  });
  
  if (!authHeader?.startsWith('Bearer ')) {
    console.log('Auth failed: No Bearer token');
    throw new AppError('Token tidak ditemukan. Silakan login kembali.', 401);
  }

  const token = authHeader.split(' ')[1];
  
  console.log('Auth middleware - Token received:', {
    tokenLength: token?.length,
    tokenStart: token?.substring(0, 20) + '...',
    hasJwtSecret: !!process.env.JWT_SECRET
  });
  
  try {
    // Verify JWT token
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    console.log('Auth middleware - Token verified:', {
      userId: payload.userId,
      email: payload.email,
      role: payload.role
    });
    
    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { 
        id: payload.userId,
        isActive: true 
      },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        emailVerified: true
      }
    });

    if (!user) {
      throw new AppError('User tidak ditemukan atau tidak aktif.', 401);
    }

    // Attach user info to request
    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      iat: payload.iat,
      exp: payload.exp
    };

    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      throw new AppError('Token tidak valid. Silakan login kembali.', 401);
    }
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Token telah kadaluarsa. Silakan login kembali.', 401);
    }
    throw error;
  }
});

export const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Tidak terautentikasi.', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError('Anda tidak memiliki akses untuk endpoint ini.', 403);
    }

    next();
  };
};

export const optionalAuth = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return next(); // Continue without authentication
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const user = await prisma.user.findUnique({
      where: { 
        id: payload.userId,
        isActive: true 
      },
      select: {
        id: true,
        email: true,
        role: true
      }
    });

    if (user) {
      req.user = {
        userId: user.id,
        email: user.email,
        role: user.role
      };
    }
  } catch (error) {
    // Ignore errors for optional auth
  }

  next();
});
