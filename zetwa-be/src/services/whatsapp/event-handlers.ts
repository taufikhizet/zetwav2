/**
 * WhatsApp Event Handlers
 * Handles all WhatsApp client events
 */

import type { Client } from 'whatsapp-web.js';
import type { WASession, SessionStatus, TypedEventEmitter } from './types.js';
import { setupConnectionHandlers } from './handlers/connection.js';
import { setupMessageHandlers } from './handlers/messages.js';
import { setupGroupHandlers } from './handlers/groups.js';
import { setupCallHandlers } from './handlers/calls.js';

/**
 * Get ACK name from numeric value
 */
export function getAckName(ack: number): string {
  switch (ack) {
    case -1:
      return 'ERROR';
    case 0:
      return 'PENDING';
    case 1:
      return 'SENT';
    case 2:
      return 'RECEIVED';
    case 3:
      return 'READ';
    case 4:
      return 'PLAYED';
    default:
      return 'UNKNOWN';
  }
}

/**
 * Setup all event handlers for a WhatsApp client
 */
export function setupEventHandlers(
  client: Client,
  sessionId: string,
  sessions: Map<string, WASession>,
  events: TypedEventEmitter,
  updateSessionStatus: (sessionId: string, status: SessionStatus) => void
): void {
  // Setup Connection Handlers (QR, Auth, Ready, Disconnect, State)
  setupConnectionHandlers(client, sessionId, sessions, events, updateSessionStatus);

  // Setup Message Handlers (Incoming, Outgoing, ACK, Reaction)
  setupMessageHandlers(client, sessionId, sessions, events);

  // Setup Group Handlers (Join, Leave, Update)
  setupGroupHandlers(client, sessionId, events);

  // Setup Call Handlers (Incoming)
  setupCallHandlers(client, sessionId, events);
}
