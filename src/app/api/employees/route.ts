import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    await authenticate(req);
    const { searchParams } = new URL(req.url);
    const department = searchParams.get('department');
    const all = searchParams.get('all') === 'true';
    const where: Record<string, unknown> = { deletedAt: null };
    if (department) where.department = department;
    if (!all) where.isActive = true;
    const employees = await prisma.employee.findMany({ where, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(employees);
  } catch (err) { return handleError(err, '/api/employees'); }
}

export async function POST(req: NextRequest) {
  try {
    await authenticate(req);
    const body = await req.json();
    const e = await prisma.employee.create({ data: { name: body.name, department: body.department, phone: body.phone, salary: body.salary ? parseFloat(body.salary) : null } });
    return NextResponse.json({ message: 'تم إضافة الموظف بنجاح', employee: e }, { status: 201 });
  } catch (err) { return handleError(err, '/api/employees'); }
}

export async function PATCH(req: NextRequest) {
  try {
    await authenticate(req);
    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const e = await prisma.employee.update({ where: { id }, data: { name: body.name, department: body.department, phone: body.phone, salary: body.salary !== undefined ? parseFloat(body.salary) : undefined } });
    return NextResponse.json({ message: 'تم تحديث الموظف بنجاح', employee: e });
  } catch (err) { return handleError(err, '/api/employees'); }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await authenticate(req);
    await prisma.employee.update({ where: { id }, data: { deletedAt: new Date() } });
    return NextResponse.json({ message: 'تم حذف الموظف بنجاح' });
  } catch (err) { return handleError(err, '/api/employees'); }
}
