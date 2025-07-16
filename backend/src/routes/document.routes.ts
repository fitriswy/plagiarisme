import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { uploadLimiter, plagiarismLimiter } from '../middlewares/rateLimiter.middleware';
import upload from '../middlewares/upload.middleware';

const router = Router();

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Upload document for plagiarism check
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               title:
 *                 type: string
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *       400:
 *         description: Invalid file or validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/upload', authenticate, uploadLimiter, upload.single('file'), DocumentController.uploadDocument);

/**
 * @swagger
 * /check/{id}:
 *   get:
 *     summary: Check document for plagiarism
 *     tags: [Plagiarism]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Document ID
 *       - in: query
 *         name: algorithm
 *         schema:
 *           type: string
 *           enum: [RABIN_KARP, COSINE_SIMILARITY, JACCARD]
 *         description: Plagiarism detection algorithm
 *     responses:
 *       200:
 *         description: Plagiarism check completed
 *       404:
 *         description: Document not found
 *       403:
 *         description: Access denied
 */
router.get('/check/:id', authenticate, plagiarismLimiter, DocumentController.checkPlagiarism);

/**
 * @swagger
 * /plagiarism/{doc1Id}/{doc2Id}:
 *   get:
 *     summary: Get detailed plagiarism result between two documents
 *     tags: [Plagiarism]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doc1Id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: doc2Id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detailed plagiarism result
 *       404:
 *         description: Document or result not found
 *       403:
 *         description: Access denied
 */
router.get('/plagiarism/:doc1Id/:doc2Id', authenticate, DocumentController.getDetailedResult);

/**
 * @swagger
 * /my-documents:
 *   get:
 *     summary: Get user's documents with pagination
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PROCESSED, ERROR]
 *     responses:
 *       200:
 *         description: User documents retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/my-documents', authenticate, DocumentController.getUserDocuments);

/**
 * @swagger
 * /documents:
 *   get:
 *     summary: Get recent documents with limit (alias for my-documents)
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *     responses:
 *       200:
 *         description: Recent documents retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/documents', authenticate, DocumentController.getUserDocuments);

/**
 * @swagger
 * /documents/{id}:
 *   get:
 *     summary: Get document details
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Document details
 *       404:
 *         description: Document not found
 *       403:
 *         description: Access denied
 */
router.get('/documents/:id', authenticate, DocumentController.getDocument);

/**
 * @swagger
 * /documents/{id}:
 *   put:
 *     summary: Update document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *     responses:
 *       200:
 *         description: Document updated successfully
 *       404:
 *         description: Document not found
 *       403:
 *         description: Access denied
 */
router.put('/documents/:id', authenticate, DocumentController.updateDocument);

/**
 * @swagger
 * /documents/{id}:
 *   delete:
 *     summary: Delete document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *       404:
 *         description: Document not found
 *       403:
 *         description: Access denied
 */
router.delete('/documents/:id', authenticate, DocumentController.deleteDocument);

/**
 * @swagger
 * /plagiarism-history:
 *   get:
 *     summary: Get plagiarism check history
 *     tags: [Plagiarism]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Plagiarism history retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/plagiarism-history', authenticate, DocumentController.getPlagiarismHistory);

/**
 * @swagger
 * /statistics:
 *   get:
 *     summary: Get user statistics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/statistics', authenticate, DocumentController.getStatistics);

export default router;
