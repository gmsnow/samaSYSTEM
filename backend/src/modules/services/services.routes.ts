import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import * as controller from './services.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', controller.list);

export default router;
