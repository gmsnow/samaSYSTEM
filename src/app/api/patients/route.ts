import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    await authenticate(req);
    const patients = await prisma.patient.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(patients);
  } catch (err) { return handleError(err, '/api/patients'); }
}

export async function POST(req: NextRequest) {
  try {
    await authenticate(req);
    const body = await req.json();
    const last = await prisma.patient.findFirst({ where: { deletedAt: null }, orderBy: { serialNumber: 'desc' } });
    const patient = await prisma.patient.create({
      data: {
        serialNumber: (last?.serialNumber ?? 0) + 1,
        firstName: body.firstName || body.fullName,
        lastName: body.lastName,
        phone: body.phone,
        gender: body.gender,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        examType: body.examType,
        price: body.price ? parseFloat(body.price) : null,
        registrationDate: body.registrationDate ? new Date(body.registrationDate) : new Date(),
        notes: body.notes,
        speacial: body.speacial,
        status: body.status || 'progress',
      },
    });
    return NextResponse.json({ message: 'Patient saved successfully!', patient }, { status: 201 });
  } catch (err) { return handleError(err, '/api/patients'); }
}

export async function PATCH(req: NextRequest) {
  try {
    await authenticate(req);
    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const patient = await prisma.patient.update({
      where: { id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        gender: body.gender,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
        examType: body.examType,
        price: body.price !== undefined ? parseFloat(body.price) : undefined,
        notes: body.notes,
        speacial: body.speacial,
        status: body.status,
      },
    });
    return NextResponse.json({ message: 'Patient updated successfully!', patient });
  } catch (err) { return handleError(err, '/api/patients'); }
}
