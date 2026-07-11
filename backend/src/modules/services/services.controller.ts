import { Request, Response, NextFunction } from 'express';
import * as serviceService from './services.service.js';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const services = await serviceService.listServices();
    res.json(services);
  } catch (err) { next(err); }
}
