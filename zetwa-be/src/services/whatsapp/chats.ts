/**
 * WhatsApp Chat Management Functions
 */

import type { WASession } from './types.js';
import { SessionNotConnectedError, BadRequestError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import { formatChatId } from './messaging.js';

/**
 * Archive a chat
 */
export async function archiveChat(session: WASession, chatId: string): Promise<boolean> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const formattedChatId = formatChatId(chatId);
  const chat = await session.client.getChatById(formattedChatId);
  
  await chat.archive();
  
  logger.info({ sessionId: session.sessionId, chatId: formattedChatId }, 'Chat archived');
  return true;
}

/**
 * Unarchive a chat
 */
export async function unarchiveChat(session: WASession, chatId: string): Promise<boolean> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const formattedChatId = formatChatId(chatId);
  const chat = await session.client.getChatById(formattedChatId);
  
  await chat.unarchive();
  
  logger.info({ sessionId: session.sessionId, chatId: formattedChatId }, 'Chat unarchived');
  return true;
}

/**
 * Delete a chat
 */
export async function deleteChat(session: WASession, chatId: string): Promise<boolean> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const formattedChatId = formatChatId(chatId);
  const chat = await session.client.getChatById(formattedChatId);
  
  await chat.delete();
  
  logger.info({ sessionId: session.sessionId, chatId: formattedChatId }, 'Chat deleted');
  return true;
}

/**
 * Pin a chat
 */
export async function pinChat(session: WASession, chatId: string): Promise<boolean> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const formattedChatId = formatChatId(chatId);
  const chat = await session.client.getChatById(formattedChatId);
  
  await chat.pin();
  
  logger.info({ sessionId: session.sessionId, chatId: formattedChatId }, 'Chat pinned');
  return true;
}

/**
 * Unpin a chat
 */
export async function unpinChat(session: WASession, chatId: string): Promise<boolean> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const formattedChatId = formatChatId(chatId);
  const chat = await session.client.getChatById(formattedChatId);
  
  await chat.unpin();
  
  logger.info({ sessionId: session.sessionId, chatId: formattedChatId }, 'Chat unpinned');
  return true;
}

/**
 * Mute a chat
 */
export async function muteChat(session: WASession, chatId: string, duration?: Date): Promise<boolean> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const formattedChatId = formatChatId(chatId);
  const chat = await session.client.getChatById(formattedChatId);
  
  await chat.mute(duration);
  
  logger.info({ sessionId: session.sessionId, chatId: formattedChatId, duration }, 'Chat muted');
  return true;
}

/**
 * Unmute a chat
 */
export async function unmuteChat(session: WASession, chatId: string): Promise<boolean> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const formattedChatId = formatChatId(chatId);
  const chat = await session.client.getChatById(formattedChatId);
  
  await chat.unmute();
  
  logger.info({ sessionId: session.sessionId, chatId: formattedChatId }, 'Chat unmuted');
  return true;
}

/**
 * Mark chat as read
 */
export async function markChatRead(session: WASession, chatId: string): Promise<boolean> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const formattedChatId = formatChatId(chatId);
  const chat = await session.client.getChatById(formattedChatId);
  
  await chat.sendSeen();
  
  logger.info({ sessionId: session.sessionId, chatId: formattedChatId }, 'Chat marked as read');
  return true;
}

/**
 * Mark chat as unread
 */
export async function markChatUnread(session: WASession, chatId: string): Promise<boolean> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const formattedChatId = formatChatId(chatId);
  const chat = await session.client.getChatById(formattedChatId);
  
  await chat.markUnread();
  
  logger.info({ sessionId: session.sessionId, chatId: formattedChatId }, 'Chat marked as unread');
  return true;
}

/**
 * Clear chat messages
 */
export async function clearChat(session: WASession, chatId: string): Promise<boolean> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const formattedChatId = formatChatId(chatId);
  const chat = await session.client.getChatById(formattedChatId);
  
  await chat.clearMessages();
  
  logger.info({ sessionId: session.sessionId, chatId: formattedChatId }, 'Chat messages cleared');
  return true;
}
