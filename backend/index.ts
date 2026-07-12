const app = await import('./src/app.js').then((m: any) => m.default).catch((e: any) => {
  return (req: any, res: any) => {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Init failed', message: e?.message, stack: e?.stack?.split('\n').slice(0, 5).join('\n') }));
  };
});
export default app;
