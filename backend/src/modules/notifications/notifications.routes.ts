import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import * as controller from './notifications.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', controller.list);
router.put('/:id/read', controller.markRead);
router.put('/read-all', controller.markAllRead);

export default router;
