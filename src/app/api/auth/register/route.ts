import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signAccessToken, signRefreshToken } from '@/lib/auth';
import { ConflictError } from '@/lib/errors';
import { handleError } from '@/lib/api-utils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) throw new ConflictError('Email already registered');

    const hashed = await hashPassword(body.password);
    const user = await prisma.user.create({
      data: {
        username: body.username, email: body.email, password: hashed,
        firstName: body.firstName, lastName: body.lastName,
        phone: body.phone, role: body.role || 'RECEPTIONIST',
      },
    });

    const payload = { userId: user.id, email: user.email, role: user.role, permissions: user.permissions };
    return NextResponse.json({
      user: { id: user.id, username: user.username, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, permissions: user.permissions },
      accessToken: await signAccessToken(payload),
      refreshToken: await signRefreshToken(payload),
    }, { status: 201 });
  } catch (err) {
    return handleError(err, '/api/auth/register');
  }
}
