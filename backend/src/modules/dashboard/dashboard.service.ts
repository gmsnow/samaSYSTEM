import { prisma } from '../../config/database.js';

const monthsAr = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

export async function getStats(locale = 'ar') {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthNames = locale === 'ar' ? monthsAr : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const lastMonthStr = now.getMonth() === 0
    ? `${now.getFullYear() - 1}-12`
    : `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`;

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

  const monthlyRevArr = await getMonthlyRevenue(now.getFullYear());
  const monthlyPatArr = await getMonthlyPatients(now.getFullYear());

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

  return {
    mainCards: {
      totalPatients: { value: totalPatients, trend: formatTrend(patientGrowth), up: patientGrowth >= 0 },
      todaysAppointments: { value: todaysAppointments, trend: formatTrend(apptGrowth), up: apptGrowth >= 0 },
      activeTherapists: { value: therapists, trend: '+0%', up: true },
      monthlyRevenue: { value: revThis, trend: formatTrend(revChange), up: revChange >= 0 },
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
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const days = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
  const dayName = days[now.getDay()];
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const dateDisplay = `${dayName} ${day}/${month}/${year}م`;

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
    return (now.getFullYear() - new Date(dob).getFullYear()).toString();
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
  const m = month !== undefined ? month : now.getMonth();
  const y = year !== undefined ? year : now.getFullYear();

  const monthNames = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  const monthName = monthNames[m];

  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const weeklyData: { weekNumber: number; startDate: string; endDate: string; totalIncome: number; totalExpense: number; net: number }[] = [];

  const weekRanges = [
    { start: 1, end: 7 },
    { start: 8, end: 14 },
    { start: 15, end: 21 },
    { start: 22, end: 28 },
    { start: 29, end: daysInMonth },
  ];

  for (const range of weekRanges) {
    if (range.start > daysInMonth) break;
    const weekNum = weekRanges.indexOf(range) + 1;
    const actualEnd = Math.min(range.end, daysInMonth);

    const startDate = new Date(y, m, range.start, 0, 0, 0, 0);
    const endDate = new Date(y, m, actualEnd, 23, 59, 59, 999);

    const startStr = `${range.start} ${monthName}`;
    const endStr = `${actualEnd} ${monthName}`;

    const [sessionRev, patientRev, expenseSum, advanceSum] = await Promise.all([
      prisma.session.aggregate({
        where: { deletedAt: null, sessionDate: { gte: startDate, lte: endDate } },
        _sum: { price: true },
      }),
      prisma.patient.aggregate({
        where: { deletedAt: null, createdAt: { gte: startDate, lte: endDate } },
        _sum: { price: true },
      }),
      prisma.expense.aggregate({
        where: {
          deletedAt: null,
          date: {
            gte: `${y}-${String(m + 1).padStart(2, '0')}-${String(range.start).padStart(2, '0')}`,
            lte: `${y}-${String(m + 1).padStart(2, '0')}-${String(actualEnd).padStart(2, '0')}`,
          },
        },
        _sum: { amount: true },
      }),
      prisma.salaryAdvance.aggregate({
        where: {
          deletedAt: null,
          date: {
            gte: `${y}-${String(m + 1).padStart(2, '0')}-${String(range.start).padStart(2, '0')}`,
            lte: `${y}-${String(m + 1).padStart(2, '0')}-${String(actualEnd).padStart(2, '0')}`,
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
  const dayOfWeek = now.getDay(); // 0=Sun..6=Sat
  const saturday = new Date(now);
  saturday.setDate(now.getDate() - (dayOfWeek === 6 ? 0 : dayOfWeek + 1));
  saturday.setHours(0, 0, 0, 0);
  const friday = new Date(saturday);
  friday.setDate(saturday.getDate() + 6);
  friday.setHours(23, 59, 59, 999);

  const dayNames = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
  const monthNames = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

  const weekData: { day: string; date: string; income: number; expense: number }[] = [];

  for (let d = 0; d < 7; d++) {
    const dayStart = new Date(saturday);
    dayStart.setDate(saturday.getDate() + d);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);

    const dayIdx = dayStart.getDay(); // 0=Sun..6=Sat
    const arabicDay = dayNames[dayIdx];
    const dateStr = `${dayStart.getDate()} ${monthNames[dayStart.getMonth()]} ${dayStart.getFullYear()}`;

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
        where: { deletedAt: null, date: `${dayStart.getFullYear()}-${String(dayStart.getMonth() + 1).padStart(2, '0')}-${String(dayStart.getDate()).padStart(2, '0')}` },
        _sum: { amount: true },
      }),
      prisma.salaryAdvance.aggregate({
        where: { deletedAt: null, date: `${dayStart.getFullYear()}-${String(dayStart.getMonth() + 1).padStart(2, '0')}-${String(dayStart.getDate()).padStart(2, '0')}` },
        _sum: { amount: true },
      }),
    ]);

    const income = (sessionRev._sum.price ?? 0) + (patientRev._sum.price ?? 0);
    const expense = (expenseSum._sum.amount ?? 0) + (advanceSum._sum.amount ?? 0);

    weekData.push({ day: arabicDay, date: dateStr, income, expense });
  }

  const weekStartStr = `${saturday.getDate()} ${monthNames[saturday.getMonth()]} ${saturday.getFullYear()}`;
  const weekEndStr = `${friday.getDate()} ${monthNames[friday.getMonth()]} ${friday.getFullYear()}`;
  const weekLabel = `من تاريخ ${weekStartStr} - إلى ${weekEndStr}`;

  return { weekData, weekLabel };
}

async function getMonthlyRevenue(year: number) {
  const results = [];
  for (let m = 0; m < 12; m++) {
    const start = new Date(year, m, 1);
    const end = new Date(year, m + 1, 1);
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
    const start = new Date(year, m, 1);
    const end = new Date(year, m + 1, 1);
    const count = await prisma.patient.count({
      where: { deletedAt: null, createdAt: { gte: start, lt: end } },
    });
    results.push(count);
  }
  return results;
}
