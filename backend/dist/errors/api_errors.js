"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlerAnyError = exports.AppError = void 0;
class AppError extends Error {
    constructor(messsage, statusCode, errors) {
        super(messsage);
        this.errors = errors;
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, AppError.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const handlerAnyError = (error, res) => {
    if (error instanceof AppError) {
        return res.status(error.statusCode || 400).json({
            success: false,
            message: error.message,
            errors: error.errors
        });
    }
    console.log(error.message);
    return res.status(500).json({
        success: false,
        message: "Internal server error"
    });
};
exports.handlerAnyError = handlerAnyError;
