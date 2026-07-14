import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { createServiceSchema, updateServiceSchema } from './services.schema.js';
import * as controller from './services.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', controller.list);
router.post('/', requirePermission('services'), validate(createServiceSchema), controller.create);
router.put('/:id', requirePermission('services'), validate(updateServiceSchema), controller.update);
router.delete('/:id', requirePermission('services'), controller.remove);

export default router;
