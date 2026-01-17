/**
 * WhatsApp Events (Calendar) Functions
 */

import type { WASession } from './types.js';
import { SessionNotConnectedError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import { formatChatId } from './messaging.js';

/**
 * Send Event (Calendar)
 */
export async function sendEvent(
  session: WASession,
  to: string,
  eventData: {
    name: string;
    description?: string;
    startTime: number;
    endTime?: number;
    location?: {
      latitude: number;
      longitude: number;
      name?: string;
    };
    canceled?: boolean;
  }
): Promise<any> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const chatId = formatChatId(to);

  // Check if underlying client supports creating events
  // This is a relatively new feature in WhatsApp and libraries
  // @ts-ignore
  if (typeof session.client.createEvent !== 'function') {
    logger.warn({ sessionId: session.sessionId }, 'createEvent not supported by this engine version');
    throw new Error('Create Event not supported by this engine version');
  }

  // @ts-ignore
  const result = await session.client.createEvent(chatId, {
    name: eventData.name,
    description: eventData.description,
    startTime: eventData.startTime,
    endTime: eventData.endTime,
    location: eventData.location,
    canceled: eventData.canceled
  });
  
  return result;
}
