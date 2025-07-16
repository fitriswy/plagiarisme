import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// Import routes
import documentRoutes from './routes/document.routes';
import authRoutes from './routes/auth.routes';
import analyticsRoutes from './routes/analytics.routes';

// Import middlewares
import { authenticate } from './middlewares/auth.middleware';
import { generalLimiter, authLimiter } from './middlewares/rateLimiter.middleware';
import { globalErrorHandler } from './errors/errorHandler';

// Import configs
import logger from './configs/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Plagiarism Detection System API',
      version: '1.0.0',
      description: 'API untuk sistem deteksi plagiarisme dengan multiple algoritma',
    },
    servers: [
      {
        url: `http://localhost:${PORT}/api`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'], // Path to the API docs
};

const specs = swaggerJsdoc(swaggerOptions);

// Security middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 
    ['https://yourdomain.com'] : 
    function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Allow localhost with any port for development
      if (origin.match(/^http:\/\/localhost:\d+$/)) {
        return callback(null, true);
      }
      
      // Allow specific production domains
      const allowedOrigins = ['https://yourdomain.com'];
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      return callback(new Error('Not allowed by CORS'));
    },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim())
    }
  }));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api/auth', authLimiter);
app.use('/api', generalLimiter);

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Plagiarism Detection API"
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// 🛡️ Auth routes (public)
app.use('/api/auth', authRoutes);

// 🔐 Protected routes
app.use('/api/upload', authenticate);
app.use('/api/check', authenticate);
app.use('/api/documents', authenticate);
app.use('/api/analytics', authenticate);

// 📄 Main document routes
app.use('/api', documentRoutes);

// 📊 Analytics routes
app.use('/api/analytics', analyticsRoutes);

// Static files for uploaded documents (protected)
app.use('/api/files', authenticate, express.static(path.join(__dirname, '../uploads')));

// 🏠 Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Selamat datang di Sistem Deteksi Plagiarisme!',
    version: '2.0.0',
    features: [
      'Multiple plagiarism detection algorithms',
      'Real-time notifications',
      'Advanced analytics',
      'Secure file handling'
    ],
    documentation: `/api-docs`,
    status: 'active'
  });
});

// 404 handler
app.all('*', (req, res, next) => {
  res.status(404).json({
    status: 'fail',
    message: `Route ${req.originalUrl} tidak ditemukan!`
  });
});

// Global error handler
app.use(globalErrorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// 🚀 Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server ready at http://localhost:${PORT}`);
  logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  logger.info(`🏥 Health Check: http://localhost:${PORT}/health`);
});

export default app;
