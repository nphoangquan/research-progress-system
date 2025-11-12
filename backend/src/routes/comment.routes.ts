import { Router } from 'express';
import { 
  getComments,
  addComment,
  updateComment,
  deleteComment
} from '../controllers/comment.controller';
import { verifyToken } from '../middleware/auth.middleware';
import { validate, commentSchemas } from '../middleware/validation.middleware';

const router = Router();

// All comment routes require authentication
router.use(verifyToken);

/**
 * @route   GET /api/comments/task/:taskId
 * @desc    Get comments for a task
 * @access  Private (Project member)
 */
router.get('/task/:taskId', getComments);

/**
 * @route   POST /api/comments/task/:taskId
 * @desc    Add a comment to a task
 * @access  Private (Project member)
 * @body    { content }
 */
router.post('/task/:taskId', validate(commentSchemas.create), addComment);

/**
 * @route   PUT /api/comments/:commentId
 * @desc    Update a comment
 * @access  Private (Comment author, Lecturer, Admin)
 * @body    { content }
 */
router.put('/:commentId', validate(commentSchemas.update), updateComment);

/**
 * @route   DELETE /api/comments/:commentId
 * @desc    Delete a comment
 * @access  Private (Comment author, Lecturer, Admin)
 */
router.delete('/:commentId', deleteComment);

export default router;
