/**
 * Session Service Constants
 * Centralized constants to avoid duplication
 */

import { WebhookEvent } from '@prisma/client';

/**
 * All WAHA-style events (preferred modern format)
 * When user selects "*" (all events), we expand to these individual events
 * This prevents storing "ALL" in database which causes display issues
 */
export const ALL_WAHA_EVENTS: WebhookEvent[] = [
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
 * Default timeout for webhook requests (milliseconds)
 */
export const DEFAULT_WEBHOOK_TIMEOUT = 30000;

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG = {
  attempts: 3,
  delaySeconds: 2,
  policy: 'linear' as const,
};

/**
 * Session statuses that indicate failure or disconnection
 */
export const FAILED_STATUSES = ['FAILED', 'DISCONNECTED', 'LOGGED_OUT'];

/**
 * Session statuses that are considered "stale" (need cleanup)
 */
export const STALE_STATUSES = ['QR_READY', 'INITIALIZING', 'AUTHENTICATING'];

/**
 * Session statuses valid for pairing code request
 */
export const PAIRING_VALID_STATUSES = ['QR_READY', 'SCAN_QR', 'SCAN_QR_CODE', 'INITIALIZING', 'STARTING'];
