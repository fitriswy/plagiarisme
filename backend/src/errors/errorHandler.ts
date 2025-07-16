import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
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

const sendErrorDev = (err: any, res: Response) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err: any, res: Response) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥', err);
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server!',
    });
  }
};

const handleDuplicateFieldsDB = (err: any) => {
  const value = err.meta?.target;
  const message = `Data dengan ${value} sudah ada. Gunakan data yang berbeda!`;
  return new AppError(message, 400);
};

const handleRecordNotFoundDB = (err: any) => {
  const message = 'Data tidak ditemukan.';
  return new AppError(message, 404);
};

const handleForeignKeyConstraintDB = (err: any) => {
  const message = 'Tidak dapat menghapus data karena masih digunakan oleh data lain.';
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Token tidak valid. Silakan login kembali!', 401);

const handleJWTExpiredError = () =>
  new AppError('Token telah kadaluarsa. Silakan login kembali!', 401);

const handleFileSizeError = () =>
  new AppError('File terlalu besar. Maksimal 10MB.', 400);

const handleUnexpectedFileError = () =>
  new AppError('Field file tidak sesuai.', 400);
