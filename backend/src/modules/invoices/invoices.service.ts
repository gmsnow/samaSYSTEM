import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../shared/errors.js';

export async function listInvoices(employeeName?: string) {
  const where: any = { deletedAt: null };
  if (employeeName) where.employee = employeeName;
  return prisma.invoice.findMany({
    where,
    orderBy: { date: 'desc' },
  });
}

export async function listInvoicesByEmployee(employeeId: string, month?: string) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee || employee.deletedAt) throw new NotFoundError('Employee');
  const where: any = { deletedAt: null, employee: employee.name };
  if (month) where.date = { startsWith: month };
  const invoices = await prisma.invoice.findMany({
    where,
    orderBy: { date: 'asc' },
  });
  return { employee, invoices };
}

export async function getInvoice(id: string) {
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice || invoice.deletedAt) throw new NotFoundError('Invoice');
  return invoice;
}

export async function createInvoice(data: {
  employee: string;
  type: 'water' | 'electricity';
  amount: number;
  date: string;
  notes?: string;
}) {
  return prisma.invoice.create({ data });
}

export async function updateInvoice(id: string, data: {
  employee?: string;
  type?: 'water' | 'electricity';
  amount?: number;
  date?: string;
  notes?: string;
}) {
  const existing = await prisma.invoice.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) throw new NotFoundError('Invoice');
  return prisma.invoice.update({ where: { id }, data });
}

export async function deleteInvoice(id: string) {
  const existing = await prisma.invoice.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) throw new NotFoundError('Invoice');
  await prisma.invoice.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
