import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    await authenticate(req);
    const { searchParams } = new URL(req.url);
    const employee = searchParams.get('employee');
    const employeeId = searchParams.get('employeeId');
    const month = searchParams.get('month');

    if (employeeId) {
      const whereMonth = month ? { date: { gte: `${month}-01`, lte: `${month}-31` } } : {};
      const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
      if (!emp || emp.deletedAt) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
      const advances = await prisma.salaryAdvance.findMany({ where: { employee: employeeId, deletedAt: null, ...whereMonth }, orderBy: { date: 'desc' } });
      return NextResponse.json({ employee: { name: emp.name, salary: emp.salary }, advances });
    }

    const where: Record<string, unknown> = { deletedAt: null };
    if (employee) where.employee = { contains: employee };
    const advances = await prisma.salaryAdvance.findMany({ where, orderBy: { date: 'desc' } });
    return NextResponse.json(advances);
  } catch (err) { return handleError(err, '/api/advances'); }
}

export async function POST(req: NextRequest) {
  try {
    await authenticate(req);
    const body = await req.json();
    const advance = await prisma.salaryAdvance.create({
      data: { employee: body.employee, specialty: body.specialty, amount: parseFloat(body.amount), date: body.date || new Date().toISOString().split('T')[0], notes: body.notes },
    });
    return NextResponse.json({ message: 'تم إضافة السلفة بنجاح', advance }, { status: 201 });
  } catch (err) { return handleError(err, '/api/advances'); }
}

export async function PATCH(req: NextRequest) {
  try {
    await authenticate(req);
    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const advance = await prisma.salaryAdvance.update({ where: { id }, data: { employee: body.employee, specialty: body.specialty, amount: body.amount !== undefined ? parseFloat(body.amount) : undefined, date: body.date, notes: body.notes } });
    return NextResponse.json({ message: 'تم تحديث السلفة بنجاح', advance });
  } catch (err) { return handleError(err, '/api/advances'); }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await authenticate(req);
    await prisma.salaryAdvance.update({ where: { id }, data: { deletedAt: new Date() } });
    return NextResponse.json({ message: 'تم حذف السلفة بنجاح' });
  } catch (err) { return handleError(err, '/api/advances'); }
}
