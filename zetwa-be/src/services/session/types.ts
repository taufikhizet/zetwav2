/**
 * Session Service Types
 */

// Session status enum matching Prisma schema
export type SessionStatus =
  | 'INITIALIZING'
  | 'QR_READY'
  | 'AUTHENTICATING'
  | 'CONNECTED'
  | 'DISCONNECTED'
  | 'FAILED'
  | 'LOGGED_OUT';

// Webhook event types
export type WebhookEvent =
  | 'MESSAGE_RECEIVED'
  | 'MESSAGE_SENT'
  | 'MESSAGE_ACK'
  | 'MESSAGE_REVOKED'
  | 'QR_RECEIVED'
  | 'AUTHENTICATED'
  | 'AUTH_FAILURE'
  | 'READY'
  | 'DISCONNECTED'
  | 'STATE_CHANGE'
  | 'CONTACT_CHANGED'
  | 'GROUP_JOIN'
  | 'GROUP_LEAVE'
  | 'GROUP_UPDATE'
  | 'CALL_RECEIVED'
  | 'ALL';

export interface CreateSessionInput {
  name: string;
  description?: string;
}

export interface UpdateSessionInput {
  name?: string;
  description?: string;
}

export interface CreateWebhookInput {
  name: string;
  url: string;
  events?: WebhookEvent[];
  headers?: Record<string, string>;
  secret?: string;
  retryCount?: number;
  timeout?: number;
}

export interface UpdateWebhookInput extends Partial<CreateWebhookInput> {
  isActive?: boolean;
}
