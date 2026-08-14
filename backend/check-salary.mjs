import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const p = new PrismaClient({ adapter });
(async () => {
  const emps = await p.employee.findMany({ orderBy: { name: 'asc' } });
  console.log('TOTAL rows:', emps.length);
  let sumAll = 0;
  for (const e of emps) {
    console.log([e.id.slice(0, 8), e.name, 'salary:', e.salary, 'active:', e.isActive, 'deleted:', !!e.deletedAt].join(' | '));
    if (e.salary && !e.deletedAt) sumAll += e.salary;
  }
  console.log('SUM (non-deleted, has salary):', sumAll);
  const sumActive = await p.employee.aggregate({ where: { deletedAt: null, isActive: true }, _sum: { salary: true } });
  console.log('SUM (active only):', sumActive._sum.salary);
  await p.$disconnect();
})();
