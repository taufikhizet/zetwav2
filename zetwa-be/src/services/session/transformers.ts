/**
 * Webhook Transformation Functions
 * Transforms webhook data between database and API formats
 */

import type { Webhook, Prisma } from '@prisma/client';
import { eventsToWahaFormat, headersToArray } from './utils.js';

/**
 * Webhook with log count (from Prisma query)
 */
type WebhookWithCount = Webhook & {
  _count?: {
    logs: number;
  };
};

/**
 * Webhook response format for API
 */
export interface WebhookResponse {
  id: string;
  name: string;
  url: string;
  sessionId: string;
  events: string[];
  secret: string | null;
  customHeaders: Array<{ name: string; value: string }>;
  retryAttempts: number;
  retryDelay: number;
  retryPolicy: string;
  timeout: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Convenience object for frontend
  retries: {
    attempts: number;
    delaySeconds: number;
    policy: string;
  };
  _count?: {
    logs: number;
  };
}

/**
 * Transform webhook from database format to API response format
 */
export function transformWebhookResponse(webhook: WebhookWithCount): WebhookResponse {
  return {
    id: webhook.id,
    name: webhook.name,
    url: webhook.url,
    sessionId: webhook.sessionId,
    // Convert underscore format to dot format for WAHA compatibility
    events: eventsToWahaFormat(webhook.events),
    secret: webhook.secret,
    // Transform customHeaders JSON back to array format for frontend
    customHeaders: headersToArray(webhook.customHeaders as Record<string, string> | null),
    retryAttempts: webhook.retryAttempts,
    retryDelay: webhook.retryDelay,
    retryPolicy: webhook.retryPolicy,
    timeout: webhook.timeout,
    isActive: webhook.isActive,
    createdAt: webhook.createdAt,
    updatedAt: webhook.updatedAt,
    // Map columns to frontend expected format
    retries: {
      attempts: webhook.retryAttempts,
      delaySeconds: webhook.retryDelay,
      policy: webhook.retryPolicy,
    },
    _count: webhook._count,
  };
}

/**
 * Inline webhook config for session detail response
 */
export interface InlineWebhookConfig {
  url: string;
  events: string[];
  hmac?: { key: string };
  retries: {
    attempts: number;
    delaySeconds: number;
    policy: string;
  };
  customHeaders?: Array<{ name: string; value: string }>;
  timeout: number;
}

/**
 * Transform webhook to inline config format (for session detail)
 */
export function transformToInlineConfig(webhook: {
  url: string;
  events: string[] | import('@prisma/client').WebhookEvent[];
  secret: string | null;
  customHeaders: Prisma.JsonValue;
  retryAttempts: number;
  retryDelay: number;
  retryPolicy: string;
  timeout: number;
}): InlineWebhookConfig {
  // Transform customHeaders from JSON object to array format
  const customHeadersObj = webhook.customHeaders as Record<string, string> | null;
  const customHeaders = customHeadersObj 
    ? Object.entries(customHeadersObj).map(([name, value]) => ({ name, value }))
    : [];
  
  // Ensure events are in WAHA format (with dots)
  const events = (webhook.events as string[]).map((event: string) => {
    if (event.toUpperCase() === event) {
      return event;
    }
    return event.replace(/_/g, '.');
  });
  
  return {
    url: webhook.url,
    events,
    // Include HMAC config if secret exists
    ...(webhook.secret && { hmac: { key: webhook.secret } }),
    // Include retry configuration
    retries: {
      attempts: webhook.retryAttempts,
      delaySeconds: webhook.retryDelay,
      policy: webhook.retryPolicy,
    },
    // Include custom headers if any
    ...(customHeaders.length > 0 && { customHeaders }),
    // Include timeout (converted to seconds for frontend)
    timeout: Math.round(webhook.timeout / 1000),
  };
}
