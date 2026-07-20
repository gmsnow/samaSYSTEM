import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../shared/errors.js';

export async function listCoverages() {
  return prisma.coverage.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createCoverage(data: { name: string; sessionType?: string; date: string; price: number; therapistShare?: number; from?: string; to?: string }) {
  const coverage = await prisma.coverage.create({ data });

  if (data.sessionType === 'hijama') {
    await prisma.expense.create({
      data: {
        category: 'حجامة - تغطية',
        amount: data.price,
        date: data.date,
        notes: `تغطية حجامة - ${data.name}`,
      },
    });
  }

  if (data.price > 0) {
    await prisma.salaryAdvance.create({
      data: {
        employee: data.name,
        specialty: data.sessionType === 'hijama' ? 'حجامة' : 'تغطية',
        amount: data.price,
        date: data.date,
        notes: data.sessionType === 'hijama' ? 'تغطية حجامة - كاملة' : 'تغطية عادية - كاملة',
      },
    });
  }

  return coverage;
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
