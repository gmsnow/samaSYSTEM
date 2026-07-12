import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-utils';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await authenticate(req);
    const { id } = await params;
    const session = await prisma.session.findUnique({ where: { id } });
    if (!session || session.deletedAt) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    return NextResponse.json(session);
  } catch (err) { return handleError(err, '/api/sessions/[id]'); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await authenticate(req);
    await prisma.session.update({ where: { id }, data: { deletedAt: new Date() } });
    return NextResponse.json({ message: 'Session deleted successfully' });
  } catch (err) { return handleError(err, '/api/sessions/[id]'); }
}
