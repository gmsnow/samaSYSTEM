const isDev = process.env.NODE_ENV === 'development';

const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => {
    if (isDev) console.log(`[INFO] ${msg}`, meta ?? '');
  },
  warn: (msg: string, meta?: Record<string, unknown>) => {
    console.warn(`[WARN] ${msg}`, meta ?? '');
  },
  error: (msg: string, meta?: Record<string, unknown>) => {
    console.error(`[ERROR] ${msg}`, meta ?? '');
  },
};

export default logger;
