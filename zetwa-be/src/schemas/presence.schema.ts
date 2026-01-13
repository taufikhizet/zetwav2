import { z } from 'zod';

// Set presence schema
export const setPresenceSchema = z.object({
  presence: z.enum(['available', 'unavailable', 'composing', 'recording', 'paused']),
  chatId: z.string().optional(), // Required for composing/recording
});

// Subscribe presence schema
export const subscribePresenceSchema = z.object({
  contactId: z.string().min(1, 'Contact ID is required'),
});

// Type exports
export type SetPresenceInput = z.infer<typeof setPresenceSchema>;
export type SubscribePresenceInput = z.infer<typeof subscribePresenceSchema>;
