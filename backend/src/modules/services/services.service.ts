import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../shared/errors.js';

export async function listServices() {
  return prisma.service.findMany({
    where: { deletedAt: null },
    orderBy: { name: 'asc' },
  });
}

export async function createService(data: { name: string; price: number }) {
  return prisma.service.create({ data });
}

export async function updateService(id: string, data: { name?: string; price?: number; isActive?: boolean }) {
  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) throw new NotFoundError('Service');
  return prisma.service.update({ where: { id }, data });
}

export async function deleteService(id: string) {
  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) throw new NotFoundError('Service');
  await prisma.service.update({ where: { id }, data: { deletedAt: new Date() } });
}
