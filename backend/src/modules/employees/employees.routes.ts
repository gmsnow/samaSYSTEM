import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { createEmployeeSchema, updateEmployeeSchema } from './employees.schema.js';
import * as controller from './employees.controller.js';

const router = Router();

router.use(authenticate);
router.use(requirePermission('employees'));

router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/', validate(createEmployeeSchema), controller.create);
router.put('/:id', validate(updateEmployeeSchema), controller.update);
router.delete('/:id', controller.remove);

export default router;
