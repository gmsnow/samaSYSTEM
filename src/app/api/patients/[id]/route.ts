import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-utils';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await authenticate(req);
    const { id } = await params;
    const patient = await prisma.patient.findUnique({ where: { id } });
    if (!patient || patient.deletedAt) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    return NextResponse.json(patient);
  } catch (err) { return handleError(err, '/api/patients/[id]'); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await authenticate(req);
    await prisma.patient.update({ where: { id }, data: { deletedAt: new Date() } });
    return NextResponse.json({ message: 'Patient deleted successfully!' });
  } catch (err) { return handleError(err, '/api/patients/[id]'); }
}
