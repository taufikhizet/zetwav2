/**
 * Message Management Functions
 * Forward, Delete, Edit, Star, Download, Info
 */

import { Message } from 'whatsapp-web.js';
import type { WASession } from '../types.js';
import { SessionNotConnectedError, BadRequestError } from '../../../utils/errors.js';
import { logger } from '../../../utils/logger.js';
import { formatChatId } from './core.js';

/**
 * Forward message to another chat
 */
export async function forwardMessage(
  session: WASession,
  messageId: string,
  to: string
): Promise<{ forwarded: boolean; to: string }> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const message = await session.client.getMessageById(messageId);
  
  if (!message) {
    throw new BadRequestError('Message not found');
  }

  const chatId = formatChatId(to);
  await message.forward(chatId);
  
  logger.info({ sessionId: session.sessionId, messageId, to: chatId }, 'Message forwarded');

  return { forwarded: true, to: chatId };
}

/**
 * Delete message
 */
export async function deleteMessage(
  session: WASession,
  messageId: string,
  forEveryone: boolean
): Promise<void> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const message = await session.client.getMessageById(messageId);
  
  if (!message) {
    throw new BadRequestError('Message not found');
  }

  await message.delete(forEveryone);
  
  logger.info({ sessionId: session.sessionId, messageId, forEveryone }, 'Message deleted');
}

/**
 * Edit message
 */
export async function editMessage(
  session: WASession,
  messageId: string,
  newContent: string
): Promise<void> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const message = await session.client.getMessageById(messageId);
  
  if (!message) {
    throw new BadRequestError('Message not found');
  }

  if (!message.fromMe) {
    throw new BadRequestError('Can only edit your own messages');
  }

  await message.edit(newContent);
  
  logger.info({ sessionId: session.sessionId, messageId }, 'Message edited');
}

/**
 * Star/unstar message
 */
export async function starMessage(
  session: WASession,
  messageId: string,
  star: boolean
): Promise<void> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const message = await session.client.getMessageById(messageId);
  
  if (!message) {
    throw new BadRequestError('Message not found');
  }

  if (star) {
    await message.star();
  } else {
    await message.unstar();
  }
  
  logger.info({ sessionId: session.sessionId, messageId, star }, 'Message starred/unstarred');
}

/**
 * Get starred messages
 */
export async function getStarredMessages(session: WASession): Promise<Array<{
  id: string;
  body: string;
  timestamp: number;
  from: string;
}>> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  try {
    const client = session.client as unknown as { getStarredMessages?: () => Promise<Message[]> };
    if (typeof client.getStarredMessages === 'function') {
      const messages = await client.getStarredMessages();
      return messages.map((msg: Message) => ({
        id: msg.id._serialized,
        body: msg.body,
        timestamp: msg.timestamp,
        from: msg.from,
      }));
    }
  } catch {
    // Method not available
  }
  
  logger.warn({ sessionId: session.sessionId }, 'getStarredMessages not available');
  return [];
}

/**
 * Download media from message
 */
export async function downloadMedia(
  session: WASession,
  messageId: string
): Promise<{ mimetype: string; data: string; filename?: string }> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const message = await session.client.getMessageById(messageId);
  
  if (!message) {
    throw new BadRequestError('Message not found');
  }

  if (!message.hasMedia) {
    throw new BadRequestError('Message has no media');
  }

  const media = await message.downloadMedia();
  
  if (!media) {
    throw new BadRequestError('Failed to download media');
  }

  return {
    mimetype: media.mimetype,
    data: media.data,
    filename: media.filename || undefined,
  };
}

/**
 * Get message delivery info
 */
export async function getMessageInfo(
  session: WASession,
  messageId: string
): Promise<{
  id: string;
  delivered: string[];
  read: string[];
  played: string[];
}> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const message = await session.client.getMessageById(messageId);
  
  if (!message) {
    throw new BadRequestError('Message not found');
  }

  const info = await message.getInfo();
  
  return {
    id: messageId,
    delivered: info?.delivery?.map((d) => d.id._serialized) || [],
    read: info?.read?.map((r) => r.id._serialized) || [],
    played: info?.played?.map((p) => p.id._serialized) || [],
  };
}

/**
 * Pin message
 */
export async function pinMessage(
  session: WASession,
  messageId: string,
  duration: number
): Promise<void> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const message = await session.client.getMessageById(messageId);
  
  if (!message) {
    throw new BadRequestError('Message not found');
  }

  await message.pin(duration);
  
  logger.info({ sessionId: session.sessionId, messageId, duration }, 'Message pinned');
}

/**
 * Unpin message
 */
export async function unpinMessage(
  session: WASession,
  messageId: string
): Promise<void> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const message = await session.client.getMessageById(messageId);
  
  if (!message) {
    throw new BadRequestError('Message not found');
  }

  await message.unpin();
  
  logger.info({ sessionId: session.sessionId, messageId }, 'Message unpinned');
}
