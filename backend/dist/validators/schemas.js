"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentUploadSchema = exports.changePasswordSchema = exports.updateProfileSchema = exports.loginSchema = exports.registerSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.registerSchema = joi_1.default.object({
    name: joi_1.default.string().min(2).max(100).required().messages({
        'string.min': 'Nama harus minimal 2 karakter',
        'string.max': 'Nama maksimal 100 karakter',
        'any.required': 'Nama wajib diisi'
    }),
    email: joi_1.default.string().email().required().messages({
        'string.email': 'Format email tidak valid',
        'any.required': 'Email wajib diisi'
    }),
    password: joi_1.default.string().min(6).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])')).required().messages({
        'string.min': 'Password harus minimal 6 karakter',
        'string.pattern.base': 'Password harus mengandung huruf kecil, huruf besar, dan angka',
        'any.required': 'Password wajib diisi'
    }),
    role: joi_1.default.string().valid('MAHASISWA', 'DOSEN').default('MAHASISWA').messages({
        'any.only': 'Role harus MAHASISWA atau DOSEN'
    })
});
exports.loginSchema = joi_1.default.object({
    email: joi_1.default.string().email().required().messages({
        'string.email': 'Format email tidak valid',
        'any.required': 'Email wajib diisi'
    }),
    password: joi_1.default.string().required().messages({
        'any.required': 'Password wajib diisi'
    })
});
exports.updateProfileSchema = joi_1.default.object({
    name: joi_1.default.string().min(2).max(100).messages({
        'string.min': 'Nama harus minimal 2 karakter',
        'string.max': 'Nama maksimal 100 karakter'
    }),
    email: joi_1.default.string().email().messages({
        'string.email': 'Format email tidak valid'
    })
});
exports.changePasswordSchema = joi_1.default.object({
    currentPassword: joi_1.default.string().required().messages({
        'any.required': 'Password saat ini wajib diisi'
    }),
    newPassword: joi_1.default.string().min(6).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])')).required().messages({
        'string.min': 'Password baru harus minimal 6 karakter',
        'string.pattern.base': 'Password baru harus mengandung huruf kecil, huruf besar, dan angka',
        'any.required': 'Password baru wajib diisi'
    }),
    confirmPassword: joi_1.default.string().valid(joi_1.default.ref('newPassword')).required().messages({
        'any.only': 'Konfirmasi password tidak cocok',
        'any.required': 'Konfirmasi password wajib diisi'
    })
});
exports.documentUploadSchema = joi_1.default.object({
    title: joi_1.default.string().min(1).max(255).optional().messages({
        'string.min': 'Judul tidak boleh kosong',
        'string.max': 'Judul maksimal 255 karakter'
    })
});
