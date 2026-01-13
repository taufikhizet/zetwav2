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

// ================================
// Session Configuration Schemas (WAHA-inspired)
// ================================

// Proxy configuration
const proxyConfigSchema = z.object({
  server: z.string().min(1, 'Proxy server is required'),
  username: z.string().optional(),
  password: z.string().optional(),
}).optional();

// HMAC configuration for webhook security
const hmacConfigSchema = z.object({
  key: z.string().optional(),
}).optional();

// Retry configuration for webhooks
const retriesConfigSchema = z.object({
  delaySeconds: z.number().int().min(1).max(60).optional(),
  attempts: z.number().int().min(0).max(15).optional(),
  policy: z.enum(['linear', 'exponential', 'constant']).optional(),
}).optional();

// Custom header for webhooks
const customHeaderSchema = z.object({
  name: z.string().min(1),
  value: z.string(),
});

// Inline webhook configuration (per session)
const inlineWebhookConfigSchema = z.object({
  url: z.string().url('Invalid webhook URL'),
  events: z.array(z.string()).min(1, 'At least one event is required'),
  hmac: hmacConfigSchema,
  retries: retriesConfigSchema,
  customHeaders: z.array(customHeaderSchema).optional(),
});

// Store configuration for session data persistence
const storeConfigSchema = z.object({
  enabled: z.boolean().default(false),
  fullSync: z.boolean().optional(),
}).optional();

// Engine-specific configuration (NOWEB/Baileys)
const nowebConfigSchema = z.object({
  store: storeConfigSchema,
  markOnline: z.boolean().optional(),
}).optional();

// Ignore configuration for specific event types
const ignoreConfigSchema = z.object({
  status: z.boolean().optional(),
  groups: z.boolean().optional(),
  channels: z.boolean().optional(),
  broadcast: z.boolean().optional(),
}).optional();

// Client configuration - how session appears in WhatsApp
const clientConfigSchema = z.object({
  deviceName: z.string().max(50).optional(),
  browserName: z.string().max(50).optional(),
}).optional();

// Main session configuration schema
export const sessionConfigSchema = z.object({
  webhooks: z.array(inlineWebhookConfigSchema).optional(),
  metadata: z.record(z.string()).optional(),
  proxy: proxyConfigSchema,
  debug: z.boolean().optional(),
  ignore: ignoreConfigSchema,
  client: clientConfigSchema,
  noweb: nowebConfigSchema,
}).optional();

// Session schemas (enhanced with config)
export const createSessionSchema = z.object({
  name: z
    .string()
    .min(1, 'Session name is required')
    .max(50, 'Session name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Session name can only contain letters, numbers, underscores, and hyphens'),
  description: z.string().max(255).optional(),
  config: sessionConfigSchema,
  start: z.boolean().default(true),
});

export const updateSessionSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
  description: z.string().max(255).optional(),
  config: sessionConfigSchema,
});

// QR Code schemas
export const qrCodeQuerySchema = z.object({
  format: z.enum(['image', 'raw']).default('image'),
});

// Request pairing code schema (alternative to QR)
export const requestCodeSchema = z.object({
  phoneNumber: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must be at most 15 digits')
    .regex(/^\d+$/, 'Phone number must contain only digits'),
  method: z.enum(['sms', 'voice']).optional(),
});

// Webhook schemas (extended with WAHA-style events)
export const webhookEventEnum = z.enum([
  // WAHA-style events (preferred)
  'message',
  'message.any',
  'message.ack',
  'message.reaction',
  'message.revoked',
  'message.edited',
  'message.waiting',
  'session.status',
  'group.join',
  'group.leave',
  'group.update',
  'presence.update',
  'poll.vote',
  'poll.vote.failed',
  'call.received',
  'call.accepted',
  'call.rejected',
  'label.upsert',
  'label.deleted',
  'label.chat.added',
  'label.chat.deleted',
  // Legacy events (for backward compatibility)
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
  // Wildcards
  'ALL',
  '*',
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
