import { Router } from 'express';
import { getParentAnalyticsHandler } from '../controllers/parentController';

const router = Router();

// GET child analytics, study time, and homework history
router.get('/analytics/:childId', getParentAnalyticsHandler);

export default router;
