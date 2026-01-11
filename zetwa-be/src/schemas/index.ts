import { z } from 'zod';

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  avatar: z.string().url().optional(),
});

// Session schemas
export const createSessionSchema = z.object({
  name: z
    .string()
    .min(1, 'Session name is required')
    .max(50, 'Session name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Session name can only contain letters, numbers, underscores, and hyphens'),
  description: z.string().max(255).optional(),
});

export const updateSessionSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
  description: z.string().max(255).optional(),
});

// Webhook schemas
export const webhookEventEnum = z.enum([
  'MESSAGE_RECEIVED',
  'MESSAGE_SENT',
  'MESSAGE_ACK',
  'MESSAGE_REVOKED',
  'QR_RECEIVED',
  'AUTHENTICATED',
  'AUTH_FAILURE',
  'READY',
  'DISCONNECTED',
  'STATE_CHANGE',
  'CONTACT_CHANGED',
  'GROUP_JOIN',
  'GROUP_LEAVE',
  'GROUP_UPDATE',
  'CALL_RECEIVED',
  'ALL',
]);

export const createWebhookSchema = z.object({
  name: z.string().min(1, 'Webhook name is required').max(100),
  url: z.string().url('Invalid webhook URL'),
  events: z.array(webhookEventEnum).default(['ALL']),
  headers: z.record(z.string()).optional(),
  secret: z.string().max(255).optional(),
  retryCount: z.number().int().min(0).max(10).default(3),
  timeout: z.number().int().min(1000).max(60000).default(30000),
});

export const updateWebhookSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  url: z.string().url().optional(),
  events: z.array(webhookEventEnum).optional(),
  headers: z.record(z.string()).optional(),
  secret: z.string().max(255).nullable().optional(),
  retryCount: z.number().int().min(0).max(10).optional(),
  timeout: z.number().int().min(1000).max(60000).optional(),
  isActive: z.boolean().optional(),
});

// Message schemas
export const sendMessageSchema = z.object({
  to: z.string().min(1, 'Recipient is required'),
  message: z.string().min(1, 'Message is required').max(65536),
  quotedMessageId: z.string().optional(),
  mentions: z.array(z.string()).optional(),
});

export const sendMediaSchema = z.object({
  to: z.string().min(1, 'Recipient is required'),
  mediaUrl: z.string().url().optional(),
  mediaBase64: z.string().optional(),
  mimetype: z.string().optional(),
  filename: z.string().optional(),
  caption: z.string().max(1024).optional(),
}).refine(
  (data) => data.mediaUrl || data.mediaBase64,
  'Either mediaUrl or mediaBase64 is required'
);

// API Key schemas
export const createApiKeySchema = z.object({
  name: z.string().min(1, 'API key name is required').max(100),
  permissions: z.array(z.enum(['read', 'write'])).default(['read', 'write']),
  expiresAt: z.string().datetime().optional(),
});

export const updateApiKeySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
});

// Query schemas
export const paginationSchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
});

export const messageQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('50'),
  direction: z.enum(['INCOMING', 'OUTGOING']).optional(),
  type: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'STICKER', 'LOCATION', 'CONTACT']).optional(),
  chatId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
export type CreateWebhookInput = z.infer<typeof createWebhookSchema>;
export type UpdateWebhookInput = z.infer<typeof updateWebhookSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type SendMediaInput = z.infer<typeof sendMediaSchema>;
export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
export type UpdateApiKeyInput = z.infer<typeof updateApiKeySchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type MessageQueryInput = z.infer<typeof messageQuerySchema>;
