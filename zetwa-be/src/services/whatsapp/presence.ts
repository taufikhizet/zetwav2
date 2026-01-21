/**
 * WhatsApp Presence Functions
 * Typing indicators, online status, and seen markers
 */

import type { WASession } from './types.js';
import type { ExtendedWASession } from './store.js';
import { SessionNotConnectedError, BadRequestError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import { formatChatId } from './messaging/core.js';

/**
 * Set presence status
 */
export async function setPresence(
  session: WASession,
  presence: string,
  chatId?: string
): Promise<void> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  if (presence === 'composing' || presence === 'recording') {
    if (!chatId) {
      throw new BadRequestError('chatId is required for composing/recording presence');
    }
    
    const formattedChatId = formatChatId(chatId);
    const chat = await session.client.getChatById(formattedChatId);
    
    if (presence === 'composing') {
      await chat.sendStateTyping();
    } else {
      await chat.sendStateRecording();
    }
  } else if (presence === 'available') {
    await session.client.sendPresenceAvailable();
  } else if (presence === 'unavailable') {
    await session.client.sendPresenceUnavailable();
  } else if (presence === 'paused' && chatId) {
    const formattedChatId = formatChatId(chatId);
    const chat = await session.client.getChatById(formattedChatId);
    await chat.clearState();
  }

  logger.debug({ sessionId: session.sessionId, presence, chatId }, 'Presence set');
}

/**
 * Get all presences
 */
export async function getPresences(session: WASession): Promise<any[]> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }
  
  const extSession = session as ExtendedWASession;
  if (extSession.presenceStore) {
    return Array.from(extSession.presenceStore.values());
  }
  
  return [];
}

/**
 * Subscribe to contact's presence updates
 */
export async function subscribePresence(session: WASession, chatId: string): Promise<void> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const formattedId = formatChatId(chatId);
  const client = session.client;
  
  if (client.pupPage) {
    try {
      await client.pupPage.evaluate(async (chatId) => {
        // @ts-ignore
        const d = window.require || require; 
        const WidFactory = d('WAWebWidFactory');

        const wid = WidFactory.createWidFromWidLike(chatId);
        const chat = d('WAWebChatCollection').ChatCollection.get(wid);
        const tc = chat == null ? void 0 : chat.getTcToken();
        await d('WAWebContactPresenceBridge').subscribePresence(wid, tc);
      }, formattedId);
      logger.debug({ sessionId: session.sessionId, chatId: formattedId }, 'Subscribed to presence (injected)');
    } catch (error) {
       logger.error({ error, sessionId: session.sessionId }, 'Failed to subscribe presence via injection');
       // Fallback
       await session.client.getChatById(formattedId);
    }
  } else {
     await session.client.getChatById(formattedId);
  }
}

/**
 * Get contact's presence status
 */
export async function getPresence(
  session: WASession,
  chatId: string
): Promise<any> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const formattedId = formatChatId(chatId);
  
  // Ensure subscription
  await subscribePresence(session, chatId);
  
  const extSession = session as ExtendedWASession;
  if (extSession.presenceStore && extSession.presenceStore.has(formattedId)) {
    return extSession.presenceStore.get(formattedId);
  }

  return {
    id: formattedId,
    presences: []
  };
}

/**
 * Mark chat as seen
 */
export async function markSeen(
  session: WASession,
  chatId: string
): Promise<void> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const formattedId = formatChatId(chatId);
  const chat = await session.client.getChatById(formattedId);
  await chat.sendSeen();
  
  logger.debug({ sessionId: session.sessionId, chatId: formattedId }, 'Marked chat as seen');
}
