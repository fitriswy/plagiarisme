"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = exports.asyncHandler = exports.AppError = void 0;
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    }
    else {
        let error = { ...err };
        error.message = err.message;
        // Handle Prisma errors
        if (err.code === 'P2002') {
            error = handleDuplicateFieldsDB(err);
        }
        if (err.code === 'P2025') {
            error = handleRecordNotFoundDB(err);
        }
        if (err.code === 'P2003') {
            error = handleForeignKeyConstraintDB(err);
        }
        // Handle JWT errors
        if (err.name === 'JsonWebTokenError') {
            error = handleJWTError();
        }
        if (err.name === 'TokenExpiredError') {
            error = handleJWTExpiredError();
        }
        // Handle Multer errors
        if (err.code === 'LIMIT_FILE_SIZE') {
            error = handleFileSizeError();
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            error = handleUnexpectedFileError();
        }
        sendErrorProd(error, res);
    }
};
exports.globalErrorHandler = globalErrorHandler;
const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack,
    });
};
const sendErrorProd = (err, res) => {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    }
    else {
        // Programming or other unknown error: don't leak error details
        console.error('ERROR 💥', err);
        res.status(500).json({
            status: 'error',
            message: 'Terjadi kesalahan pada server!',
        });
    }
};
const handleDuplicateFieldsDB = (err) => {
    const value = err.meta?.target;
    const message = `Data dengan ${value} sudah ada. Gunakan data yang berbeda!`;
    return new AppError(message, 400);
};
const handleRecordNotFoundDB = (err) => {
    const message = 'Data tidak ditemukan.';
    return new AppError(message, 404);
};
const handleForeignKeyConstraintDB = (err) => {
    const message = 'Tidak dapat menghapus data karena masih digunakan oleh data lain.';
    return new AppError(message, 400);
};
const handleJWTError = () => new AppError('Token tidak valid. Silakan login kembali!', 401);
const handleJWTExpiredError = () => new AppError('Token telah kadaluarsa. Silakan login kembali!', 401);
const handleFileSizeError = () => new AppError('File terlalu besar. Maksimal 10MB.', 400);
const handleUnexpectedFileError = () => new AppError('Field file tidak sesuai.', 400);
