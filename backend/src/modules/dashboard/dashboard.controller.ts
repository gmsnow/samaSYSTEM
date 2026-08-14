import { Request, Response, NextFunction } from 'express';
import * as dashboardService from './dashboard.service.js';

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

export async function monthlyReport(req: Request, res: Response, next: NextFunction) {
  try {
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const autoprint = req.query.autoprint !== '0';
    const data = await dashboardService.getMonthlyReportData(month, year);
    res.render('monthly-report', { ...data, autoprint });
  } catch (err) { next(err); }
}
