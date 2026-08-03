import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/authorize.js';
import packagesRoutes from './packages.routes.js';
import testimonialsRoutes from './testimonials.routes.js';
import doctorsRoutes from './doctors.routes.js';
import blogRoutes from './blog.routes.js';
import contactMessagesRoutes from './contact-messages.routes.js';
import newsletterRoutes from './newsletter.routes.js';

const router = Router();

router.use(authenticate);
router.use(requirePermission('website'));

router.use('/packages', packagesRoutes);
router.use('/testimonials', testimonialsRoutes);
router.use('/doctors', doctorsRoutes);
router.use('/blog', blogRoutes);
router.use('/contact-messages', contactMessagesRoutes);
router.use('/newsletter', newsletterRoutes);

export default router;
