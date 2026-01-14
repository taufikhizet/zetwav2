/**
 * Webhook Service Types
 */

// Re-export WebhookEvent from Prisma to ensure consistency
import { WebhookEvent } from '@prisma/client';
export { WebhookEvent };

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
