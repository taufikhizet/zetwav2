import { z } from 'zod';

// Post text status schema
export const postTextStatusSchema = z.object({
  text: z.string().min(1, 'Status text is required').max(700),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  font: z.number().int().min(0).max(5).optional(), // WhatsApp has 6 fonts (0-5)
});

// Post media status schema
export const postMediaStatusSchema = z.object({
  mediaUrl: z.string().url().optional(),
  mediaBase64: z.string().optional(),
  mimetype: z.string().optional(),
  caption: z.string().max(700).optional(),
}).refine(
  (data) => data.mediaUrl || data.mediaBase64,
  'Either mediaUrl or mediaBase64 is required'
);

// Type exports
export type PostTextStatusInput = z.infer<typeof postTextStatusSchema>;
export type PostMediaStatusInput = z.infer<typeof postMediaStatusSchema>;
