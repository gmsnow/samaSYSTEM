import { z } from 'zod';

export const createSessionSchema = z.object({
  fullname: z.string().min(1),
  session_type: z.string().min(1),
  speacial: z.string().optional(),
  session_date: z.string().optional().nullable(),
  price: z.preprocess(v => (v === '' || v === null || v === undefined) ? undefined : v, z.coerce.number().positive().optional()),
  notes: z.string().optional(),
  subscription_period: z.string().optional(),
  subscription_amount: z.coerce.number().optional(),
  subscription_day: z.coerce.number().int().optional(),
  subscription_attendance: z.string().optional(),
});

export const updateSessionSchema = z.object({
  fullname: z.string().min(1).optional(),
  session_type: z.string().min(1).optional(),
  speacial: z.string().optional(),
  session_date: z.string().optional().nullable(),
  price: z.preprocess(v => (v === '' || v === null || v === undefined) ? undefined : v, z.coerce.number().positive().optional()),
  notes: z.string().optional(),
  subscription_period: z.string().optional(),
  subscription_amount: z.coerce.number().optional(),
  subscription_day: z.coerce.number().int().optional(),
  subscription_attendance: z.string().optional(),
});
