import multer from 'multer';
import path from 'path';
import { AppError } from '../errors/errorHandler';

const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx,txt').split(',');
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB default

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + '-' + path.basename(file.originalname, ext) + ext);
  }
});

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase().substring(1);
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    const error = new AppError(
      `Format file tidak diizinkan. Hanya file ${allowedTypes.join(', ')} yang diperbolehkan.`,
      400
    );
    cb(error as any, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxFileSize,
    files: 1
  }
});

export default upload;
