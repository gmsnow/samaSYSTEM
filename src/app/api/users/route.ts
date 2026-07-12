import { NextRequest, NextResponse } from 'next/server';
import { authenticate, requirePermission, hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req);
    requirePermission(user, 'users');
    const users = await prisma.user.findMany({ where: { deletedAt: null }, select: { id: true, username: true, email: true, firstName: true, lastName: true, phone: true, role: true, isActive: true, permissions: true, createdAt: true } });
    return NextResponse.json(users);
  } catch (err) { return handleError(err, '/api/users'); }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticate(req);
    requirePermission(user, 'users');
    const body = await req.json();
    const hashed = await hashPassword(body.password);
    const u = await prisma.user.create({ data: { username: body.username, email: body.email, password: hashed, firstName: body.firstName, lastName: body.lastName, phone: body.phone, role: body.role, permissions: body.permissions || [] } });
    return NextResponse.json({ message: 'User created successfully', user: { id: u.id, username: u.username, email: u.email, firstName: u.firstName, lastName: u.lastName, role: u.role, isActive: u.isActive, permissions: u.permissions } }, { status: 201 });
  } catch (err) { return handleError(err, '/api/users'); }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await authenticate(req);
    requirePermission(user, 'users');
    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    if (body.permissions !== undefined) {
      const u = await prisma.user.update({ where: { id }, data: { permissions: body.permissions } });
      return NextResponse.json({ message: 'Permissions updated successfully', user: u });
    }
    if (body.isActive !== undefined) {
      const u = await prisma.user.update({ where: { id }, data: { isActive: body.isActive } });
      return NextResponse.json({ message: `User ${u.isActive ? 'activated' : 'deactivated'} successfully`, user: u });
    }
    const u = await prisma.user.update({ where: { id }, data: { firstName: body.firstName, lastName: body.lastName, email: body.email, phone: body.phone, role: body.role } });
    return NextResponse.json({ message: 'User updated successfully', user: u });
  } catch (err) { return handleError(err, '/api/users'); }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await authenticate(req);
    requirePermission(user, 'users');
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await prisma.user.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (err) { return handleError(err, '/api/users'); }
}
