import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    await authenticate(req);
    const services = await prisma.service.findMany({ where: { isActive: true } });
    return NextResponse.json(services);
  } catch (err) { return handleError(err, '/api/services'); }
}
