import { Request, Response, NextFunction } from 'express';
import * as dashboardService from './dashboard.service.js';

export async function stats(req: Request, res: Response, next: NextFunction) {
  try {
    const locale = req.query.locale as string || 'ar';
    const result = await dashboardService.getStats(locale);
    res.json(result);
  } catch (err) { next(err); }
}

export async function dailyReport(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await dashboardService.getDailyReportData();
    res.render('daily-report', data);
  } catch (err) { next(err); }
}

export async function weeklyReport(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await dashboardService.getWeeklyReportData();
    res.render('weekly-report', data);
  } catch (err) { next(err); }
}

export async function monthlyReport(req: Request, res: Response, next: NextFunction) {
  try {
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const data = await dashboardService.getMonthlyReportData(month, year);
    res.render('monthly-report', data);
  } catch (err) { next(err); }
}
