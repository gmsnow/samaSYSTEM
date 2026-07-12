import { NextRequest, NextResponse } from 'next/server';
import { authenticate, getUserProfile } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    const tokenData = await authenticate(req);
    const user = await getUserProfile(tokenData.userId);
    return NextResponse.json(user);
  } catch (err) {
    return handleError(err, '/api/auth/profile');
  }
}

export async function PUT(req: NextRequest) {
  try {
    const tokenData = await authenticate(req);
    const body = await req.json();
    const user = await prisma.user.update({
      where: { id: tokenData.userId },
      data: { firstName: body.firstName, lastName: body.lastName, email: body.email, phone: body.phone },
      select: { id: true, email: true, firstName: true, lastName: true, username: true, phone: true, role: true },
    });
    return NextResponse.json(user);
  } catch (err) {
    return handleError(err, '/api/auth/profile');
  }
}
