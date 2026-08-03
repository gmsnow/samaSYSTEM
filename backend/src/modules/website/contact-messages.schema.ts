import { z } from 'zod';

export const updateContactMessageSchema = z.object({
  isResolved: z.boolean().optional(),
});
