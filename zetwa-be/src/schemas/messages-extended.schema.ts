import { z } from 'zod';

// Send reaction schema
export const sendReactionSchema = z.object({
  messageId: z.string().min(1, 'Message ID is required'),
  reaction: z.string().min(1, 'Reaction emoji is required').max(10),
});

// Send location schema
export const sendLocationSchema = z.object({
  to: z.string().min(1, 'Recipient is required'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  title: z.string().nullable().optional(),
  description: z.string().max(255).nullable().optional(),
  url: z.string().url().nullable().optional(),
  quotedMessageId: z.string().nullable().optional(),
  reply_to: z.string().nullable().optional(),
});

// Send contact/vCard schema
export const sendContactSchema = z.object({
  to: z.string().min(1, 'Recipient is required'),
  contact: z.object({
    name: z.string().min(1, 'Contact name is required'),
    phone: z.string().min(1, 'Phone number is required'),
    organization: z.string().nullable().optional(),
    email: z.union([z.string().email(), z.literal('')]).nullable().optional(),
  }),
  quotedMessageId: z.string().nullable().optional(),
  reply_to: z.string().nullable().optional(),
});

// Send poll schema
export const sendPollSchema = z.object({
  to: z.string().min(1, 'Recipient is required'),
  name: z.string().min(1, 'Poll title is required').max(255),
  options: z.array(z.string().min(1)).min(2, 'At least 2 options required').max(12),
  multipleAnswers: z.boolean().default(false).optional(),
  selectableCount: z.number().int().min(1).nullable().optional(),
  quotedMessageId: z.string().nullable().optional(),
  reply_to: z.string().nullable().optional(),
});

// Send buttons schema (may not work due to WhatsApp restrictions)
export const sendButtonsSchema = z.object({
  to: z.string().min(1, 'Recipient is required'),
  body: z.string().min(1, 'Body is required'),
  buttons: z.array(z.object({
    id: z.string().min(1),
    text: z.string().min(1).max(20),
  })).min(1).max(3),
  title: z.string().max(60).nullable().optional(),
  footer: z.string().max(60).nullable().optional(),
  quotedMessageId: z.string().nullable().optional(),
  reply_to: z.string().nullable().optional(),
});

// Send list schema (may not work due to WhatsApp restrictions)
export const sendListSchema = z.object({
  to: z.string().min(1, 'Recipient is required'),
  body: z.string().min(1, 'Body is required'),
  buttonText: z.string().min(1, 'Button text is required').max(20),
  sections: z.array(z.object({
    title: z.string().min(1).max(24),
    rows: z.array(z.object({
      id: z.string().min(1),
      title: z.string().min(1).max(24),
      description: z.string().max(72).nullable().optional(),
    })).min(1).max(10),
  })).min(1).max(10),
  title: z.string().max(60).nullable().optional(),
  footer: z.string().max(60).nullable().optional(),
  quotedMessageId: z.string().nullable().optional(),
  reply_to: z.string().nullable().optional(),
});

// Forward message schema
export const forwardMessageSchema = z.object({
  messageId: z.string().min(1, 'Message ID is required'),
  to: z.string().min(1, 'Recipient is required'),
});

// Delete/Edit message schema
export const messageActionSchema = z.object({
  messageId: z.string().min(1, 'Message ID is required'),
});

// Edit message schema
export const editMessageSchema = z.object({
  messageId: z.string().min(1, 'Message ID is required'),
  newContent: z.string().min(1, 'New content is required').max(65536),
});

// Star message schema
export const starMessageSchema = z.object({
  messageId: z.string().min(1, 'Message ID is required'),
  star: z.boolean(),
});

// Send poll vote schema
export const sendPollVoteSchema = z.object({
  to: z.string().min(1, 'Recipient is required'),
  pollMessageId: z.string().min(1, 'Poll message ID is required'),
  selectedOptions: z.array(z.string().min(1)).min(1, 'At least 1 option must be selected'),
});

// Type exports
export type SendReactionInput = z.infer<typeof sendReactionSchema>;
export type SendLocationInput = z.infer<typeof sendLocationSchema>;
export type SendContactInput = z.infer<typeof sendContactSchema>;
export type SendPollInput = z.infer<typeof sendPollSchema>;
export type SendPollVoteInput = z.infer<typeof sendPollVoteSchema>;
export type SendButtonsInput = z.infer<typeof sendButtonsSchema>;
export type SendListInput = z.infer<typeof sendListSchema>;
export type ForwardMessageInput = z.infer<typeof forwardMessageSchema>;
export type MessageActionInput = z.infer<typeof messageActionSchema>;
export type EditMessageInput = z.infer<typeof editMessageSchema>;
export type StarMessageInput = z.infer<typeof starMessageSchema>;
