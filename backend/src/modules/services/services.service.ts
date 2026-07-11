import { prisma } from '../../config/database.js';

export async function listServices() {
  return prisma.service.findMany({
    where: { deletedAt: null, isActive: true },
    orderBy: { name: 'asc' },
  });
}
