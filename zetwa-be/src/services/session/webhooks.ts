/**
 * Session Webhook Management
 * CRUD operations for webhook configuration
 */

import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { NotFoundError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import { getById } from './operations/read.js';
import { normalizeEvents, headersToObject } from './utils.js';
import { transformWebhookResponse, type WebhookResponse } from './transformers.js';
import { DEFAULT_WEBHOOK_TIMEOUT, DEFAULT_RETRY_CONFIG } from './constants.js';
import type { CreateWebhookInput, UpdateWebhookInput } from './types.js';

/**
 * Create webhook for session
 */
export async function createWebhook(
  userId: string, 
  sessionId: string, 
  input: CreateWebhookInput
): Promise<WebhookResponse> {
  // Verify session ownership
  await getById(userId, sessionId);

  // Normalize events from WAHA-style (dot) to database format (underscore)
  // If no events provided, default to all events
  const normalizedEvents = normalizeEvents(input.events || ['*']);

  // Build custom headers (no longer mixing with internal config)
  const customHeaders = headersToObject(input.customHeaders);

  const webhook = await prisma.webhook.create({
    data: {
      name: input.name,
      url: input.url,
      sessionId,
      events: normalizedEvents,
      customHeaders: customHeaders ?? undefined,
      secret: input.secret || null,
      // Retry configuration - dedicated columns
      retryAttempts: input.retries?.attempts ?? input.retryCount ?? DEFAULT_RETRY_CONFIG.attempts,
      retryDelay: input.retries?.delaySeconds ?? DEFAULT_RETRY_CONFIG.delaySeconds,
      retryPolicy: input.retries?.policy ?? DEFAULT_RETRY_CONFIG.policy,
      timeout: input.timeout ?? DEFAULT_WEBHOOK_TIMEOUT,
    },
    include: {
      _count: {
        select: { logs: true },
      },
    },
  });

  logger.info({ webhookId: webhook.id, sessionId, url: input.url }, 'Webhook created');

  // Return consistent response format
  return transformWebhookResponse(webhook);
}

/**
 * Get all webhooks for session
 */
export async function getWebhooks(
  userId: string, 
  sessionId: string
): Promise<WebhookResponse[]> {
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

  // Transform all webhooks to consistent response format
  return webhooks.map(transformWebhookResponse);
}

/**
 * Get single webhook by ID
 */
export async function getWebhookById(
  userId: string,
  sessionId: string,
  webhookId: string
): Promise<WebhookResponse> {
  // Verify session ownership
  await getById(userId, sessionId);

  const webhook = await prisma.webhook.findUnique({
    where: { id: webhookId },
    include: {
      _count: {
        select: { logs: true },
      },
    },
  });

  if (!webhook || webhook.sessionId !== sessionId) {
    throw new NotFoundError('Webhook not found');
  }

  return transformWebhookResponse(webhook);
}

/**
 * Update webhook
 */
export async function updateWebhook(
  userId: string,
  sessionId: string,
  webhookId: string,
  data: UpdateWebhookInput
): Promise<WebhookResponse> {
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
    updateData.customHeaders = headersToObject(data.customHeaders) ?? Prisma.DbNull;
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

  const updatedWebhook = await prisma.webhook.update({
    where: { id: webhookId },
    data: updateData,
    include: {
      _count: {
        select: { logs: true },
      },
    },
  });

  logger.info({ webhookId, sessionId, updates: Object.keys(updateData) }, 'Webhook updated');

  // Return consistent response format
  return transformWebhookResponse(updatedWebhook);
}

/**
 * Delete webhook
 */
export async function deleteWebhook(
  userId: string, 
  sessionId: string, 
  webhookId: string
): Promise<void> {
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
 * Toggle webhook active status
 */
export async function toggleWebhookActive(
  userId: string,
  sessionId: string,
  webhookId: string
): Promise<WebhookResponse> {
  // Verify session ownership
  await getById(userId, sessionId);

  const webhook = await prisma.webhook.findUnique({
    where: { id: webhookId },
  });

  if (!webhook || webhook.sessionId !== sessionId) {
    throw new NotFoundError('Webhook not found');
  }

  const updatedWebhook = await prisma.webhook.update({
    where: { id: webhookId },
    data: { isActive: !webhook.isActive },
    include: {
      _count: {
        select: { logs: true },
      },
    },
  });

  logger.info({ webhookId, sessionId, isActive: updatedWebhook.isActive }, 'Webhook status toggled');

  return transformWebhookResponse(updatedWebhook);
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
