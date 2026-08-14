import { Request, Response, NextFunction } from 'express';
import * as dashboardService from './dashboard.service.js';
import { t } from '../../shared/translate.js';
import ExcelJS from 'exceljs';

export async function stats(req: Request, res: Response, next: NextFunction) {
  try {
    const locale = req.query.locale as string || 'ar';
    const period = (req.query.period as string) || 'monthly';
    const result = await dashboardService.getStats(locale, period as 'daily' | 'weekly' | 'monthly');
    res.json(result);
  } catch (err) { next(err); }
}

export async function dailyReport(req: Request, res: Response, next: NextFunction) {
  try {
    const date = req.query.date as string | undefined;
    const autoprint = req.query.autoprint !== '0';
    const data = await dashboardService.getDailyReportData(date);
    res.render('daily-report', { ...data, autoprint });
  } catch (err) { next(err); }
}

export async function dailySummary(req: Request, res: Response, next: NextFunction) {
  try {
    const date = req.query.date as string | undefined;
    const data = await dashboardService.getDailySummary(date);
    res.json(data);
  } catch (err) { next(err); }
}

export async function weeklyReport(req: Request, res: Response, next: NextFunction) {
  try {
    const weekStart = req.query.weekStart as string | undefined;
    const autoprint = req.query.autoprint !== '0';
    const data = await dashboardService.getWeeklyReportData(weekStart);
    res.render('weekly-report', { ...data, autoprint });
  } catch (err) { next(err); }
}

export async function weeklySummary(req: Request, res: Response, next: NextFunction) {
  try {
    const weekStart = req.query.weekStart as string | undefined;
    const data = await dashboardService.getWeeklySummary(weekStart);
    res.json(data);
  } catch (err) { next(err); }
}

export async function monthlySummary(req: Request, res: Response, next: NextFunction) {
  try {
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const data = await dashboardService.getMonthlySummary(month, year);
    res.json(data);
  } catch (err) { next(err); }
}

export async function receivablesSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await dashboardService.getReceivablesSummary();
    res.json(data);
  } catch (err) { next(err); }
}

export async function receivablesTable(req: Request, res: Response, next: NextFunction) {
  try {
    const month = req.query.month as string | undefined;
    const data = await dashboardService.getReceivablesTable(month);
    res.json(data);
  } catch (err) { next(err); }
}

const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

export async function receivablesReport(req: Request, res: Response, next: NextFunction) {
  try {
    const month = req.query.month as string | undefined;
    const autoprint = req.query.autoprint !== '0';
    const rows = await dashboardService.getReceivablesTable(month);
    let monthLabel = 'الكل';
    if (month) {
      const m = Number(month.slice(5, 7)) - 1;
      const y = Number(month.slice(0, 4));
      monthLabel = `${MONTHS_AR[m]} ${y}`;
    }
    res.render('receivables-report', { rows, monthLabel, autoprint });
  } catch (err) { next(err); }
}

export async function receivablesExcel(req: Request, res: Response, next: NextFunction) {
  try {
    const lang = (req.query.lang as string) || 'ar';
    const month = req.query.month as string | undefined;
    const rows = await dashboardService.getReceivablesTable(month);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SAMA Center';
    const sheet = workbook.addWorksheet(t('receivables.report.sheetName', lang), {
      views: [{ rightToLeft: lang === 'ar' }],
    });

    sheet.columns = [
      { header: t('receivables.report.employee', lang), key: 'name', width: 26 },
      { header: t('receivables.report.department', lang), key: 'department', width: 18 },
      { header: t('receivables.report.salary', lang), key: 'salary', width: 14 },
      { header: t('receivables.report.coverages', lang), key: 'coverages', width: 14 },
      { header: t('receivables.report.advances', lang), key: 'advances', width: 14 },
      { header: t('receivables.report.net', lang), key: 'net', width: 16 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3E5679' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 22;

    rows.forEach(r => {
      sheet.addRow({
        name: r.name,
        department: r.department || '',
        salary: r.salary,
        coverages: r.coverages,
        advances: r.advances,
        net: r.net,
      });
    });

    const totalRow = sheet.addRow({
      name: t('receivables.report.total', lang),
      department: '',
      salary: rows.reduce((s, r) => s + r.salary, 0),
      coverages: rows.reduce((s, r) => s + r.coverages, 0),
      advances: rows.reduce((s, r) => s + r.advances, 0),
      net: rows.reduce((s, r) => s + r.net, 0),
    });
    totalRow.font = { bold: true };
    totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDE9FE' } };

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      row.alignment = { vertical: 'middle' };
      if (rowNumber % 2 === 0 && rowNumber !== sheet.rowCount) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4F6F9' } };
      }
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="receivables-report.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) { next(err); }
}

export async function monthlyReport(req: Request, res: Response, next: NextFunction) {
  try {
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const autoprint = req.query.autoprint !== '0';
    const data = await dashboardService.getMonthlyReportData(month, year);
    res.render('monthly-report', { ...data, autoprint });
  } catch (err) { next(err); }
}
