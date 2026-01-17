import { z } from 'zod';

export const blockContactSchema = z.object({
  block: z.boolean(),
});

export type BlockContactInput = z.infer<typeof blockContactSchema>;
