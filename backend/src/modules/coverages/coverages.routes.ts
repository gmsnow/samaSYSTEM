import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { createCoverageSchema, updateCoverageSchema } from './coverages.schema.js';
import * as controller from './coverages.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', controller.list);
router.post('/', validate(createCoverageSchema), controller.create);
router.put('/:id', validate(updateCoverageSchema), controller.update);
router.delete('/:id', controller.remove);

export default router;
