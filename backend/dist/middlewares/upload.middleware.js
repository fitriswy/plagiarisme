"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const errorHandler_1 = require("../errors/errorHandler");
const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx,txt').split(',');
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB default
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, uniqueSuffix + '-' + path_1.default.basename(file.originalname, ext) + ext);
    }
});
const fileFilter = (req, file, cb) => {
    const ext = path_1.default.extname(file.originalname).toLowerCase().substring(1);
    if (allowedTypes.includes(ext)) {
        cb(null, true);
    }
    else {
        const error = new errorHandler_1.AppError(`Format file tidak diizinkan. Hanya file ${allowedTypes.join(', ')} yang diperbolehkan.`, 400);
        cb(error, false);
    }
};
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: maxFileSize,
        files: 1
    }
});
exports.default = upload;
