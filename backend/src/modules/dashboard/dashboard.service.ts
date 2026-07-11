import { prisma } from '../../config/database.js';

const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const KSA_OFFSET_MS = 3 * 60 * 60 * 1000;

function getKsaDate(now: Date = new Date()) {
  const ksa = new Date(now.getTime() + KSA_OFFSET_MS);
  return {
    year: ksa.getUTCFullYear(),
    month: ksa.getUTCMonth(),
    day: ksa.getUTCDate(),
    dayOfWeek: ksa.getUTCDay(),
  };
}

function ksaMidnight(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day) - KSA_OFFSET_MS);
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function prevMonth(year: number, month: number) {
  return month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };
}

function daysToSaturday(dow: number): number {
  return dow === 6 ? 0 : dow + 1;
}

export async function getStats(locale = 'ar') {
  const now = new Date();
  const ksa = getKsaDate(now);
  const { year: ksaYear, month: ksaMonth, day: ksaDay, dayOfWeek: ksaDow } = ksa;
  const pm = prevMonth(ksaYear, ksaMonth);

  const startOfDay = ksaMidnight(ksaYear, ksaMonth, ksaDay);
  const startOfWeek = ksaMidnight(ksaYear, ksaMonth, ksaDay - daysToSaturday(ksaDow));
  const startOfMonth = ksaMidnight(ksaYear, ksaMonth, 1);
  const startOfLastMonth = ksaMidnight(pm.year, pm.month, 1);
  const monthNames = locale === 'ar' ? MONTHS_AR : MONTHS_EN;

  const todayStr = `${ksaYear}-${pad(ksaMonth + 1)}-${pad(ksaDay)}`;
  const yesterdayKsa = getKsaDate(new Date(Date.UTC(ksaYear, ksaMonth, ksaDay - 1)));
  const yesterdayStr = `${yesterdayKsa.year}-${pad(yesterdayKsa.month + 1)}-${pad(yesterdayKsa.day)}`;
  const thisMonthStr = `${ksaYear}-${pad(ksaMonth + 1)}`;
  const lastMonthStr = `${pm.year}-${pad(pm.month + 1)}`;

  const [
    totalPatients,
    patientsThisMonth,
    patientsLastMonth,
    dailyPatients,
    weeklyPatients,
    patientsMonth,
    totalMales,
    totalFemales,
    todaysAppointments,
    yesterdaysAppointments,
    totalAppointmentsThisMonth,
    totalAppointmentsLastMonth,
    therapists,
    revenueThisMonth,
    revenueLastMonth,
    patientRevenueThisMonth,
    patientRevenueLastMonth,
    sessionsThisMonth,
    sessionsLastMonth,
    sessionTypes,
    recentAppointments,
    appointmentStatuses,
    recentPatients,
    totalExpensesThisMonth,
    totalExpensesLastMonth,
    totalSessions,
    invoicesThisMonth,
  ] = await Promise.all([
    prisma.patient.count({ where: { deletedAt: null } }),
    prisma.patient.count({ where: { deletedAt: null, createdAt: { gte: startOfMonth } } }),
    prisma.patient.count({
      where: { deletedAt: null, createdAt: { gte: startOfLastMonth, lt: startOfMonth } },
    }),
    prisma.patient.count({ where: { deletedAt: null, createdAt: { gte: startOfDay } } }),
    prisma.patient.count({ where: { deletedAt: null, createdAt: { gte: startOfWeek } } }),
    prisma.patient.count({ where: { deletedAt: null, createdAt: { gte: startOfMonth } } }),
    prisma.patient.count({ where: { deletedAt: null, gender: { in: ['ذكر', 'male'] } } }),
    prisma.patient.count({ where: { deletedAt: null, gender: { in: ['أنثى', 'female'] } } }),
    prisma.appointment.count({ where: { deletedAt: null, date: todayStr } }),
    prisma.appointment.count({ where: { deletedAt: null, date: yesterdayStr } }),
    prisma.appointment.count({ where: { deletedAt: null, date: { startsWith: thisMonthStr } } }),
    prisma.appointment.count({ where: { deletedAt: null, date: { startsWith: lastMonthStr } } }),
    prisma.user.count({ where: { deletedAt: null, role: 'THERAPIST', isActive: true } }),
    prisma.session.aggregate({
      where: { deletedAt: null, sessionDate: { gte: startOfMonth } },
      _sum: { price: true },
    }),
    prisma.session.aggregate({
      where: { deletedAt: null, sessionDate: { gte: startOfLastMonth, lt: startOfMonth } },
      _sum: { price: true },
    }),
    prisma.patient.aggregate({
      where: { deletedAt: null, createdAt: { gte: startOfMonth } },
      _sum: { price: true },
    }),
    prisma.patient.aggregate({
      where: { deletedAt: null, createdAt: { gte: startOfLastMonth, lt: startOfMonth } },
      _sum: { price: true },
    }),
    prisma.session.count({ where: { deletedAt: null, sessionDate: { gte: startOfMonth } } }),
    prisma.session.count({
      where: { deletedAt: null, sessionDate: { gte: startOfLastMonth, lt: startOfMonth } },
    }),
    prisma.session.groupBy({
      by: ['sessionType'],
      where: { deletedAt: null },
      _count: true,
    }),
    prisma.appointment.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.appointment.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: true,
    }),
    prisma.patient.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.expense.aggregate({
      where: { deletedAt: null, date: { startsWith: thisMonthStr } },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: { deletedAt: null, date: { startsWith: lastMonthStr } },
      _sum: { amount: true },
    }),
    prisma.session.count({ where: { deletedAt: null } }),
    prisma.session.count({ where: { deletedAt: null, sessionDate: { gte: startOfMonth } } }),
  ]);

  const revThis = (revenueThisMonth._sum.price ?? 0) + (patientRevenueThisMonth._sum.price ?? 0);
  const revLast = (revenueLastMonth._sum.price ?? 0) + (patientRevenueLastMonth._sum.price ?? 0);
  const revChange = revLast > 0 ? ((revThis - revLast) / revLast) * 100 : 0;
  const patientGrowth = patientsLastMonth > 0
    ? ((patientsThisMonth - patientsLastMonth) / patientsLastMonth) * 100
    : 0;
  const apptGrowth = totalAppointmentsLastMonth > 0
    ? ((totalAppointmentsThisMonth - totalAppointmentsLastMonth) / totalAppointmentsLastMonth) * 100
    : 0;
  const sessionsGrowth = sessionsLastMonth > 0
    ? ((sessionsThisMonth - sessionsLastMonth) / sessionsLastMonth) * 100
    : 0;
  const expenseLastAmt = totalExpensesLastMonth._sum.amount ?? 0;
  const expenseThisAmt = totalExpensesThisMonth._sum.amount ?? 0;
  const expenseGrowth = expenseLastAmt > 0
    ? ((expenseThisAmt - expenseLastAmt) / expenseLastAmt) * 100
    : 0;

  const formatTrend = (val: number) => val >= 0 ? `+${val.toFixed(1)}%` : `${val.toFixed(1)}%`;

  const monthlyRevArr = await getMonthlyRevenue(ksaYear);
  const monthlyPatArr = await getMonthlyPatients(ksaYear);

  const recent = recentAppointments.map(a => ({
    id: a.id,
    patient: a.patient,
    phone: a.phone,
    therapist: a.therapist,
    date: a.date,
    status: a.status,
    statusKey: a.status === 'paid' ? 'dashboard.paid' : a.status === 'cancelled' ? 'dashboard.cancelled' : 'dashboard.pending',
  }));

  const recentPats = recentPatients.map(p => ({
    id: p.id,
    name: `${p.firstName || ''} ${p.lastName || ''}`.trim() || '—',
    phone: p.phone || '—',
    gender: p.gender || '—',
    registrationDate: p.registrationDate,
    createdAt: p.createdAt,
  }));

  const sessionTypeChart = sessionTypes.map((s, i) => ({
    name: s.sessionType || 'other',
    value: s._count,
    color: ['#3e5679', '#2e7d32', '#7c4dff', '#e65100', '#00838f', '#558b2f', '#c62828', '#6a1b9a'][i % 8],
  }));

  const apptStatusDistribution = appointmentStatuses.map((s, i) => ({
    name: s.status || 'unknown',
    value: s._count,
    color: ['#3e5679', '#2e7d32', '#7c4dff', '#e65100'][i % 4],
  }));

  const expensesMonth = totalExpensesThisMonth._sum.amount ?? 0;
  const netProfit = revThis - expensesMonth;

  const apptDailyGrowth = yesterdaysAppointments > 0
    ? ((todaysAppointments - yesterdaysAppointments) / yesterdaysAppointments) * 100
    : todaysAppointments > 0 ? 100 : 0;

  return {
    mainCards: {
      totalPatients: { value: totalPatients, trend: formatTrend(patientGrowth), up: patientGrowth >= 0, trendLabel: 'dashboard.vsLastMonth' },
      todaysAppointments: { value: todaysAppointments, trend: formatTrend(apptDailyGrowth), up: apptDailyGrowth >= 0, trendLabel: 'dashboard.vsYesterday' },
      activeTherapists: { value: therapists, trend: '+0%', up: true, trendLabel: '' },
      monthlyRevenue: { value: revThis, trend: formatTrend(revChange), up: revChange >= 0, trendLabel: 'dashboard.vsLastMonth' },
    },
    patientTileStats: {
      daily: dailyPatients,
      weekly: weeklyPatients,
      monthly: patientsMonth,
      males: totalMales,
      females: totalFemales,
    },
    revenueOverview: {
      revenue: revThis,
      expenses: expensesMonth,
      netProfit,
      sessions: sessionsThisMonth,
      patientRevenue: patientRevenueThisMonth._sum.price ?? 0,
      sessionRevenue: revenueThisMonth._sum.price ?? 0,
      invoices: invoicesThisMonth,
    },
    monthlyRevenue: monthlyRevArr.map((r, i) => ({ month: monthNames[i], revenue: r })),
    monthlyPatients: monthlyPatArr.map((c, i) => ({ month: monthNames[i], count: c })),
    sessionTypes: sessionTypeChart,
    appointmentStatuses: apptStatusDistribution,
    recentAppointments: recent,
    recentPatients: recentPats,
    totals: {
      totalPatients,
      totalSessions,
      totalAppointments: totalAppointmentsThisMonth,
      totalTherapists: therapists,
    },
    growthRates: {
      patients: formatTrend(patientGrowth),
      appointments: formatTrend(apptGrowth),
      sessions: formatTrend(sessionsGrowth),
      revenue: formatTrend(revChange),
      expenses: formatTrend(expenseGrowth),
    },
  };
}

export async function getDailyReportData() {
  const now = new Date();
  const ksa = getKsaDate(now);
  const { year: ksaYear, month: ksaMonth, day: ksaDay, dayOfWeek: ksaDow } = ksa;

  const startOfDay = ksaMidnight(ksaYear, ksaMonth, ksaDay);
  const endOfDay = ksaMidnight(ksaYear, ksaMonth, ksaDay + 1);
  const todayStr = `${ksaYear}-${pad(ksaMonth + 1)}-${pad(ksaDay)}`;

  const days = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
  const dayName = days[ksaDow];
  const dateDisplay = `${dayName} ${pad(ksaDay)}/${pad(ksaMonth + 1)}/${ksaYear}م`;

  const [sessions, patients, expenses, advances] = await Promise.all([
    prisma.session.findMany({
      where: { deletedAt: null, sessionDate: { gte: startOfDay, lt: endOfDay } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.patient.findMany({
      where: { deletedAt: null, createdAt: { gte: startOfDay, lt: endOfDay } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.expense.findMany({
      where: { deletedAt: null, date: todayStr },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.salaryAdvance.findMany({
      where: { deletedAt: null, date: todayStr },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const calcAge = (dob: Date | null) => {
    if (!dob) return '';
    const dobKsa = getKsaDate(dob);
    let age = ksaYear - dobKsa.year;
    if (ksaMonth < dobKsa.month || (ksaMonth === dobKsa.month && ksaDay < dobKsa.day)) age--;
    return age.toString();
  };

  const mappedSessions = sessions.map(s => ({
    id: s.id.slice(0, 8),
    fullname: s.fullname,
    session_type: s.sessionType,
    price: s.price ?? 0,
    note: s.notes || '',
  }));

  const mappedPatients = patients.map(p => ({
    fullname: `${p.firstName || ''} ${p.lastName || ''}`.trim() || '—',
    exam_type: p.examType || '—',
    age: calcAge(p.dateOfBirth),
    sex: p.gender || '—',
    phone: p.phone || '—',
    price: p.price ?? 0,
  }));

  const mappedExpenses = expenses.map(e => ({
    category: e.category,
    amount: e.amount,
    notes: e.notes || '',
  }));

  const mappedAdvances = advances.map(a => ({
    employee_name: a.employee,
    amount: a.amount,
    note: a.notes || '',
  }));

  return { dateDisplay, sessions: mappedSessions, patients: mappedPatients, expenses: mappedExpenses, advances: mappedAdvances };
}

export async function getMonthlyReportData(month?: number, year?: number) {
  const now = new Date();
  const ksa = getKsaDate(now);
  const m = month !== undefined ? month : ksa.month;
  const y = year !== undefined ? year : ksa.year;

  const monthName = MONTHS_AR[m];

  const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  type WeekRow = { weekNumber: number; startDate: string; endDate: string; totalIncome: number; totalExpense: number; net: number };
  const weeklyData: WeekRow[] = [];

  const weekRanges = [
    [1, 7], [8, 14], [15, 21], [22, 28], [29, daysInMonth],
  ];

  for (let wi = 0; wi < weekRanges.length; wi++) {
    const [start, rawEnd] = weekRanges[wi];
    if (start > daysInMonth) break;
    const actualEnd = Math.min(rawEnd, daysInMonth);
    const weekNum = wi + 1;

    const startDate = ksaMidnight(y, m, start);
    const endDate = ksaMidnight(y, m, actualEnd + 1);
    const startStr = `${start} ${monthName}`;
    const endStr = `${actualEnd} ${monthName}`;

    const [sessionRev, patientRev, expenseSum, advanceSum] = await Promise.all([
      prisma.session.aggregate({
        where: { deletedAt: null, sessionDate: { gte: startDate, lt: endDate } },
        _sum: { price: true },
      }),
      prisma.patient.aggregate({
        where: { deletedAt: null, createdAt: { gte: startDate, lt: endDate } },
        _sum: { price: true },
      }),
      prisma.expense.aggregate({
        where: {
          deletedAt: null,
          date: {
            gte: `${y}-${pad(m + 1)}-${pad(start)}`,
            lte: `${y}-${pad(m + 1)}-${pad(actualEnd)}`,
          },
        },
        _sum: { amount: true },
      }),
      prisma.salaryAdvance.aggregate({
        where: {
          deletedAt: null,
          date: {
            gte: `${y}-${pad(m + 1)}-${pad(start)}`,
            lte: `${y}-${pad(m + 1)}-${pad(actualEnd)}`,
          },
        },
        _sum: { amount: true },
      }),
    ]);

    const totalIncome = (sessionRev._sum.price ?? 0) + (patientRev._sum.price ?? 0);
    const totalExpense = (expenseSum._sum.amount ?? 0) + (advanceSum._sum.amount ?? 0);
    const net = totalIncome - totalExpense;

    weeklyData.push({ weekNumber: weekNum, startDate: startStr, endDate: endStr, totalIncome, totalExpense, net });
  }

  return { monthName, year: y, weeklyData };
}

export async function getWeeklyReportData() {
  const now = new Date();
  const ksa = getKsaDate(now);
  const { year: ksaYear, month: ksaMonth, day: ksaDay, dayOfWeek: ksaDow } = ksa;

  const saturdayMidnight = ksaMidnight(ksaYear, ksaMonth, ksaDay - daysToSaturday(ksaDow));

  const dayNames = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];

  const weekData: { day: string; date: string; income: number; expense: number }[] = [];

  for (let d = 0; d < 7; d++) {
    const dayStart = new Date(saturdayMidnight.getTime() + d * 86400000);
    const dayEnd = new Date(saturdayMidnight.getTime() + (d + 1) * 86400000);

    const dayKsa = getKsaDate(dayStart);
    const arabicDay = dayNames[dayKsa.dayOfWeek];
    const dateStr = `${dayKsa.day} ${MONTHS_AR[dayKsa.month]} ${dayKsa.year}`;
    const dateStrExpense = `${dayKsa.year}-${pad(dayKsa.month + 1)}-${pad(dayKsa.day)}`;

    const [sessionRev, patientRev, expenseSum, advanceSum] = await Promise.all([
      prisma.session.aggregate({
        where: { deletedAt: null, sessionDate: { gte: dayStart, lt: dayEnd } },
        _sum: { price: true },
      }),
      prisma.patient.aggregate({
        where: { deletedAt: null, createdAt: { gte: dayStart, lt: dayEnd } },
        _sum: { price: true },
      }),
      prisma.expense.aggregate({
        where: { deletedAt: null, date: dateStrExpense },
        _sum: { amount: true },
      }),
      prisma.salaryAdvance.aggregate({
        where: { deletedAt: null, date: dateStrExpense },
        _sum: { amount: true },
      }),
    ]);

    const income = (sessionRev._sum.price ?? 0) + (patientRev._sum.price ?? 0);
    const expense = (expenseSum._sum.amount ?? 0) + (advanceSum._sum.amount ?? 0);

    weekData.push({ day: arabicDay, date: dateStr, income, expense });
  }

  const satKsa = getKsaDate(saturdayMidnight);
  const friMidnight = new Date(saturdayMidnight.getTime() + 6 * 86400000);
  const friKsa = getKsaDate(friMidnight);

  const weekStartStr = `${satKsa.day} ${MONTHS_AR[satKsa.month]} ${satKsa.year}`;
  const weekEndStr = `${friKsa.day} ${MONTHS_AR[friKsa.month]} ${friKsa.year}`;
  const weekLabel = `من تاريخ ${weekStartStr} - إلى ${weekEndStr}`;

  return { weekData, weekLabel };
}

async function getMonthlyRevenue(year: number) {
  const results = [];
  for (let m = 0; m < 12; m++) {
    const start = ksaMidnight(year, m, 1);
    const end = ksaMidnight(year, m + 1, 1);
    const [sessionRev, patientRev] = await Promise.all([
      prisma.session.aggregate({
        where: { deletedAt: null, sessionDate: { gte: start, lt: end } },
        _sum: { price: true },
      }),
      prisma.patient.aggregate({
        where: { deletedAt: null, createdAt: { gte: start, lt: end } },
        _sum: { price: true },
      }),
    ]);
    results.push((sessionRev._sum.price ?? 0) + (patientRev._sum.price ?? 0));
  }
  return results;
}

async function getMonthlyPatients(year: number) {
  const results = [];
  for (let m = 0; m < 12; m++) {
    const start = ksaMidnight(year, m, 1);
    const end = ksaMidnight(year, m + 1, 1);
    const count = await prisma.patient.count({
      where: { deletedAt: null, createdAt: { gte: start, lt: end } },
    });
    results.push(count);
  }
  return results;
}
