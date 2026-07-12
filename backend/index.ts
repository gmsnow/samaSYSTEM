import express from 'express';
import { env } from './src/config/env.js';

const app = express();

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', env: !!env.DATABASE_URL, cors: env.CORS_ORIGIN });
});

export default app;
