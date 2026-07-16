import { z } from 'zod';

export const createSessionSchema = z.object({
  fullname: z.string().min(1),
  session_type: z.string().min(1),
  speacial: z.string().optional(),
  session_date: z.string().optional().nullable(),
  price: z.coerce.number().positive().optional().nullable(),
  notes: z.string().optional(),
  subscription_period: z.string().optional(),
  subscription_amount: z.string().optional(),
  subscription_day: z.coerce.number().int().optional(),
});

export const updateSessionSchema = z.object({
  fullname: z.string().min(1).optional(),
  session_type: z.string().min(1).optional(),
  speacial: z.string().optional(),
  session_date: z.string().optional().nullable(),
  price: z.coerce.number().positive().optional().nullable(),
  notes: z.string().optional(),
  subscription_period: z.string().optional(),
  subscription_amount: z.string().optional(),
  subscription_day: z.coerce.number().int().optional(),
});
