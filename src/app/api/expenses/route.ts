import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    await authenticate(req);
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month');
    const where: Record<string, unknown> = { deletedAt: null };
    if (month) where.date = { gte: `${month}-01`, lte: `${month}-31` };
    const expenses = await prisma.expense.findMany({ where, orderBy: { date: 'desc' } });
    return NextResponse.json(expenses);
  } catch (err) { return handleError(err, '/api/expenses'); }
}

export async function POST(req: NextRequest) {
  try {
    await authenticate(req);
    const body = await req.json();
    const e = await prisma.expense.create({ data: { category: body.category, amount: parseFloat(body.amount), date: body.date || new Date().toISOString().split('T')[0], paymentMethod: body.paymentMethod, notes: body.notes } });
    return NextResponse.json({ message: 'تم حفظ المصروف بنجاح', expense: e }, { status: 201 });
  } catch (err) { return handleError(err, '/api/expenses'); }
}

export async function PATCH(req: NextRequest) {
  try {
    await authenticate(req);
    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const e = await prisma.expense.update({ where: { id }, data: { category: body.category, amount: body.amount !== undefined ? parseFloat(body.amount) : undefined, date: body.date, paymentMethod: body.paymentMethod, notes: body.notes } });
    return NextResponse.json({ message: 'تم تحديث المصروف بنجاح', expense: e });
  } catch (err) { return handleError(err, '/api/expenses'); }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await authenticate(req);
    await prisma.expense.update({ where: { id }, data: { deletedAt: new Date() } });
    return NextResponse.json({ message: 'تم حذف المصروف بنجاح' });
  } catch (err) { return handleError(err, '/api/expenses'); }
}
