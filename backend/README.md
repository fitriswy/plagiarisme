# 🕵️ Plagiarism Detection System Backend

Sistem deteksi plagiarisme canggih dengan multiple algoritma deteksi, real-time notifications, dan advanced analytics.

## ✨ Fitur Utama

- 🔍 **Multiple Algoritma Deteksi**

  - Rabin-Karp (Exact String Matching)
  - Cosine Similarity (Semantic Matching)
  - Jaccard Similarity (Set-based Matching)

- 🔐 **Authentication & Authorization**

  - JWT-based authentication
  - Role-based access control (MAHASISWA, DOSEN, ADMIN)
  - Password strength validation
  - Account verification

- 📄 **File Processing**

  - Support PDF, DOC, DOCX, TXT
  - Advanced text extraction
  - File size validation
  - Secure file handling

- 🛡️ **Security Features**

  - Rate limiting
  - Input validation & sanitization
  - Helmet security headers
  - CORS configuration
  - Error handling

- 📊 **Analytics & Reporting**

  - Real-time dashboard
  - Detailed analytics
  - Export functionality (JSON/CSV)
  - Plagiarism history tracking

- 📧 **Notifications**

  - Email notifications for high similarity
  - Welcome emails
  - Plagiarism reports

- 📚 **API Documentation**
  - Swagger/OpenAPI integration
  - Interactive API explorer

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 13+
- npm atau yarn

### Installation

1. **Clone & Install**

```bash
git clone <repository-url>
cd backend
npm install
```

2. **Environment Setup**

```bash
cp .env.example .env
# Edit .env dengan konfigurasi Anda
```

3. **Database Setup**

```bash
# Create database
createdb plagiarisme_db

# Run migrations
npm run migrate

# Seed sample data
npm run seed
```

4. **Start Development Server**

```bash
npm run dev
```

Server akan berjalan di `http://localhost:1212`

## 🔧 Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/plagiarisme_db"

# Server
PORT=1212
NODE_ENV=development

# Authentication
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,doc,docx,txt

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

## 📖 API Documentation

Akses dokumentasi interaktif di: `http://localhost:1212/api-docs`

### Authentication Endpoints

| Method | Endpoint                    | Description       |
| ------ | --------------------------- | ----------------- |
| POST   | `/api/auth/register`        | Register new user |
| POST   | `/api/auth/login`           | Login user        |
| GET    | `/api/auth/profile`         | Get user profile  |
| PUT    | `/api/auth/profile`         | Update profile    |
| PUT    | `/api/auth/change-password` | Change password   |
| POST   | `/api/auth/logout`          | Logout user       |

### Document Endpoints

| Method | Endpoint             | Description          |
| ------ | -------------------- | -------------------- |
| POST   | `/api/upload`        | Upload document      |
| GET    | `/api/my-documents`  | Get user documents   |
| GET    | `/api/documents/:id` | Get document details |
| PUT    | `/api/documents/:id` | Update document      |
| DELETE | `/api/documents/:id` | Delete document      |

### Plagiarism Endpoints

| Method | Endpoint                          | Description         |
| ------ | --------------------------------- | ------------------- |
| GET    | `/api/check/:id`                  | Check plagiarism    |
| GET    | `/api/plagiarism/:doc1Id/:doc2Id` | Get detailed result |
| GET    | `/api/plagiarism-history`         | Get check history   |
| GET    | `/api/statistics`                 | Get statistics      |
