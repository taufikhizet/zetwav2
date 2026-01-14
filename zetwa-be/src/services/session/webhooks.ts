/**
 * Session Webhook Management
 */

import { WebhookEvent } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { NotFoundError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import { getById } from './crud.js';
import type { CreateWebhookInput, UpdateWebhookInput } from './types.js';

/**
 * Normalize events from WAHA-style (dot) to database format (underscore)
 */
function normalizeEvents(events: string[]): WebhookEvent[] {
  return events.map((event) => {
    // Handle wildcard
    if (event === '*') return WebhookEvent.ALL;
    
    // Keep legacy uppercase events as-is
    if (event.toUpperCase() === event && event in WebhookEvent) {
      return event as WebhookEvent;
    }
    
    // Convert dot to underscore (e.g., message.any -> message_any)
    const normalized = event.replace(/\./g, '_');
    
    // Check if it's a valid WebhookEvent
    if (normalized in WebhookEvent) {
      return normalized as WebhookEvent;
    }
    
    // Default to ALL if unknown
    return WebhookEvent.ALL;
  });
}

/**
 * Create webhook for session
 */
export async function createWebhook(userId: string, sessionId: string, input: CreateWebhookInput) {
  // Verify session ownership
  await getById(userId, sessionId);

  // Normalize events from WAHA-style (dot) to database format (underscore)
  const normalizedEvents = normalizeEvents(input.events || ['ALL']);

  const webhook = await prisma.webhook.create({
    data: {
      name: input.name,
      url: input.url,
      sessionId,
      events: normalizedEvents,
      headers: input.headers || {},
      secret: input.secret,
      retryCount: input.retryCount || 3,
      timeout: input.timeout || 30000,
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

  // Normalize webhook events from database enum format to WAHA-style format
  return webhooks.map((webhook) => ({
    ...webhook,
    // Convert underscore format to dot format for WAHA compatibility
    events: webhook.events.map((event) => {
      // Keep ALL and legacy events as-is
      if (event === 'ALL' || event.toUpperCase() === event) {
        return event;
      }
      // Convert underscore to dot (e.g., message_any -> message.any)
      return event.replace(/_/g, '.');
    }),
  }));
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

  // Normalize events if provided
  const updateData: Record<string, unknown> = { ...data };
  if (data.events) {
    updateData.events = normalizeEvents(data.events);
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
