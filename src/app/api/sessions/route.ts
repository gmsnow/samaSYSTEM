import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    await authenticate(req);
    const sessions = await prisma.session.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(sessions);
  } catch (err) { return handleError(err, '/api/sessions'); }
}

export async function POST(req: NextRequest) {
  try {
    await authenticate(req);
    const body = await req.json();
    const session = await prisma.session.create({
      data: {
        fullname: body.fullname,
        sessionType: body.sessionType,
        speacial: body.speacial,
        status: body.status || 'progress',
        sessionDate: body.sessionDate ? new Date(body.sessionDate) : null,
        price: body.price ? parseFloat(body.price) : null,
        notes: body.notes,
      },
    });
    return NextResponse.json({ message: 'Session created successfully', session }, { status: 201 });
  } catch (err) { return handleError(err, '/api/sessions'); }
}

export async function PATCH(req: NextRequest) {
  try {
    await authenticate(req);
    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    if (body.status && Object.keys(body).length === 1) {
      const session = await prisma.session.update({ where: { id }, data: { status: body.status } });
      return NextResponse.json({ message: 'Status updated successfully', session });
    }
    const session = await prisma.session.update({ where: { id }, data: { fullname: body.fullname, sessionType: body.sessionType, speacial: body.speacial, status: body.status, sessionDate: body.sessionDate ? new Date(body.sessionDate) : undefined, price: body.price !== undefined ? parseFloat(body.price) : undefined, notes: body.notes } });
    return NextResponse.json({ message: 'Session updated successfully', session });
  } catch (err) { return handleError(err, '/api/sessions'); }
}
