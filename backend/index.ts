export default (req, res) => {
  res.status(200).json({ ok: true, path: req.url, method: req.method, headers: Object.keys(req.headers) });
};
