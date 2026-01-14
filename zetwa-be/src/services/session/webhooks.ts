/**
 * Session Webhook Management
 */

import { WebhookEvent, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { NotFoundError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import { getById } from './crud.js';
import type { CreateWebhookInput, UpdateWebhookInput } from './types.js';

/**
 * All WAHA-style events (preferred modern format)
 * When user selects "*" (all events), we expand to these individual events
 * This prevents storing "ALL" in database which causes display issues
 */
const ALL_WAHA_EVENTS: WebhookEvent[] = [
  WebhookEvent.message,
  WebhookEvent.message_any,
  WebhookEvent.message_ack,
  WebhookEvent.message_reaction,
  WebhookEvent.message_revoked,
  WebhookEvent.message_edited,
  WebhookEvent.message_waiting,
  WebhookEvent.session_status,
  WebhookEvent.group_join,
  WebhookEvent.group_leave,
  WebhookEvent.group_update,
  WebhookEvent.presence_update,
  WebhookEvent.poll_vote,
  WebhookEvent.poll_vote_failed,
  WebhookEvent.call_received,
  WebhookEvent.call_accepted,
  WebhookEvent.call_rejected,
  WebhookEvent.label_upsert,
  WebhookEvent.label_deleted,
  WebhookEvent.label_chat_added,
  WebhookEvent.label_chat_deleted,
  WebhookEvent.contact_update,
  WebhookEvent.chat_archive,
];

/**
 * Normalize events from WAHA-style (dot) to database format (underscore)
 * When '*' or 'ALL' is received, expand to all individual events
 */
function normalizeEvents(events: string[]): WebhookEvent[] {
  // Check if wildcard is present - expand to all WAHA events
  if (events.some(e => e === '*' || e === 'ALL')) {
    return ALL_WAHA_EVENTS;
  }

  const result: WebhookEvent[] = [];
  
  for (const event of events) {
    // Keep legacy uppercase events as-is
    if (event.toUpperCase() === event && event in WebhookEvent) {
      result.push(event as WebhookEvent);
      continue;
    }
    
    // Convert dot to underscore (e.g., message.any -> message_any)
    const normalized = event.replace(/\./g, '_');
    
    // Check if it's a valid WebhookEvent
    if (normalized in WebhookEvent) {
      result.push(normalized as WebhookEvent);
    }
    // Skip unknown events instead of defaulting to ALL
  }
  
  // Return unique events, or all events if result is empty
  return result.length > 0 ? [...new Set(result)] : ALL_WAHA_EVENTS;
}

/**
 * Build custom headers JSON from array format
 */
function buildCustomHeaders(customHeaders?: Array<{ name: string; value: string }> | null): Prisma.InputJsonObject | null {
  if (!customHeaders || customHeaders.length === 0) {
    return null;
  }
  
  const headers: Record<string, string> = {};
  for (const h of customHeaders) {
    if (h.name && h.value) {
      headers[h.name] = h.value;
    }
  }
  
  return Object.keys(headers).length > 0 ? headers : null;
}

/**
 * Create webhook for session
 */
export async function createWebhook(userId: string, sessionId: string, input: CreateWebhookInput) {
  // Verify session ownership
  await getById(userId, sessionId);

  // Normalize events from WAHA-style (dot) to database format (underscore)
  // If no events provided, default to all events
  const normalizedEvents = normalizeEvents(input.events || ['*']);

  // Build custom headers (no longer mixing with internal config)
  const customHeaders = buildCustomHeaders(input.customHeaders);

  const webhook = await prisma.webhook.create({
    data: {
      name: input.name,
      url: input.url,
      sessionId,
      events: normalizedEvents,
      customHeaders: customHeaders ?? undefined,
      secret: input.secret || null,
      // Retry configuration - dedicated columns
      retryAttempts: input.retries?.attempts ?? input.retryCount ?? 3,
      retryDelay: input.retries?.delaySeconds ?? 2,
      retryPolicy: input.retries?.policy ?? 'linear',
      timeout: input.timeout ?? 30000,
    },
  });

  logger.info({ webhookId: webhook.id, sessionId }, 'Webhook created');

  return webhook;
}

/**
 * Get webhooks for session
 */
export async function getWebhooks(userId: string, sessionId: string) {
  // Verify session ownership
  await getById(userId, sessionId);

  const webhooks = await prisma.webhook.findMany({
    where: { sessionId },
    include: {
      _count: {
        select: { logs: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Transform webhooks to response format with WAHA-style events
  return webhooks.map((webhook) => ({
    ...webhook,
    // Convert underscore format to dot format for WAHA compatibility
    events: webhook.events.map((event) => {
      // Keep legacy uppercase events as-is (e.g., MESSAGE_RECEIVED)
      if (event.toUpperCase() === event) {
        return event;
      }
      // Convert underscore to dot (e.g., message_any -> message.any)
      return event.replace(/_/g, '.');
    }),
    // Transform customHeaders JSON back to array format for frontend
    customHeaders: transformHeadersToArray(webhook.customHeaders as Record<string, string> | null),
    // Map new columns to frontend expected format
    retries: {
      attempts: webhook.retryAttempts,
      delaySeconds: webhook.retryDelay,
      policy: webhook.retryPolicy,
    },
  }));
}

/**
 * Transform headers JSON object to array format
 */
function transformHeadersToArray(headers: Record<string, string> | null): Array<{ name: string; value: string }> {
  if (!headers) return [];
  return Object.entries(headers).map(([name, value]) => ({ name, value }));
}

/**
 * Update webhook
 */
export async function updateWebhook(
  userId: string,
  sessionId: string,
  webhookId: string,
  data: UpdateWebhookInput
) {
  // Verify session ownership
  await getById(userId, sessionId);

  const webhook = await prisma.webhook.findUnique({
    where: { id: webhookId },
  });

  if (!webhook || webhook.sessionId !== sessionId) {
    throw new NotFoundError('Webhook not found');
  }

  // Build update data with proper types
  const updateData: Prisma.WebhookUpdateInput = {};
  
  // Basic fields
  if (data.name !== undefined) updateData.name = data.name;
  if (data.url !== undefined) updateData.url = data.url;
  if (data.secret !== undefined) updateData.secret = data.secret || null;
  if (data.timeout !== undefined) updateData.timeout = data.timeout;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  
  // Normalize events if provided
  if (data.events) {
    updateData.events = normalizeEvents(data.events);
  }
  
  // Handle custom headers (completely separate from retry config now)
  if (data.customHeaders !== undefined) {
    updateData.customHeaders = buildCustomHeaders(data.customHeaders) ?? Prisma.DbNull;
  }
  
  // Handle retry configuration - each field is a dedicated column
  if (data.retries !== undefined) {
    if (data.retries.attempts !== undefined) {
      updateData.retryAttempts = data.retries.attempts;
    }
    if (data.retries.delaySeconds !== undefined) {
      updateData.retryDelay = data.retries.delaySeconds;
    }
    if (data.retries.policy !== undefined) {
      updateData.retryPolicy = data.retries.policy;
    }
  }
  
  // Legacy support for retryCount
  if (data.retryCount !== undefined && data.retries?.attempts === undefined) {
    updateData.retryAttempts = data.retryCount;
  }

  return prisma.webhook.update({
    where: { id: webhookId },
    data: updateData,
  });
}

/**
 * Delete webhook
 */
export async function deleteWebhook(userId: string, sessionId: string, webhookId: string) {
  // Verify session ownership
  await getById(userId, sessionId);

  const webhook = await prisma.webhook.findUnique({
    where: { id: webhookId },
  });

  if (!webhook || webhook.sessionId !== sessionId) {
    throw new NotFoundError('Webhook not found');
  }

  await prisma.webhook.delete({
    where: { id: webhookId },
  });

  logger.info({ webhookId, sessionId }, 'Webhook deleted');
}

/**
 * Get webhook logs
 */
export async function getWebhookLogs(
  userId: string,
  sessionId: string,
  webhookId: string,
  limit: number = 50
) {
  // Verify session ownership
  await getById(userId, sessionId);

  const webhook = await prisma.webhook.findUnique({
    where: { id: webhookId },
  });

  if (!webhook || webhook.sessionId !== sessionId) {
    throw new NotFoundError('Webhook not found');
  }

  return prisma.webhookLog.findMany({
    where: { webhookId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
