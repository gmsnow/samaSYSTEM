import express from 'express';
const app = express();
app.get('/api/health', (_req, res) => res.json({ ok: true, cwd: process.cwd(), node: process.version, vercel: !!process.env.VERCEL }));
app.get('*', (_req, res) => res.json({ ok: true, msg: 'catch-all', cwd: process.cwd() }));
export default app;
