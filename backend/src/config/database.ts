import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from './env.js';

const projectRef = env.DATABASE_URL.match(/postgres\.([^.@]+)/)?.[1];
const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
  ...(projectRef ? { sni_hostname: `db.${projectRef}.supabase.co` } : {}),
});

export const prisma = new PrismaClient({
  adapter,
  log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});
