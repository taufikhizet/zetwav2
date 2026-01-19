/**
 * WhatsApp Presence Functions
 * Typing indicators, online status, and seen markers
 */

import type { WASession } from './types.js';
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
 * Subscribe to contact's presence updates
 */
export async function subscribePresence(session: WASession, contactId: string): Promise<void> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const formattedId = contactId.includes('@') ? contactId : `${contactId.replace(/\D/g, '')}@c.us`;
  
  // whatsapp-web.js doesn't have a direct method for this
  // We'll use getContact which subscribes to updates
  await session.client.getContactById(formattedId);
  
  logger.debug({ sessionId: session.sessionId, contactId: formattedId }, 'Subscribed to presence');
}

/**
 * Get contact's presence status
 */
export async function getPresence(
  session: WASession,
  contactId: string
): Promise<{ isOnline: boolean; lastSeen?: number }> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const formattedId = contactId.includes('@') ? contactId : `${contactId.replace(/\D/g, '')}@c.us`;
  
  // whatsapp-web.js doesn't expose presence directly
  // This is a placeholder - actual implementation depends on library support
  await session.client.getContactById(formattedId);
  
  return {
    isOnline: false, // Would need proper presence tracking
    lastSeen: undefined,
  };
}

/**
 * Send typing indicator
 */
export async function sendTyping(session: WASession, chatId: string, typing: boolean): Promise<void> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const formattedChatId = formatChatId(chatId);
  const chat = await session.client.getChatById(formattedChatId);
  
  if (typing) {
    await chat.sendStateTyping();
  } else {
    await chat.clearState();
  }
}

/**
 * Send recording indicator
 */
export async function sendRecording(session: WASession, chatId: string, recording: boolean): Promise<void> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const formattedChatId = formatChatId(chatId);
  const chat = await session.client.getChatById(formattedChatId);
  
  if (recording) {
    await chat.sendStateRecording();
  } else {
    await chat.clearState();
  }
}

/**
 * Mark chat as seen
 */
export async function markSeen(session: WASession, chatId: string): Promise<void> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const formattedChatId = formatChatId(chatId);
  const chat = await session.client.getChatById(formattedChatId);
  await chat.sendSeen();
  
  logger.debug({ sessionId: session.sessionId, chatId }, 'Chat marked as seen');
}
