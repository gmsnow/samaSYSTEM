import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/authorize.js';
import * as controller from './dashboard.controller.js';

const router = Router();

router.use(authenticate);

router.get('/stats', controller.stats);
router.get('/daily-summary', controller.dailySummary);
router.get('/weekly-summary', controller.weeklySummary);
router.get('/daily-report', requirePermission('reports'), controller.dailyReport);
router.get('/weekly-report', requirePermission('reports'), controller.weeklyReport);
router.get('/monthly-report', requirePermission('reports'), controller.monthlyReport);

export default router;
