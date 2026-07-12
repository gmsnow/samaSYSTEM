import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const databaseUrl = process.env.DATABASE_URL || '';
const projectRef = databaseUrl.match(/postgres\.([^.@]+)/)?.[1];
const adapter = new PrismaPg({
  connectionString: databaseUrl,
  ...(projectRef ? { sni_hostname: `db.${projectRef}.supabase.co` } : {}),
});

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
