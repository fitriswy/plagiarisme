import Joi from 'joi';

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Nama harus minimal 2 karakter',
    'string.max': 'Nama maksimal 100 karakter',
    'any.required': 'Nama wajib diisi'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Format email tidak valid',
    'any.required': 'Email wajib diisi'
  }),
  password: Joi.string().min(6).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])')).required().messages({
    'string.min': 'Password harus minimal 6 karakter',
    'string.pattern.base': 'Password harus mengandung huruf kecil, huruf besar, dan angka',
    'any.required': 'Password wajib diisi'
  }),
  role: Joi.string().valid('MAHASISWA', 'DOSEN').default('MAHASISWA').messages({
    'any.only': 'Role harus MAHASISWA atau DOSEN'
  })
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Format email tidak valid',
    'any.required': 'Email wajib diisi'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password wajib diisi'
  })
});

export const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).messages({
    'string.min': 'Nama harus minimal 2 karakter',
    'string.max': 'Nama maksimal 100 karakter'
  }),
  email: Joi.string().email().messages({
    'string.email': 'Format email tidak valid'
  })
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Password saat ini wajib diisi'
  }),
  newPassword: Joi.string().min(6).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])')).required().messages({
    'string.min': 'Password baru harus minimal 6 karakter',
    'string.pattern.base': 'Password baru harus mengandung huruf kecil, huruf besar, dan angka',
    'any.required': 'Password baru wajib diisi'
  }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Konfirmasi password tidak cocok',
    'any.required': 'Konfirmasi password wajib diisi'
  })
});

export const documentUploadSchema = Joi.object({
  title: Joi.string().min(1).max(255).optional().messages({
    'string.min': 'Judul tidak boleh kosong',
    'string.max': 'Judul maksimal 255 karakter'
  })
});
