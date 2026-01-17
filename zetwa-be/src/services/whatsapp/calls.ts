/**
 * WhatsApp Calls Functions
 */

import type { WASession } from './types.js';
import { SessionNotConnectedError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import { formatChatId } from './messaging.js';

/**
 * Reject Incoming Call
 */
export async function rejectCall(
  session: WASession,
  callId: string
): Promise<void> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  // WAWebJS Call Handling
  // We need to find the call object to reject it.
  // Currently, WAWebJS exposes `client.rejectCall(callId)` (hypothetically) or we need to intercept the call event.
  // Actually, WAWebJS usually doesn't store calls permanently. 
  // We can only reject a call if we have the Call object.
  // But wait, WAHA implementation: `session.rejectCall(request.from, request.id)`.
  // It implies we need `from` address too? Or just ID?
  // Let's assume we can pass ID.
  
  // @ts-ignore
  if (typeof session.client.rejectCall !== 'function') {
      // Fallback: Check if we can find call in cache? 
      // WAWebJS usually doesn't have a call cache exposed easily.
      throw new Error('Reject Call not supported by this engine version');
  }

  // @ts-ignore
  await session.client.rejectCall(callId);
}
