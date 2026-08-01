import { z } from 'zod';

export const createInvoiceSchema = z.object({
  employee: z.string().min(1),
  amount: z.number().positive(),
  date: z.string().min(1),
  notes: z.string().optional(),
});

export const updateInvoiceSchema = z.object({
  employee: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  date: z.string().optional(),
  notes: z.string().optional(),
});
