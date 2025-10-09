import { Router } from 'express';
import { 
  uploadDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  updateIndexStatus
} from '../controllers/document.controller';
import { verifyToken } from '../middleware/auth.middleware';
import { upload, handleUploadError } from '../middleware/upload.middleware';

const router = Router();

// All document routes require authentication
router.use(verifyToken);

/**
 * @route   POST /api/documents/upload
 * @desc    Upload a document
 * @access  Private (Project member)
 * @body    { projectId, description? }
 * @file    file (PDF, DOC, DOCX, TXT)
 */
router.post('/upload', upload.single('file'), handleUploadError, uploadDocument);

/**
 * @route   GET /api/documents
 * @desc    Get documents for a project
 * @access  Private (Project member)
 * @query   { projectId }
 */
router.get('/', getDocuments);

/**
 * @route   GET /api/documents/:id
 * @desc    Get document by ID
 * @access  Private (Project member)
 */
router.get('/:id', getDocumentById);

/**
 * @route   PUT /api/documents/:id
 * @desc    Update document
 * @access  Private (Project member)
 * @body    { description? }
 */
router.put('/:id', updateDocument);

/**
 * @route   DELETE /api/documents/:id
 * @desc    Delete document
 * @access  Private (Project member)
 */
router.delete('/:id', deleteDocument);

/**
 * @route   PUT /api/documents/:id/index-status
 * @desc    Update document index status (for AI service)
 * @access  Private (Internal use)
 * @body    { indexStatus, chunkCount?, errorMessage? }
 */
router.put('/:id/index-status', updateIndexStatus);

export default router;
