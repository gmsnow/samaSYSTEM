import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { env } from './env';
import { UnauthorizedError } from './errors';

export interface JwtPayload extends JWTPayload {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
}

const secret = new TextEncoder().encode(env.JWT_SECRET);
const refreshSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

export async function signAccessToken(payload: Omit<JwtPayload, keyof JWTPayload>) {
  return new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(secret);
}

export async function signRefreshToken(payload: Omit<JwtPayload, keyof JWTPayload>) {
  return new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(env.JWT_REFRESH_EXPIRES_IN)
    .sign(refreshSecret);
}

export async function verifyToken(token: string): Promise<JwtPayload> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JwtPayload;
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}

export async function verifyRefreshToken(token: string): Promise<JwtPayload> {
  try {
    const { payload } = await jwtVerify(token, refreshSecret);
    return payload as unknown as JwtPayload;
  } catch {
    throw new UnauthorizedError('Invalid refresh token');
  }
}

export async function authenticate(request: Request): Promise<JwtPayload> {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) {
    throw new UnauthorizedError('No token provided');
  }
  const token = header.split(' ')[1];
  return verifyToken(token);
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function loginUser(username: string, password: string) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || user.deletedAt || !user.isActive) {
    throw new UnauthorizedError('Invalid username or password');
  }
  const valid = await comparePassword(password, user.password);
  if (!valid) throw new UnauthorizedError('Invalid username or password');

  const payload = { userId: user.id, email: user.email, role: user.role, permissions: user.permissions };

  return {
    user: {
      id: user.id, username: user.username, email: user.email,
      firstName: user.firstName, lastName: user.lastName,
      role: user.role, permissions: user.permissions,
    },
    accessToken: await signAccessToken(payload),
    refreshToken: await signRefreshToken(payload),
  };
}

export async function refreshUserToken(token: string) {
  const payload = await verifyRefreshToken(token);
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || !user.isActive || user.deletedAt) {
    throw new UnauthorizedError('User not found or inactive');
  }
  const newPayload = { userId: user.id, email: user.email, role: user.role, permissions: user.permissions };
  return {
    accessToken: await signAccessToken(newPayload),
    refreshToken: await signRefreshToken(newPayload),
  };
}

export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, email: true, firstName: true, lastName: true,
      username: true, phone: true, role: true, isActive: true,
      permissions: true, createdAt: true,
    },
  });
  if (!user) throw new UnauthorizedError('User not found');
  return user;
}

export function requirePermission(user: JwtPayload, permission: string) {
  if (user.role === 'ADMIN') return;
  if (!user.permissions.includes(permission)) {
    throw new UnauthorizedError('Insufficient permissions');
  }
}
