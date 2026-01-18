/**
 * Reaction Functions
 */

import type { WASession } from '../types.js';
import { SessionNotConnectedError, BadRequestError } from '../../../utils/errors.js';
import { logger } from '../../../utils/logger.js';

/**
 * Send Reaction
 */
export async function sendReaction(
  session: WASession,
  messageId: string,
  reaction: string
): Promise<void> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  try {
    // 1. Try simple getMessageById first
    let message: import('whatsapp-web.js').Message | null | undefined = await session.client.getMessageById(messageId);

    // 2. If not found, try to fetch from chat (fallback for no-store)
    if (!message) {
      // Extract chatId from messageId (false_12345@c.us_ID)
      const parts = messageId.split('_');
      if (parts.length >= 2 && parts[1]) {
        const chatId = parts[1];
        try {
          const chat = await session.client.getChatById(chatId);
          // Fetch recent messages
          const messages = await chat.fetchMessages({ limit: 50 });
          message = messages.find(m => m.id._serialized === messageId) || null;
        } catch (err) {
          logger.warn({ sessionId: session.sessionId, messageId, error: err }, 'Failed to fetch messages from chat');
        }
      }
    }
    
    if (message) {
      await message.react(reaction);
      logger.info({ sessionId: session.sessionId, messageId, reaction }, 'Reaction sent');
      return;
    }
    
    logger.warn({ sessionId: session.sessionId, messageId }, 'Message not found for reaction');
    throw new BadRequestError("Message not found - cannot react");
    
  } catch (e: any) {
    logger.error({ sessionId: session.sessionId, messageId, error: e.message }, 'Failed to send reaction');
    throw e;
  }
}

/**
 * Remove reaction from message
 */
export async function removeReaction(session: WASession, messageId: string): Promise<void> {
  // Removing reaction is just sending an empty reaction
  return sendReaction(session, messageId, '');
}
