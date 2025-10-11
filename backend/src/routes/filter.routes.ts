import { Router } from 'express';
import { 
  saveFilterPreset, 
  getFilterPresets, 
  updateFilterPreset, 
  deleteFilterPreset, 
  applyFilterPreset 
} from '../controllers/filter.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(verifyToken);

// Save a new filter preset
router.post('/', saveFilterPreset);

// Get user's filter presets
router.get('/', getFilterPresets);

// Update a filter preset
router.put('/:id', updateFilterPreset);

// Delete a filter preset
router.delete('/:id', deleteFilterPreset);

// Apply a filter preset to get results
router.get('/:id/apply', applyFilterPreset);

export default router;
