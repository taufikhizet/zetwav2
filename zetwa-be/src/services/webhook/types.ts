/**
 * Webhook Service Types
 */

// Webhook event types matching Prisma schema
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

export interface WebhookPayload {
  event: string;
  sessionId: string;
  timestamp: string;
  data: unknown;
}

export interface WebhookDeliveryResult {
  success: boolean;
  statusCode?: number;
  response?: string;
  error?: string;
  duration: number;
  attempts?: number;
}

export interface WebhookConfig {
  id: string;
  url: string;
  customHeaders?: Record<string, string> | null;
  secret: string | null;
  timeout: number;
  // New schema columns
  retryAttempts: number;
  retryDelay: number;
  retryPolicy: string;
  /** @deprecated Use retryAttempts instead */
  retryCount?: number;
  /** @deprecated Use customHeaders instead */
  headers?: unknown;
}
