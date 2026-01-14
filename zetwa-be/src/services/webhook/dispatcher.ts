/**
 * Webhook Dispatcher
 * Handles event dispatching to registered webhooks
 */

import { WebhookEvent } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { logger } from '../../utils/logger.js';
import { sendWebhook } from './delivery.js';
import type { WebhookPayload } from './types.js';

/**
 * Map internal event names to both WAHA-style and legacy WebhookEvent enums
 * This allows webhooks subscribed to either format to receive events
 */
const EVENT_MAPPINGS: Record<string, WebhookEvent[]> = {
  // Session events
  'session.qr': [WebhookEvent.session_status, WebhookEvent.QR_RECEIVED],
  'session.authenticated': [WebhookEvent.session_status, WebhookEvent.AUTHENTICATED],
  'session.ready': [WebhookEvent.session_status, WebhookEvent.READY],
  'session.disconnected': [WebhookEvent.session_status, WebhookEvent.DISCONNECTED],
  'session.failed': [WebhookEvent.session_status, WebhookEvent.AUTH_FAILURE],
  'session.status': [WebhookEvent.session_status, WebhookEvent.STATE_CHANGE],
  'state.change': [WebhookEvent.session_status, WebhookEvent.STATE_CHANGE],
  
  // Message events
  'message.received': [WebhookEvent.message, WebhookEvent.message_any, WebhookEvent.MESSAGE_RECEIVED],
  'message.sent': [WebhookEvent.message_any, WebhookEvent.MESSAGE_SENT],
  'message.ack': [WebhookEvent.message_ack, WebhookEvent.MESSAGE_ACK],
  'message.revoked': [WebhookEvent.message_revoked, WebhookEvent.MESSAGE_REVOKED],
  'message.reaction': [WebhookEvent.message_reaction],
  'message.edited': [WebhookEvent.message_edited],
  'message.waiting': [WebhookEvent.message_waiting],
  
  // Contact events
  'contact.changed': [WebhookEvent.contact_update, WebhookEvent.CONTACT_CHANGED],
  'contact.update': [WebhookEvent.contact_update, WebhookEvent.CONTACT_CHANGED],
  
  // Group events
  'group.join': [WebhookEvent.group_join, WebhookEvent.GROUP_JOIN],
  'group.leave': [WebhookEvent.group_leave, WebhookEvent.GROUP_LEAVE],
  'group.update': [WebhookEvent.group_update, WebhookEvent.GROUP_UPDATE],
  
  // Presence events
  'presence.update': [WebhookEvent.presence_update],
  
  // Call events
  'call.received': [WebhookEvent.call_received, WebhookEvent.CALL_RECEIVED],
  'call.accepted': [WebhookEvent.call_accepted],
  'call.rejected': [WebhookEvent.call_rejected],
  
  // Poll events
  'poll.vote': [WebhookEvent.poll_vote],
  'poll.vote.failed': [WebhookEvent.poll_vote_failed],
  
  // Label events
  'label.upsert': [WebhookEvent.label_upsert],
  'label.deleted': [WebhookEvent.label_deleted],
  'label.chat.added': [WebhookEvent.label_chat_added],
  'label.chat.deleted': [WebhookEvent.label_chat_deleted],
  
  // Chat events
  'chat.archive': [WebhookEvent.chat_archive],
};

/**
 * Dispatch webhook to all registered endpoints for a session
 */
export async function dispatch(
  sessionId: string,
  event: WebhookEvent,
  data: unknown
): Promise<void> {
  try {
    // Get all active webhooks for this session that are subscribed to this event
    // Note: We no longer store 'ALL' in database - all events are expanded to individual events
    const webhooks = await prisma.webhook.findMany({
      where: {
        sessionId,
        isActive: true,
        events: { has: event },
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
            customHeaders: webhook.customHeaders as Record<string, string> | null,
            secret: webhook.secret,
            timeout: webhook.timeout,
            retryAttempts: webhook.retryAttempts,
            retryDelay: webhook.retryDelay,
            retryPolicy: webhook.retryPolicy,
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
 * Maps internal event names to webhook events and dispatches to all matching event types
 */
export function emit(sessionId: string, event: string, data: unknown): void {
  const webhookEvents = EVENT_MAPPINGS[event];
  
  if (!webhookEvents || webhookEvents.length === 0) {
    logger.debug({ sessionId, event }, 'No webhook mapping for internal event');
    return;
  }

  // Dispatch to all mapped event types to ensure webhooks receive the event
  // regardless of whether they're using WAHA-style or legacy event names
  const uniqueEvents = [...new Set(webhookEvents)];
  
  for (const webhookEvent of uniqueEvents) {
    dispatch(sessionId, webhookEvent, data).catch((err) => {
      logger.error({ sessionId, event, webhookEvent, error: err }, 'Failed to dispatch webhook');
    });
  }
}
