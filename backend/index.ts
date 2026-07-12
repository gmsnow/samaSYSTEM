import express from 'express';
const app = express();
app.get('/api/*', (req, res) => {
  res.json({ ok: true, path: req.path, method: req.method, env: { vercel: !!process.env.VERCEL, db: !!process.env.DATABASE_URL, jwt: (process.env.JWT_SECRET || '').length } });
});
app.get('*', (req, res) => {
  res.json({ ok: false, path: req.path, msg: 'catch-all' });
});
export default app;
