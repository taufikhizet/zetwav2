/**
 * Session Service Types
 * Enhanced with WAHA-like comprehensive configuration
 */

// Re-export comprehensive types from central location
export type {
  SessionConfig,
  ProxyConfig,
  WebhookConfig,
  IgnoreConfig,
  ClientConfig,
  NowebConfig,
  StoreConfig,
  RetriesConfig,
  HmacConfig,
  CustomHeader,
  RetryPolicy,
  SessionInfo,
  MeInfo,
  QRCodeFormat,
  QRCodeQuery,
  QRCodeResponse,
  RequestCodeInput,
  PairingCodeResponse,
} from '../../types/session-config.js';

// Session status enum - supports both WAHA-style and legacy status values
export type SessionStatus =
  // WAHA-style status (preferred)
  | 'STOPPED'
  | 'STARTING'
  | 'SCAN_QR_CODE'
  | 'WORKING'
  | 'FAILED'
  // Legacy status (for backward compatibility)
  | 'INITIALIZING'
  | 'QR_READY'
  | 'AUTHENTICATING'
  | 'CONNECTED'
  | 'DISCONNECTED'
  | 'LOGGED_OUT';

// Webhook event types (extended with WAHA events)
export type WebhookEvent =
  // Message events
  | 'message'
  | 'message.any'
  | 'message.ack'
  | 'message.reaction'
  | 'message.revoked'
  | 'message.edited'
  | 'message.waiting'
  // Session events
  | 'session.status'
  // Group events
  | 'group.join'
  | 'group.leave'
  | 'group.update'
  // Presence events
  | 'presence.update'
  // Poll events
  | 'poll.vote'
  | 'poll.vote.failed'
  // Call events
  | 'call.received'
  | 'call.accepted'
  | 'call.rejected'
  // Label events
  | 'label.upsert'
  | 'label.deleted'
  | 'label.chat.added'
  | 'label.chat.deleted'
  // Legacy events (for backward compatibility)
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
  // Wildcard
  | 'ALL'
  | '*';

// Import comprehensive types
import type { SessionConfig } from '../../types/session-config.js';

export interface CreateSessionInput {
  /** Session name (alphanumeric, hyphens, underscores only) */
  name: string;
  /** Optional description */
  description?: string;
  /** Session configuration (webhooks, proxy, metadata, etc.) */
  config?: SessionConfig;
  /** Start session immediately after creation (default: true) */
  start?: boolean;
}

export interface UpdateSessionInput {
  /** New session name */
  name?: string;
  /** New description */
  description?: string;
  /** Updated session configuration */
  config?: SessionConfig;
}

export interface CreateWebhookInput {
  name: string;
  url: string;
  events?: WebhookEvent[];
  headers?: Record<string, string>;
  secret?: string;
  retryCount?: number;
  timeout?: number;
  /** Retry configuration */
  retries?: {
    attempts?: number;
    delaySeconds?: number;
    policy?: 'linear' | 'exponential' | 'constant';
  };
  /** Custom headers to send with webhook */
  customHeaders?: Array<{ name: string; value: string }>;
}

export interface UpdateWebhookInput extends Partial<CreateWebhookInput> {
  isActive?: boolean;
}
