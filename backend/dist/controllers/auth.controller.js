"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errorHandler_1 = require("../errors/errorHandler");
const schemas_1 = require("../validators/schemas");
const email_service_1 = __importDefault(require("../services/email.service"));
const prisma = new client_1.PrismaClient();
class AuthController {
}
exports.AuthController = AuthController;
_a = AuthController;
AuthController.register = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { error, value } = schemas_1.registerSchema.validate(req.body);
    if (error) {
        throw new errorHandler_1.AppError(error.details[0].message, 400);
    }
    const { name, email, password, role } = value;
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email }
    });
    if (existingUser) {
        throw new errorHandler_1.AppError('Email sudah terdaftar', 400);
    }
    // Hash password
    const hashedPassword = await bcrypt_1.default.hash(password, parseInt(process.env.BCRYPT_ROUNDS || '12'));
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
        await email_service_1.default.sendWelcomeEmail(email, name);
    }
    catch (error) {
        console.error('Failed to send welcome email:', error);
    }
    // Generate JWT token
    const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
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
AuthController.login = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { error, value } = schemas_1.loginSchema.validate(req.body);
    if (error) {
        throw new errorHandler_1.AppError(error.details[0].message, 400);
    }
    const { email, password } = value;
    // Find user
    const user = await prisma.user.findUnique({
        where: { email }
    });
    if (!user || !user.isActive) {
        throw new errorHandler_1.AppError('Email atau password salah', 401);
    }
    // Check password
    const isPasswordValid = await bcrypt_1.default.compare(password, user.password);
    if (!isPasswordValid) {
        throw new errorHandler_1.AppError('Email atau password salah', 401);
    }
    // Update last login
    await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
    });
    // Generate JWT token
    const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
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
AuthController.getProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
        throw new errorHandler_1.AppError('User tidak ditemukan', 404);
    }
    res.json({
        status: 'success',
        data: { user }
    });
});
AuthController.updateProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
            throw new errorHandler_1.AppError('Email sudah digunakan oleh user lain', 400);
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
AuthController.changePassword = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { error, value } = schemas_1.changePasswordSchema.validate(req.body);
    if (error) {
        throw new errorHandler_1.AppError(error.details[0].message, 400);
    }
    const userId = req.user?.userId;
    const { currentPassword, newPassword } = value;
    // Get current user
    const user = await prisma.user.findUnique({
        where: { id: userId }
    });
    if (!user) {
        throw new errorHandler_1.AppError('User tidak ditemukan', 404);
    }
    // Verify current password
    const isCurrentPasswordValid = await bcrypt_1.default.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
        throw new errorHandler_1.AppError('Password saat ini salah', 400);
    }
    // Hash new password
    const hashedNewPassword = await bcrypt_1.default.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS || '12'));
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
AuthController.logout = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // Note: Untuk JWT, logout biasanya dilakukan di client side
    // Untuk implementasi blacklist token, bisa ditambahkan di sini
    res.json({
        status: 'success',
        message: 'Logout berhasil!'
    });
});
