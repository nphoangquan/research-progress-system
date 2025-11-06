import { Router } from 'express';
import {
  getLabels,
  createLabel,
  updateLabel,
  deleteLabel,
  getTaskLabels,
  addLabelToTask,
  removeLabelFromTask
} from '../controllers/label.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

// All label routes require authentication
router.use(verifyToken);

/**
 * @route   GET /api/labels
 * @desc    Get labels (optionally filtered by projectId)
 * @access  Private
 * @query   { projectId? }
 */
router.get('/', getLabels);

/**
 * @route   POST /api/labels
 * @desc    Create a new label
 * @access  Private (Admin/Lecturer)
 * @body    { name, color?, projectId? }
 */
router.post('/', createLabel);

/**
 * @route   PUT /api/labels/:id
 * @desc    Update a label
 * @access  Private (Admin/Lecturer)
 * @body    { name?, color? }
 */
router.put('/:id', updateLabel);

/**
 * @route   DELETE /api/labels/:id
 * @desc    Delete a label
 * @access  Private (Admin/Lecturer)
 */
router.delete('/:id', deleteLabel);

export default router;

