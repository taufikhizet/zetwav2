import { z } from 'zod';

// Create label schema (WhatsApp Business only)
export const createLabelSchema = z.object({
  name: z.string().min(1, 'Label name is required').max(100),
  color: z.number().int().min(0).max(19).optional(), // WhatsApp has 20 predefined colors (0-19)
});

// Update label schema
export const updateLabelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.number().int().min(0).max(19).optional(),
});

// Assign label to chat schema
export const assignLabelSchema = z.object({
  labelId: z.string().min(1, 'Label ID is required'),
  chatId: z.string().min(1, 'Chat ID is required'),
});

// Type exports
export type CreateLabelInput = z.infer<typeof createLabelSchema>;
export type UpdateLabelInput = z.infer<typeof updateLabelSchema>;
export type AssignLabelInput = z.infer<typeof assignLabelSchema>;
