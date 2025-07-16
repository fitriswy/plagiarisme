"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../errors/errorHandler");
const prisma = new client_1.PrismaClient();
exports.authenticate = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        throw new errorHandler_1.AppError('Token tidak ditemukan. Silakan login kembali.', 401);
    }
    const token = authHeader.split(' ')[1];
    try {
        // Verify JWT token
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
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
            throw new errorHandler_1.AppError('User tidak ditemukan atau tidak aktif.', 401);
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
    }
    catch (error) {
        if (error.name === 'JsonWebTokenError') {
            throw new errorHandler_1.AppError('Token tidak valid. Silakan login kembali.', 401);
        }
        if (error.name === 'TokenExpiredError') {
            throw new errorHandler_1.AppError('Token telah kadaluarsa. Silakan login kembali.', 401);
        }
        throw error;
    }
});
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new errorHandler_1.AppError('Tidak terautentikasi.', 401);
        }
        if (!roles.includes(req.user.role)) {
            throw new errorHandler_1.AppError('Anda tidak memiliki akses untuk endpoint ini.', 403);
        }
        next();
    };
};
exports.authorize = authorize;
exports.optionalAuth = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return next(); // Continue without authentication
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
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
    }
    catch (error) {
        // Ignore errors for optional auth
    }
    next();
});
