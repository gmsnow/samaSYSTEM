import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import * as controller from './dashboard.controller.js';

const router = Router();

router.use(authenticate);

router.get('/stats', controller.stats);
router.get('/daily-report', controller.dailyReport);
router.get('/weekly-report', controller.weeklyReport);
router.get('/monthly-report', controller.monthlyReport);

export default router;
