import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { createCoverageSchema, updateCoverageSchema } from './coverages.schema.js';
import * as controller from './coverages.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', controller.list);
router.post('/', requirePermission('coverages'), validate(createCoverageSchema), controller.create);
router.put('/:id', requirePermission('coverages'), validate(updateCoverageSchema), controller.update);
router.delete('/:id', requirePermission('coverages'), controller.remove);

export default router;
