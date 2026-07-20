import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../shared/errors.js';

export async function listCoverages() {
  return prisma.coverage.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createCoverage(data: { name: string; sessionType?: string; date: string; price: number; therapistShare?: number; from?: string; to?: string }) {
  return prisma.coverage.create({ data });
}

export async function updateCoverage(id: string, data: { name?: string; sessionType?: string; date?: string; price?: number; therapistShare?: number; from?: string; to?: string }) {
  const existing = await prisma.coverage.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) throw new NotFoundError('Coverage');
  return prisma.coverage.update({ where: { id }, data });
}

export async function deleteCoverage(id: string) {
  const existing = await prisma.coverage.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) throw new NotFoundError('Coverage');
  await prisma.coverage.update({ where: { id }, data: { deletedAt: new Date() } });
}
