import { z } from 'zod';

export const createPatientSchema = z.object({
  examType: z.string().min(1),
  fullName: z.string().min(1),
  age: z.coerce.number().int().positive().optional(),
  gender: z.string().min(1),
  phone: z.string().optional(),
  date: z.string().optional().nullable(),
  price: z.coerce.number().positive().optional(),
});

export const updatePatientSchema = z.object({
  examType: z.string().min(1),
  fullName: z.string().min(1),
  age: z.coerce.number().int().positive().optional(),
  gender: z.string().min(1),
  phone: z.string().optional(),
  date: z.string().optional().nullable(),
  price: z.coerce.number().positive().optional(),
});
