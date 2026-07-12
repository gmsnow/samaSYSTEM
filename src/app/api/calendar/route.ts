import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    await authenticate(req);
    const events = await prisma.calendarEvent.findMany({ where: { deletedAt: null }, orderBy: { date: 'asc' } });
    return NextResponse.json(events);
  } catch (err) { return handleError(err, '/api/calendar'); }
}

export async function POST(req: NextRequest) {
  try {
    await authenticate(req);
    const body = await req.json();
    const ev = await prisma.calendarEvent.create({
      data: { eventName: body.eventName, date: body.date, endDate: body.endDate, type: body.type, startTime: body.startTime, endTime: body.endTime, location: body.location, description: body.description },
    });
    return NextResponse.json({ message: 'Event created successfully', event: ev }, { status: 201 });
  } catch (err) { return handleError(err, '/api/calendar'); }
}

export async function PATCH(req: NextRequest) {
  try {
    await authenticate(req);
    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const ev = await prisma.calendarEvent.update({
      where: { id },
      data: { eventName: body.eventName, date: body.date, endDate: body.endDate, type: body.type, startTime: body.startTime, endTime: body.endTime, location: body.location, description: body.description },
    });
    return NextResponse.json({ message: 'Event updated successfully', event: ev });
  } catch (err) { return handleError(err, '/api/calendar'); }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await authenticate(req);
    await prisma.calendarEvent.update({ where: { id }, data: { deletedAt: new Date() } });
    return NextResponse.json({ message: 'Event deleted successfully' });
  } catch (err) { return handleError(err, '/api/calendar'); }
}
