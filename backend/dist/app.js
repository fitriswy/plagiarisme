"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
// Import routes
const document_routes_1 = __importDefault(require("./routes/document.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
// Import middlewares
const auth_middleware_1 = require("./middlewares/auth.middleware");
const rateLimiter_middleware_1 = require("./middlewares/rateLimiter.middleware");
const errorHandler_1 = require("./errors/errorHandler");
// Import configs
const logger_1 = __importDefault(require("./configs/logger"));
dotenv_1.default.config();
const app = (0, express_1.default)();
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
const specs = (0, swagger_jsdoc_1.default)(swaggerOptions);
// Security middlewares
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production' ?
        ['https://yourdomain.com'] :
        ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));
// Logging
if (process.env.NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
else {
    app.use((0, morgan_1.default)('combined', {
        stream: {
            write: (message) => logger_1.default.info(message.trim())
        }
    }));
}
// Body parsing
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Rate limiting
app.use('/api/auth', rateLimiter_middleware_1.authLimiter);
app.use('/api', rateLimiter_middleware_1.generalLimiter);
// API Documentation
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(specs, {
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
app.use('/api/auth', auth_routes_1.default);
// 🔐 Protected routes
app.use('/api/upload', auth_middleware_1.authenticate);
app.use('/api/check', auth_middleware_1.authenticate);
app.use('/api/documents', auth_middleware_1.authenticate);
// 📄 Main document routes
app.use('/api', document_routes_1.default);
// Static files for uploaded documents (protected)
app.use('/api/files', auth_middleware_1.authenticate, express_1.default.static(path_1.default.join(__dirname, '../uploads')));
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
app.use(errorHandler_1.globalErrorHandler);
// Graceful shutdown
process.on('SIGTERM', () => {
    logger_1.default.info('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});
process.on('SIGINT', () => {
    logger_1.default.info('SIGINT received, shutting down gracefully...');
    process.exit(0);
});
// 🚀 Start server
app.listen(PORT, () => {
    logger_1.default.info(`🚀 Server ready at http://localhost:${PORT}`);
    logger_1.default.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    logger_1.default.info(`🏥 Health Check: http://localhost:${PORT}/health`);
});
exports.default = app;
