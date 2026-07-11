import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import authRoutes from './modules/auth/auth.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import patientRoutes from './modules/patients/patients.routes.js';
import sessionRoutes from './modules/sessions/sessions.routes.js';
import employeeRoutes from './modules/employees/employees.routes.js';
import serviceRoutes from './modules/services/services.routes.js';
import appointmentRoutes from './modules/appointments/appointments.routes.js';
import calendarRoutes from './modules/calendar/calendar.routes.js';
import advanceRoutes from './modules/advances/advances.routes.js';
import expenseRoutes from './modules/expenses/expenses.routes.js';
import chatRoutes from './modules/chat/chat.routes.js';
import userRoutes from './modules/users/users.routes.js';
import notificationRoutes from './modules/notifications/notifications.routes.js';
import logger from './shared/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isVercel = !!process.env.VERCEL;

const viewsDir = isVercel
  ? path.join(process.cwd(), 'backend', 'src', 'views')
  : path.join(__dirname, 'views');
const assetsDir = isVercel
  ? path.join(process.cwd(), 'backend', 'src', 'public', 'assets')
  : path.join(__dirname, 'public', 'assets');
const uploadsDir = isVercel
  ? path.join(process.cwd(), 'backend', 'uploads')
  : path.join(__dirname, '..', 'uploads');

const app = express();

app.set('view engine', 'ejs');
app.set('views', viewsDir);
app.use('/assets', express.static(assetsDir));
app.use('/uploads', express.static(uploadsDir));

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(generalLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/advances', advanceRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

if (isVercel) {
  const frontendDist = path.join(__dirname, '..', 'public');
  app.use(express.static(frontendDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.use(errorHandler);

if (!process.env.VERCEL) {
  app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  });
}

export default app;
