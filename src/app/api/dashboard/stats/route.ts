import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    await authenticate(req);
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get('locale') || 'ar';

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [totalPatients, todayAppts, activeEmployees, totalSessions, totalAppts, patients, appointments, sessions, revenue, expenses] = await Promise.all([
      prisma.patient.count({ where: { deletedAt: null } }),
      prisma.appointment.count({ where: { date: { gte: startOfDay.toISOString().split('T')[0] }, deletedAt: null } }),
      prisma.employee.count({ where: { isActive: true, deletedAt: null } }),
      prisma.session.count({ where: { deletedAt: null } }),
      prisma.appointment.count({ where: { deletedAt: null } }),
      prisma.patient.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 5 }),
      prisma.appointment.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 5 }),
      prisma.session.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 5 }),
      prisma.expense.aggregate({ _sum: { amount: true }, where: { date: { gte: startOfMonth.toISOString().split('T')[0] }, deletedAt: null } }),
      prisma.salaryAdvance.aggregate({ _sum: { amount: true }, where: { date: { gte: startOfMonth.toISOString().split('T')[0] }, deletedAt: null } }),
    ]);

    const monthlyRevenue = await prisma.session.groupBy({
      by: ['sessionDate'],
      _sum: { price: true },
      where: { sessionDate: { gte: startOfYear }, deletedAt: null },
    });

    const revenueByMonth: Record<string, number> = {};
    for (const s of monthlyRevenue) {
      if (s.sessionDate) {
        const m = new Date(s.sessionDate).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US', { month: 'short' });
        revenueByMonth[m] = (revenueByMonth[m] || 0) + (s._sum.price || 0);
      }
    }

    return NextResponse.json({
      mainCards: {
        totalPatients: { value: totalPatients, trend: '+0%', up: true, trendLabel: 'dashboard.vsLastMonth' },
        todaysAppointments: { value: todayAppts, trend: '+0%', up: true, trendLabel: 'dashboard.vsYesterday' },
        activeTherapists: { value: activeEmployees, trend: '+0%', up: true, trendLabel: 'dashboard.vsLastMonth' },
        monthlyRevenue: { value: revenue._sum.amount || 0 + (expenses._sum.amount || 0), trend: '+0%', up: true, trendLabel: 'dashboard.vsLastMonth' },
      },
      patientTileStats: { daily: 0, weekly: 0, monthly: await prisma.patient.count({ where: { createdAt: { gte: startOfMonth }, deletedAt: null } }), males: await prisma.patient.count({ where: { gender: 'male', deletedAt: null } }), females: await prisma.patient.count({ where: { gender: 'female', deletedAt: null } }) },
      revenueOverview: { revenue: 0, expenses: revenue._sum.amount || 0, netProfit: 0, sessions: totalSessions, invoices: 0 },
      monthlyRevenue: Object.entries(revenueByMonth).map(([month, value]) => ({ month, revenue: value })),
      monthlyPatients: [],
      sessionTypes: [],
      appointmentStatuses: [],
      recentAppointments: appointments.slice(0, 5).map(a => ({ id: a.id, patient: a.patient, phone: a.phone, therapist: a.therapist, date: a.date, status: a.status, statusKey: a.status || 'pending' })),
      recentPatients: patients.slice(0, 5).map(p => ({ id: p.id, name: `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.phone || '—', phone: p.phone, gender: p.gender || '—', registrationDate: p.registrationDate?.toISOString() || null, createdAt: p.createdAt.toISOString() })),
      totals: { totalPatients, totalSessions, totalAppointments: totalAppts, totalTherapists: activeEmployees },
      growthRates: { patients: '0%', appointments: '0%', sessions: '0%', revenue: '0%', expenses: '0%' },
    });
  } catch (err) {
    return handleError(err, '/api/dashboard/stats');
  }
}
