/**
 * Webhook Dispatcher
 * Handles event dispatching to registered webhooks
 */

import { prisma } from '../../lib/prisma.js';
import { logger } from '../../utils/logger.js';
import { sendWebhook } from './delivery.js';
import type { WebhookEvent, WebhookPayload } from './types.js';

/**
 * Dispatch webhook to all registered endpoints for a session
 */
export async function dispatch(
  sessionId: string,
  event: WebhookEvent | 'ALL',
  data: unknown
): Promise<void> {
  try {
    // Get all active webhooks for this session
    const webhooks = await prisma.webhook.findMany({
      where: {
        sessionId,
        isActive: true,
        OR: [{ events: { has: event } }, { events: { has: 'ALL' } }],
      },
    });

    if (webhooks.length === 0) {
      logger.debug({ sessionId, event }, 'No webhooks registered for event');
      return;
    }

    const payload: WebhookPayload = {
      event,
      sessionId,
      timestamp: new Date().toISOString(),
      data,
    };

    // Send to all webhooks in parallel
    const results = await Promise.allSettled(
      webhooks.map((webhook) =>
        sendWebhook(
          webhook.id,
          {
            id: webhook.id,
            url: webhook.url,
            headers: webhook.headers,
            secret: webhook.secret,
            timeout: webhook.timeout,
            retryCount: webhook.retryCount,
          },
          payload
        )
      )
    );

    // Log results
    results.forEach((result, index) => {
      const webhook = webhooks[index];
      if (result.status === 'rejected') {
        logger.error(
          { webhookId: webhook?.id, error: result.reason },
          'Webhook dispatch failed'
        );
      }
    });
  } catch (error) {
    logger.error({ sessionId, event, error }, 'Error dispatching webhooks');
  }
}

/**
 * Emit event for internal webhook handling
 * Maps internal event names to webhook events
 */
export function emit(sessionId: string, event: string, data: unknown): void {
  // Map internal event names to WebhookEvent enum
  const eventMap: Record<string, WebhookEvent> = {
    'session.qr': 'QR_RECEIVED',
    'session.authenticated': 'AUTHENTICATED',
    'session.ready': 'READY',
    'session.disconnected': 'DISCONNECTED',
    'session.failed': 'AUTH_FAILURE',
    'message.received': 'MESSAGE_RECEIVED',
    'message.sent': 'MESSAGE_SENT',
    'message.ack': 'MESSAGE_ACK',
    'message.revoked': 'MESSAGE_REVOKED',
    'state.change': 'STATE_CHANGE',
    'contact.changed': 'CONTACT_CHANGED',
    'group.join': 'GROUP_JOIN',
    'group.leave': 'GROUP_LEAVE',
    'group.update': 'GROUP_UPDATE',
    'call.received': 'CALL_RECEIVED',
  };

  const webhookEvent = eventMap[event];
  if (webhookEvent) {
    dispatch(sessionId, webhookEvent, data).catch((err) => {
      logger.error({ sessionId, event, error: err }, 'Failed to dispatch webhook');
    });
  }
}
