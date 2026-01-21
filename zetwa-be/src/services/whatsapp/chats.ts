/**
 * WhatsApp Chat Management Functions
 */

import type { WASession } from './types.js';
import { SessionNotConnectedError, BadRequestError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import { formatChatId } from './messaging/index.js';

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

/**
 * Get chats overview
 */
export async function getChatsOverview(session: WASession, limit: number = 20, offset: number = 0) {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const chats = await session.client.getChats();
  chats.sort((a, b) => b.timestamp - a.timestamp);
  const sliced = chats.slice(offset, offset + limit);

  return Promise.all(sliced.map(async (chat) => {
    let picture = null;
    try {
       picture = await session.client.getProfilePicUrl(chat.id._serialized);
    } catch (e) {}

    return {
      id: chat.id._serialized,
      name: chat.name,
      picture: { url: picture },
      lastMessage: chat.lastMessage ? {
        body: chat.lastMessage.body,
        timestamp: chat.lastMessage.timestamp,
        type: chat.lastMessage.type,
        from: chat.lastMessage.from
      } : null,
      unreadCount: chat.unreadCount,
      timestamp: chat.timestamp,
      pinned: chat.pinned,
      muted: chat.isMuted,
      muteExpiration: chat.muteExpiration
    };
  }));
}

/**
 * Get message by ID
 */
export async function getChatMessage(session: WASession, chatId: string, messageId: string) {
    if (session.status !== 'CONNECTED') {
        throw new SessionNotConnectedError(session.sessionId);
    }
    const msg = await session.client.getMessageById(messageId);
    if (!msg) return null;
    return {
        id: msg.id._serialized,
        body: msg.body,
        timestamp: msg.timestamp,
        from: msg.from,
        to: msg.to,
        type: msg.type,
        hasMedia: msg.hasMedia,
        author: msg.author,
        deviceType: msg.deviceType,
        isForwarded: msg.isForwarded,
        forwardingScore: msg.forwardingScore,
        isStatus: msg.isStatus,
        isStarred: msg.isStarred,
        broadcast: msg.broadcast,
        fromMe: msg.fromMe,
        hasQuotedMsg: msg.hasQuotedMsg,
        location: msg.location,
        vCards: msg.vCards,
        mentionIds: msg.mentionedIds,
        orderId: msg.orderId,
        isGif: msg.isGif,
        isEphemeral: msg.isEphemeral,
        links: msg.links
    };
}
