import { z } from 'zod';

export const createServiceSchema = z.object({
  name: z.string().min(1),
  price: z.coerce.number().positive(),
  iconUrl: z.string().optional(),
});

export const updateServiceSchema = z.object({
  name: z.string().min(1).optional(),
  price: z.coerce.number().positive().optional(),
  isActive: z.boolean().optional(),
  iconUrl: z.string().optional(),
});
