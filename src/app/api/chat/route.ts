import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    const tokenData = await authenticate(req);
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'users') {
      const users = await prisma.user.findMany({ where: { id: { not: tokenData.userId }, deletedAt: null, isActive: true }, select: { id: true, firstName: true, lastName: true, role: true } });
      return NextResponse.json(users);
    }

    if (action === 'messages') {
      const conversationId = searchParams.get('conversationId');
      if (!conversationId) return NextResponse.json({ error: 'conversationId required' }, { status: 400 });
      const messages = await prisma.message.findMany({ where: { conversationId }, include: { sender: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { createdAt: 'asc' } });
      return NextResponse.json(messages);
    }

    const archivedParam = searchParams.get('archived');
    const archived = archivedParam === 'true' ? true : archivedParam === 'false' ? false : undefined;
    const whereParticipant = { userId: tokenData.userId, ...(archived !== undefined ? { archivedAt: archived ? { not: null } : null } : {}) };
    const conversations = await prisma.conversation.findMany({ where: { participants: { some: whereParticipant }, deletedAt: null }, include: { participants: { include: { user: { select: { id: true, firstName: true, lastName: true, role: true } } } }, messages: { orderBy: { createdAt: 'desc' }, take: 1 } }, orderBy: { updatedAt: 'desc' } });
    return NextResponse.json(conversations);
  } catch (err) { return handleError(err, '/api/chat'); }
}

export async function POST(req: NextRequest) {
  try {
    const tokenData = await authenticate(req);
    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'conversation') {
      const participantIds = [...new Set([tokenData.userId, ...(body.participantIds || [])])];
      const existing = await prisma.conversation.findFirst({ where: { participants: { every: { userId: { in: participantIds } } }, deletedAt: null }, include: { participants: true } });
      if (existing) return NextResponse.json(existing);
      const conv = await prisma.conversation.create({ data: { participants: { create: participantIds.map((userId: string) => ({ userId })) } }, include: { participants: { include: { user: { select: { id: true, firstName: true, lastName: true, role: true } } } } } });
      return NextResponse.json(conv, { status: 201 });
    }

    if (action === 'archive') {
      const convId = searchParams.get('id');
      if (!convId) return NextResponse.json({ error: 'id required' }, { status: 400 });
      await prisma.conversationParticipant.updateMany({ where: { conversationId: convId, userId: tokenData.userId }, data: { archivedAt: new Date() } });
      return NextResponse.json({ message: 'Conversation archived' });
    }

    if (action === 'unarchive') {
      const convId = searchParams.get('id');
      if (!convId) return NextResponse.json({ error: 'id required' }, { status: 400 });
      await prisma.conversationParticipant.updateMany({ where: { conversationId: convId, userId: tokenData.userId }, data: { archivedAt: null } });
      return NextResponse.json({ message: 'Conversation unarchived' });
    }

    const message = await prisma.message.create({ data: { conversationId: body.conversationId, senderId: tokenData.userId, content: body.content }, include: { sender: { select: { id: true, firstName: true, lastName: true } } } });
    await prisma.conversation.update({ where: { id: body.conversationId }, data: { updatedAt: new Date() } });
    return NextResponse.json(message, { status: 201 });
  } catch (err) { return handleError(err, '/api/chat'); }
}
