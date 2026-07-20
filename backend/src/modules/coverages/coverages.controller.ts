import { Request, Response, NextFunction } from 'express';
import * as coverageService from './coverages.service.js';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const coverages = await coverageService.listCoverages();
    res.json(coverages);
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const c = await coverageService.createCoverage(req.body);
    res.status(201).json({ message: 'تم إضافة التغطية بنجاح', coverage: c });
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const c = await coverageService.updateCoverage(req.params.id as string, req.body);
    res.json({ message: 'تم تحديث التغطية بنجاح', coverage: c });
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await coverageService.deleteCoverage(req.params.id as string);
    res.json({ message: 'تم حذف التغطية بنجاح' });
  } catch (err) { next(err); }
}
