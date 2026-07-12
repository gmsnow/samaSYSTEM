export default function handler(req: any, res: any) {
  res.status(200).json({ ok: true, path: req.url, express: typeof res.status === 'function' && typeof res.json === 'function' });
}
