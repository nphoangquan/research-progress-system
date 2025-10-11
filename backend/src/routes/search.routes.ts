import { Router } from 'express';
import { globalSearch, getSearchSuggestions } from '../controllers/search.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

// All search routes require authentication
router.use(verifyToken);

/**
 * @route   GET /api/search
 * @desc    Global search across projects, tasks, and documents
 * @access  Private
 * @query   { q, types?, status?, priority?, dateRange? }
 */
router.get('/', globalSearch);

/**
 * @route   GET /api/search/suggestions
 * @desc    Get search suggestions (recent, popular, etc.)
 * @access  Private
 */
router.get('/suggestions', getSearchSuggestions);

export default router;
