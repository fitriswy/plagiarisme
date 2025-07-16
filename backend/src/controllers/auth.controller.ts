import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { asyncHandler, AppError } from '../errors/errorHandler';
import { registerSchema, loginSchema, changePasswordSchema } from '../validators/schemas';
import emailService from '../services/email.service';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
    role: string;
  };
}

export class AuthController {
  static register = asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const { name, email, password, role } = value;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new AppError('Email sudah terdaftar', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || '12'));

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'MAHASISWA'
      }
    });

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(email, name);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      status: 'success',
      message: 'Registrasi berhasil!',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      }
    });
  });

  static login = asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const { email, password } = value;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !user.isActive) {
      throw new AppError('Email atau password salah', 401);
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Email atau password salah', 401);
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      status: 'success',
      message: 'Login berhasil!',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          lastLoginAt: user.lastLoginAt
        },
        token
      }
    });
  });

  static getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profileImage: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        _count: {
          select: {
            documents: true
          }
        }
      }
    });

    if (!user) {
      throw new AppError('User tidak ditemukan', 404);
    }

    res.json({
      status: 'success',
      data: { user }
    });
  });

  static updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    const { name, email } = req.body;

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          id: { not: userId }
        }
      });

      if (existingUser) {
        throw new AppError('Email sudah digunakan oleh user lain', 400);
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(email && { email })
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profileImage: true
      }
    });

    res.json({
      status: 'success',
      message: 'Profile berhasil diupdate!',
      data: { user: updatedUser }
    });
  });

  static changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const userId = req.user?.userId;
    const { currentPassword, newPassword } = value;

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new AppError('User tidak ditemukan', 404);
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new AppError('Password saat ini salah', 400);
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS || '12'));

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    res.json({
      status: 'success',
      message: 'Password berhasil diubah!'
    });
  });

  static logout = asyncHandler(async (req: Request, res: Response) => {
    // Note: Untuk JWT, logout biasanya dilakukan di client side
    // Untuk implementasi blacklist token, bisa ditambahkan di sini
    
    res.json({
      status: 'success',
      message: 'Logout berhasil!'
    });
  });
}
