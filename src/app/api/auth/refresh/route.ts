import { NextRequest, NextResponse } from 'next/server';
import { refreshUserToken } from '@/lib/auth';
import { handleError } from '@/lib/api-utils';

export async function POST(req: NextRequest) {
  try {
    const { refreshToken } = await req.json();
    const result = await refreshUserToken(refreshToken);
    return NextResponse.json(result);
  } catch (err) {
    return handleError(err, '/api/auth/refresh');
  }
}
