import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/lib/auth';
import { handleError } from '@/lib/api-utils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await loginUser(body.username, body.password);
    return NextResponse.json(result);
  } catch (err) {
    return handleError(err, '/api/auth/login');
  }
}
