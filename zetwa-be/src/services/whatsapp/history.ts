/**
 * WhatsApp History Service
 * Handles retrieval of messages and chats from database
 */

import { prisma } from '../../lib/prisma.js';
import type { WASession } from './types.js';
import { SessionNotConnectedError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import { formatChatId } from './messaging/index.js';
import type { Message, Chat } from '@prisma/client';

export interface GetMessagesOptions {
  page?: number;
  limit?: number;
  direction?: 'asc' | 'desc' | 'INCOMING' | 'OUTGOING';
  type?: string;
  chatId?: string;
  startDate?: string;
  endDate?: string;
}

export interface FormattedMessage extends Omit<Partial<Message>, 'timestamp'> {
  id: string;
  _dbId: string;
  timestamp: number | Date; // Allow Date for compatibility if needed, but we aim for number (unix)
  from: string;
  to?: string;
  author?: string;
  _data: any;
}

/**
 * Get messages for a session with filtering and pagination
 */
export async function getMessages(
  sessionId: string,
  options: GetMessagesOptions
) {
  const { 
    page = 1, 
    limit = 50, 
    direction = 'desc', 
    type, 
    chatId, 
    startDate, 
    endDate 
  } = options;

  const where: Record<string, any> = {
    sessionId,
  };

  // Direction filter for message direction (INCOMING/OUTGOING)
  // Note: 'direction' param is overloaded for sort order in some APIs, 
  // but here we check if it matches the enum values if we supported filtering by direction.
  // The original code used `direction` query param for sort order ('asc'/'desc').
  // If we wanted to filter by INCOMING/OUTGOING, we'd need a separate param or check value.
  // Original code:
  // if (direction && (direction === 'asc' || direction === 'desc')) { ... } else { where.direction = direction }
  
  if (direction && direction !== 'asc' && direction !== 'desc') {
    where.direction = direction;
  }

  if (type) where.type = type;
  
  if (chatId) {
    if (chatId.includes('@')) {
      // If chatId is a WhatsApp ID (e.g., 628xxx@c.us), filter by relation
      where.chat = { waChatId: chatId };
    } else {
      // Otherwise assume it's an internal CUID
      where.chatId = chatId;
    }
  }

  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) (where.timestamp as any).gte = new Date(startDate);
    if (endDate) (where.timestamp as any).lte = new Date(endDate);
  }

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where,
      include: {
        chat: {
          select: {
            id: true,
            name: true,
            isGroup: true,
          },
        },
      },
      orderBy: { timestamp: direction === 'asc' || direction === 'desc' ? direction : 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.message.count({ where }),
  ]);

  // Map messages to include from/to from metadata if not present in schema
  const formattedMessages = messages.map(msg => {
    const metadata = msg.metadata as Record<string, any> || {};
    return {
      ...msg,
      id: msg.waMessageId || msg.id, // Prefer WA ID if available
      _dbId: msg.id, // Keep DB ID just in case
      timestamp: Math.floor(msg.timestamp.getTime() / 1000), // Convert to unix timestamp (seconds)
      from: metadata.from || msg.chatId, // Fallback to chatId if missing (approximate)
      to: metadata.to,
      author: metadata.author,
      _data: metadata, // WAHA compatibility
    };
  });

  return {
    messages: formattedMessages,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get chats from database
 */
export async function getChats(sessionId: string, limit: number = 100) {
  const chats = await prisma.chat.findMany({
    where: { sessionId },
    orderBy: { lastMessageAt: 'desc' },
    take: limit,
  });

  return chats.map(chat => ({
    ...chat,
    id: chat.waChatId, // Use WhatsApp ID (e.g. 123@c.us) instead of DB ID
    _dbId: chat.id,
    timestamp: chat.lastMessageAt ? Math.floor(chat.lastMessageAt.getTime() / 1000) : 0,
  }));
}

/**
 * Get live chats directly from WhatsApp Client
 */
export async function getLiveChats(session: WASession) {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const chats = await session.client.getChats();

  return chats.map((chat) => ({
    id: chat.id._serialized,
    name: chat.name,
    isGroup: chat.isGroup,
    isMuted: chat.isMuted,
    unreadCount: chat.unreadCount,
    timestamp: chat.timestamp,
  }));
}
