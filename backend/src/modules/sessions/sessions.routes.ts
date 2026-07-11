import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { createSessionSchema, updateSessionSchema } from './sessions.schema.js';
import * as controller from './sessions.controller.js';

const router = Router();

router.use(authenticate);
router.use(requirePermission('sessions'));

router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/', validate(createSessionSchema), controller.create);
router.put('/:id', validate(updateSessionSchema), controller.update);
router.put('/:id/status', controller.updateStatus);
router.delete('/:id', controller.remove);

export default router;
