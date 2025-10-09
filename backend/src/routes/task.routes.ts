import { Router } from 'express';
import { 
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask
} from '../controllers/task.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

// All task routes require authentication
router.use(verifyToken);

/**
 * @route   POST /api/tasks
 * @desc    Create a new task
 * @access  Private (Project member)
 * @body    { projectId, title, description, assigneeId, priority?, dueDate? }
 */
router.post('/', createTask);

/**
 * @route   GET /api/tasks
 * @desc    Get tasks for a project
 * @access  Private (Project member)
 * @query   { projectId }
 */
router.get('/', getTasks);

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
router.put('/:id', updateTask);

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete task
 * @access  Private (Project member)
 */
router.delete('/:id', deleteTask);

export default router;
