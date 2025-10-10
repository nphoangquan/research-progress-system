import { Router } from 'express';
import {
  uploadAttachment,
  getAttachments,
  deleteAttachment,
  updateAttachment
} from '../controllers/taskAttachment.controller';
import { verifyToken } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

// All attachment routes require authentication
router.use(verifyToken);

/**
 * @route   POST /api/task-attachments/:taskId/upload
 * @desc    Upload attachment to a task
 * @access  Private (Project member)
 * @body    { file: File, description?: string }
 */
router.post('/:taskId/upload', upload.single('file'), uploadAttachment);

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
