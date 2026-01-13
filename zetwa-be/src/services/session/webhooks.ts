/**
 * Session Webhook Management
 */

import { prisma } from '../../lib/prisma.js';
import { NotFoundError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import { getById } from './crud.js';
import type { CreateWebhookInput, UpdateWebhookInput } from './types.js';

/**
 * Create webhook for session
 */
export async function createWebhook(userId: string, sessionId: string, input: CreateWebhookInput) {
  // Verify session ownership
  await getById(userId, sessionId);

  const webhook = await prisma.webhook.create({
    data: {
      name: input.name,
      url: input.url,
      sessionId,
      events: input.events || ['ALL'],
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

  return prisma.webhook.findMany({
    where: { sessionId },
    include: {
      _count: {
        select: { logs: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
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

  return prisma.webhook.update({
    where: { id: webhookId },
    data,
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
