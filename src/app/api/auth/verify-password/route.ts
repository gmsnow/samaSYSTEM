import { NextRequest, NextResponse } from 'next/server';
import { authenticate, comparePassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UnauthorizedError } from '@/lib/errors';
import { handleError } from '@/lib/api-utils';

export async function POST(req: NextRequest) {
  try {
    const tokenData = await authenticate(req);
    const { password } = await req.json();
    const user = await prisma.user.findUnique({ where: { id: tokenData.userId } });
    if (!user) throw new UnauthorizedError('User not found');
    const valid = await comparePassword(password, user.password);
    if (!valid) throw new UnauthorizedError('Password is incorrect');
    return NextResponse.json({ valid: true });
  } catch (err) {
    return handleError(err, '/api/auth/verify-password');
  }
}
