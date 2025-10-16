import { Router } from 'express';
import { 
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getArchivedProjects
} from '../controllers/project.controller';
import { verifyToken, requireUser } from '../middleware/auth.middleware';

const router = Router();

// All project routes require authentication
router.use(verifyToken);

/**
 * @route   POST /api/projects
 * @desc    Create a new project
 * @access  Private (Admin, Lecturer)
 * @body    { title, description, studentId, lecturerId, startDate?, endDate? }
 */
router.post('/', requireUser, createProject);

/**
 * @route   GET /api/projects
 * @desc    Get all projects (filtered by user role)
 * @access  Private
 * @query   { status?, page?, limit?, includeArchived? }
 */
router.get('/', getProjects);

/**
 * @route   GET /api/projects/archived
 * @desc    Get archived projects only
 * @access  Private
 * @query   { page?, limit? }
 */
router.get('/archived', getArchivedProjects);

/**
 * @route   GET /api/projects/:id
 * @desc    Get project by ID
 * @access  Private (Project member)
 */
router.get('/:id', getProjectById);

/**
 * @route   PUT /api/projects/:id
 * @desc    Update project
 * @access  Private (Project member)
 * @body    { title?, description?, status?, progress?, endDate? }
 */
router.put('/:id', updateProject);

/**
 * @route   DELETE /api/projects/:id
 * @desc    Delete project
 * @access  Private (Admin, Lecturer)
 */
router.delete('/:id', requireUser, deleteProject);

export default router;
