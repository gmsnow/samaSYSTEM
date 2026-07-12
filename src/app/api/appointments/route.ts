import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    await authenticate(req);
    const appointments = await prisma.appointment.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(appointments);
  } catch (err) { return handleError(err, '/api/appointments'); }
}

export async function POST(req: NextRequest) {
  try {
    await authenticate(req);
    const body = await req.json();
    const a = await prisma.appointment.create({ data: { patient: body.patient, phone: body.phone, therapist: body.therapist, date: body.date, status: body.status || 'pending', notes: body.notes } });
    return NextResponse.json({ message: 'Appointment created successfully', appointment: a }, { status: 201 });
  } catch (err) { return handleError(err, '/api/appointments'); }
}

export async function PATCH(req: NextRequest) {
  try {
    await authenticate(req);
    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const a = await prisma.appointment.update({ where: { id }, data: { patient: body.patient, phone: body.phone, therapist: body.therapist, date: body.date, status: body.status, notes: body.notes } });
    return NextResponse.json({ message: 'Appointment updated successfully', appointment: a });
  } catch (err) { return handleError(err, '/api/appointments'); }
}

export async function PUT(req: NextRequest) {
  try {
    await authenticate(req);
    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const a = await prisma.appointment.update({ where: { id }, data: { status: body.status } });
    return NextResponse.json({ message: 'Status updated successfully', appointment: a });
  } catch (err) { return handleError(err, '/api/appointments'); }
}
