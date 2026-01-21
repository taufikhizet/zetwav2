import { z } from 'zod';

// Update WhatsApp profile name
export const updateWaNameSchema = z.object({
  name: z.string().min(1, 'Name is required').max(25), // WhatsApp max name length
});

// Update WhatsApp about/status
export const updateWaStatusSchema = z.object({
  status: z.string().max(139), // WhatsApp max about length, empty string clears it
});

// Update WhatsApp about/status (deprecated alias)
export const updateWaAboutSchema = z.object({
  about: z.string().max(139), 
});

// Update WhatsApp profile picture
export const updateWaProfilePicSchema = z.object({
  imageUrl: z.string().url().optional(),
  imageBase64: z.string().optional(),
}).refine(
  (data) => data.imageUrl || data.imageBase64,
  'Either imageUrl or imageBase64 is required'
);

// Type exports
export type UpdateWaNameInput = z.infer<typeof updateWaNameSchema>;
export type UpdateWaAboutInput = z.infer<typeof updateWaAboutSchema>;
export type UpdateWaProfilePicInput = z.infer<typeof updateWaProfilePicSchema>;
