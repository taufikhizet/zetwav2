import { z } from 'zod';

export const archiveChatSchema = z.object({
  archive: z.boolean(),
});

export const pinChatSchema = z.object({
  pin: z.boolean(),
});

export const muteChatSchema = z.object({
  duration: z.string().optional(), // ISO Date string or null/undefined
});

export const markChatReadSchema = z.object({
  read: z.boolean(),
});

export type ArchiveChatInput = z.infer<typeof archiveChatSchema>;
export type PinChatInput = z.infer<typeof pinChatSchema>;
export type MuteChatInput = z.infer<typeof muteChatSchema>;
export type MarkChatReadInput = z.infer<typeof markChatReadSchema>;
