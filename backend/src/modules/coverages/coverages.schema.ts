import { z } from 'zod';

export const createCoverageSchema = z.object({
  name: z.string().min(1),
  special: z.boolean().optional(),
  date: z.string().min(1),
  price: z.coerce.number().positive(),
  time: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const updateCoverageSchema = z.object({
  name: z.string().min(1).optional(),
  special: z.boolean().optional(),
  date: z.string().min(1).optional(),
  price: z.coerce.number().positive().optional(),
  time: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});
