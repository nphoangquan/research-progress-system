import { Router } from 'express';
import {
  getHelpArticles,
  getHelpArticle,
  getCategories,
  createHelpArticle,
  updateHelpArticle,
  deleteHelpArticle,
} from '../controllers/help.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   GET /api/help
 * @desc    Get all published help articles
 * @access  Public (but requires auth for consistency)
 * @query   category, search
 */
router.get('/', verifyToken, getHelpArticles);

/**
 * @route   GET /api/help/categories
 * @desc    Get all categories
 * @access  Public (but requires auth for consistency)
 */
router.get('/categories', verifyToken, getCategories);

/**
 * @route   GET /api/help/:id
 * @desc    Get help article by ID
 * @access  Public (but requires auth for consistency)
 */
router.get('/:id', verifyToken, getHelpArticle);

/**
 * @route   POST /api/help
 * @desc    Create help article
 * @access  Admin only
 */
router.post('/', verifyToken, createHelpArticle);

/**
 * @route   PATCH /api/help/:id
 * @desc    Update help article
 * @access  Admin only
 */
router.patch('/:id', verifyToken, updateHelpArticle);

/**
 * @route   DELETE /api/help/:id
 * @desc    Delete help article
 * @access  Admin only
 */
router.delete('/:id', verifyToken, deleteHelpArticle);

export default router;

