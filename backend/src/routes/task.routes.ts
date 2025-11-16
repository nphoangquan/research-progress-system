import { Router } from 'express';
import { 
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  submitTask
} from '../controllers/task.controller';
import {
  getTaskLabels,
  addLabelToTask,
  removeLabelFromTask
} from '../controllers/label.controller';
import { verifyToken } from '../middleware/auth.middleware';
import { uploadMultiple, handleUploadError } from '../middleware/upload.middleware';
import { validate, taskSchemas } from '../middleware/validation.middleware';

const router = Router();

// All task routes require authentication
router.use(verifyToken);

/**
 * @route   POST /api/tasks
 * @desc    Create a new task
 * @access  Private (Project member)
 * @body    { projectId, title, description, assigneeId, priority?, dueDate? }
 */
router.post('/', validate(taskSchemas.create), createTask);

/**
 * @route   GET /api/tasks
 * @desc    Get tasks for a project
 * @access  Private (Project member)
 * @query   { projectId }
 */
router.get('/', getTasks);

/**
 * @route   POST /api/tasks/submit
 * @desc    Submit task completion by student
 * @access  Private (Student)
 * @body    { taskId, content, files? }
 */
router.post('/submit', uploadMultiple.array('files', 10), handleUploadError, validate(taskSchemas.submit), submitTask);

/**
 * @route   GET /api/tasks/:taskId/labels
 * @desc    Get labels for a specific task
 * @access  Private (Project member)
 */
router.get('/:taskId/labels', getTaskLabels);

/**
 * @route   POST /api/tasks/:taskId/labels
 * @desc    Add a label to a task
 * @access  Private (Project member)
 * @body    { labelId }
 */
router.post('/:taskId/labels', addLabelToTask);

/**
 * @route   DELETE /api/tasks/:taskId/labels/:labelId
 * @desc    Remove a label from a task
 * @access  Private (Project member)
 */
router.delete('/:taskId/labels/:labelId', removeLabelFromTask);

/**
 * @route   GET /api/tasks/:id
 * @desc    Get task by ID
 * @access  Private (Project member)
 */
router.get('/:id', getTaskById);

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update task
 * @access  Private (Project member)
 * @body    { title?, description?, status?, priority?, dueDate?, assigneeId? }
 */
router.put('/:id', validate(taskSchemas.update), updateTask);

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete task
 * @access  Private (Project member)
 */
router.delete('/:id', deleteTask);

export default router;
