"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.plagiarismLimiter = exports.uploadLimiter = exports.authLimiter = exports.generalLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// General rate limiter
exports.generalLimiter = (0, express_rate_limit_1.default)({
    windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW || '15')) * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // limit each IP to 100 requests per windowMs
    message: {
        error: 'Terlalu banyak request dari IP ini, coba lagi nanti.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Strict rate limiter for auth endpoints
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs for auth
    message: {
        error: 'Terlalu banyak percobaan login, coba lagi dalam 15 menit.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// File upload rate limiter
exports.uploadLimiter = (0, express_rate_limit_1.default)({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 10, // limit each IP to 10 uploads per windowMs
    message: {
        error: 'Terlalu banyak upload, coba lagi dalam 10 menit.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Plagiarism check rate limiter
exports.plagiarismLimiter = (0, express_rate_limit_1.default)({
    windowMs: 30 * 60 * 1000, // 30 minutes
    max: 20, // limit each IP to 20 plagiarism checks per windowMs
    message: {
        error: 'Terlalu banyak cek plagiarisme, coba lagi dalam 30 menit.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
