import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    await authenticate(req);
    const [notifications, unread] = await Promise.all([
      prisma.notification.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.notification.count({ where: { readAt: null } }),
    ]);
    return NextResponse.json({ notifications, unread });
  } catch (err) { return handleError(err, '/api/notifications'); }
}

export async function POST(req: NextRequest) {
  try {
    await authenticate(req);
    const body = await req.json();
    if (body.markAll) {
      await prisma.notification.updateMany({ data: { readAt: new Date() }, where: { readAt: null } });
      return NextResponse.json({ message: 'All read' });
    }
    if (body.id) {
      await prisma.notification.update({ where: { id: body.id }, data: { readAt: new Date() } });
      return NextResponse.json({ message: 'Read' });
    }
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (err) { return handleError(err, '/api/notifications'); }
}
