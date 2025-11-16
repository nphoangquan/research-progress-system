import { Router } from 'express';
import {
  uploadAttachment,
  uploadMultipleAttachments,
  getAttachments,
  deleteAttachment,
  updateAttachment
} from '../controllers/taskAttachment.controller';
import { verifyToken } from '../middleware/auth.middleware';
import { upload, uploadMultiple, handleUploadError } from '../middleware/upload.middleware';

const router = Router();

// All attachment routes require authentication
router.use(verifyToken);

/**
 * @route   POST /api/task-attachments/:taskId/upload
 * @desc    Upload attachment to a task
 * @access  Private (Project member)
 * @body    { file: File, description?: string }
 */
router.post('/:taskId/upload', upload.single('file'), handleUploadError, uploadAttachment);

/**
 * @route   POST /api/task-attachments/:taskId/upload-multiple
 * @desc    Upload multiple attachments to a task
 * @access  Private (Project member)
 * @body    { files: File[], descriptions?: string[] }
 */
router.post('/:taskId/upload-multiple', uploadMultiple.array('files', 10), handleUploadError, uploadMultipleAttachments);

/**
 * @route   GET /api/task-attachments/:taskId
 * @desc    Get all attachments for a task
 * @access  Private (Project member)
 */
router.get('/:taskId', getAttachments);

/**
 * @route   PUT /api/task-attachments/:attachmentId
 * @desc    Update attachment description
 * @access  Private (Attachment owner or Lecturer/Admin)
 * @body    { description?: string }
 */
router.put('/:attachmentId', updateAttachment);

/**
 * @route   DELETE /api/task-attachments/:attachmentId
 * @desc    Delete an attachment
 * @access  Private (Attachment owner or Lecturer/Admin)
 */
router.delete('/:attachmentId', deleteAttachment);

export default router;
