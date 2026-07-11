import { Request, Response, NextFunction } from 'express';
import * as patientService from './patients.service.js';
import { notify } from '../../shared/notify.js';

export async function stats(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await patientService.getStats();
    res.json(data);
  } catch (err) { next(err); }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const patients = await patientService.listPatients();
    res.json(patients);
  } catch (err) { next(err); }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const patient = await patientService.getPatient(id);
    res.json(patient);
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const patient = await patientService.createPatient(req.body);
    notify('notification.patient_added', { name: req.body.fullName });
    res.status(201).json({ message: 'Patient saved successfully!', patient });
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const patient = await patientService.updatePatient(id, req.body);
    res.json({ message: 'Patient updated successfully!', patient });
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    await patientService.deletePatient(id);
    res.json({ message: 'Patient deleted successfully!' });
  } catch (err) { next(err); }
}

export async function getFile(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const lang = (req.query.lang as string) || 'en';
    const patient = await patientService.getPatientFile(id);
    const { t } = await import('../../shared/translate.js');
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    const examType = t(`patients.add.form.examType.${patient.examType}`, lang) || patient.examType;
    const gender = t(`patients.add.form.gender.${patient.gender}`, lang) || patient.gender;
    res.render('patient-file', { ...patient, examType, gender, lang, dir, t: (key: string) => t(key, lang) });
  } catch (err) { next(err); }
}
