import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../shared/errors.js';

export async function listSessions() {
  return prisma.session.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getSession(id: string) {
  const session = await prisma.session.findUnique({ where: { id } });
  if (!session || session.deletedAt) throw new NotFoundError('Session');
  return session;
}

export async function createSession(data: {
  fullname: string;
  session_type: string;
  speacial?: string;
  session_date?: string | null;
  price?: number;
  notes?: string;
  subscription_period?: string;
  subscription_amount?: number;
  subscription_day?: number;
}) {
  return prisma.session.create({
    data: {
      fullname: data.fullname,
      sessionType: data.session_type,
      speacial: data.speacial || null,
      sessionDate: data.session_date ? new Date(data.session_date) : new Date(),
      price: data.price ?? null,
      notes: data.notes || null,
      subscriptionPeriod: data.subscription_period || null,
      subscriptionAmount: data.subscription_amount ?? null,
      subscriptionDay: data.subscription_day ?? null,
    },
  });
}

export async function updateSession(id: string, data: {
  fullname?: string;
  session_type?: string;
  speacial?: string;
  session_date?: string | null;
  price?: number;
  notes?: string;
  subscription_period?: string;
  subscription_amount?: number;
  subscription_day?: number;
}) {
  const existing = await prisma.session.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) throw new NotFoundError('Session');

  return prisma.session.update({
    where: { id },
    data: {
      fullname: data.fullname,
      sessionType: data.session_type,
      speacial: data.speacial,
      sessionDate: data.session_date !== undefined ? (data.session_date ? new Date(data.session_date) : new Date()) : undefined,
      price: data.price,
      notes: data.notes,
      subscriptionPeriod: data.subscription_period,
      subscriptionAmount: data.subscription_amount,
      subscriptionDay: data.subscription_day,
    },
  });
}

export async function deleteSession(id: string) {
  const existing = await prisma.session.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) throw new NotFoundError('Session');

  await prisma.session.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

export async function updateSessionStatus(id: string, status: string) {
  const existing = await prisma.session.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) throw new NotFoundError('Session');

  return prisma.session.update({
    where: { id },
    data: { status },
  });
}
