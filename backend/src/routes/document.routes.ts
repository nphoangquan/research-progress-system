import { Router } from 'express';
import { 
  uploadDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  updateIndexStatus,
  getDocumentStats
} from '../controllers/document.controller';
import { verifyToken } from '../middleware/auth.middleware';
import { upload, handleUploadError } from '../middleware/upload.middleware';

const router = Router();

// All document routes require authentication
router.use(verifyToken);

router.post('/upload', upload.single('file'), handleUploadError, uploadDocument);
router.get('/', getDocuments);
router.get('/stats', getDocumentStats);
router.get('/:id', getDocumentById);
router.put('/:id', updateDocument);
router.delete('/:id', deleteDocument);
router.put('/:id/index-status', updateIndexStatus);

export default router;
