import { Router } from 'express';
import { getAnalytics, getUserActivity } from '../controllers/analytics.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

// Get analytics data
router.get('/', verifyToken, getAnalytics);

// Get user activity data
router.get('/user-activity', verifyToken, getUserActivity);

export default router;
