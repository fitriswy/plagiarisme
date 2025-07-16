import rateLimit from 'express-rate-limit';

// General rate limiter
export const generalLimiter = rateLimit({
  windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW || '15')) * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // limit each IP to 100 requests per windowMs
  message: {
    error: 'Terlalu banyak request dari IP ini, coba lagi nanti.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for auth
  message: {
    error: 'Terlalu banyak percobaan login, coba lagi dalam 15 menit.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// File upload rate limiter
export const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // limit each IP to 10 uploads per windowMs
  message: {
    error: 'Terlalu banyak upload, coba lagi dalam 10 menit.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Plagiarism check rate limiter
export const plagiarismLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 20, // limit each IP to 20 plagiarism checks per windowMs
  message: {
    error: 'Terlalu banyak cek plagiarisme, coba lagi dalam 30 menit.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
