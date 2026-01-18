/**
 * WhatsApp Storage Service
 * Handles database persistence for messages and chats
 */

import { prisma } from '../../lib/prisma.js';
import { MessageDirection, MessageStatus, MessageType as PrismaMessageType, ChatType } from '@prisma/client';
import type { Chat } from 'whatsapp-web.js';
import type { SerializedMessage, MessageType } from './types.js';

/**
 * Map internal message type to Prisma message type
 */
export function mapToPrismaMessageType(type: MessageType): PrismaMessageType {
  switch (type) {
    case 'text': return PrismaMessageType.TEXT;
    case 'image': return PrismaMessageType.IMAGE;
    case 'video': return PrismaMessageType.VIDEO;
    case 'audio': return PrismaMessageType.AUDIO;
    case 'voice': return PrismaMessageType.AUDIO; // Map voice to AUDIO
    case 'document': return PrismaMessageType.DOCUMENT;
    case 'sticker': return PrismaMessageType.STICKER;
    case 'location': return PrismaMessageType.LOCATION;
    case 'contact': return PrismaMessageType.CONTACT;
    case 'poll': return PrismaMessageType.POLL;
    case 'reaction': return PrismaMessageType.REACTION;
    default: return PrismaMessageType.UNKNOWN;
  }
}

/**
 * Sync chat to database
 */
export async function syncChat(sessionId: string, chat: Chat): Promise<string> {
  const chatType = chat.isGroup ? ChatType.GROUP : ChatType.PRIVATE;
  
  const savedChat = await prisma.chat.upsert({
    where: {
      sessionId_waChatId: {
        sessionId,
        waChatId: chat.id._serialized,
      },
    },
    update: {
      name: chat.name,
      isGroup: chat.isGroup,
      isMuted: chat.isMuted,
      isArchived: chat.archived,
      unreadCount: chat.unreadCount,
      lastMessageAt: new Date(chat.timestamp * 1000),
    },
    create: {
      sessionId,
      waChatId: chat.id._serialized,
      type: chatType,
      name: chat.name,
      isGroup: chat.isGroup,
      isMuted: chat.isMuted,
      isArchived: chat.archived,
      unreadCount: chat.unreadCount,
      lastMessageAt: new Date(chat.timestamp * 1000),
    },
  });
  
  return savedChat.id;
}

/**
 * Save message to database
 */
export async function saveMessage(
  sessionId: string, 
  message: SerializedMessage, 
  direction: MessageDirection,
  waMessageId: string,
  chatId: string
): Promise<void> {
  // Check if message already exists
  const existing = await prisma.message.findUnique({
    where: {
      sessionId_waMessageId: {
        sessionId,
        waMessageId,
      },
    },
  });

  if (existing) return;

  await prisma.message.create({
    data: {
      sessionId,
      chatId,
      waMessageId,
      direction,
      type: mapToPrismaMessageType(message.type),
      body: message.body,
      timestamp: new Date(message.timestamp * 1000),
      status: direction === MessageDirection.INCOMING ? MessageStatus.DELIVERED : MessageStatus.PENDING,
      isFromMe: direction === MessageDirection.OUTGOING,
      isForwarded: false, // Default for now
      mediaUrl: message.mediaUrl,
      mediaType: message.mediaType,
      quotedMessageId: message.quotedMsgId,
      mentionedIds: message.mentionedIds || [],
      caption: message.caption,
      // Metadata stores extra info including from/to which are not in the main schema
      metadata: {
        from: message.from,
        to: message.to,
        author: message.author,
        location: message.location,
        vCards: message.vCards,
      },
    },
  });
}

/**
 * Update message status based on ACK
 */
export async function updateMessageStatus(
  sessionId: string, 
  messageId: string, 
  ack: number
): Promise<void> {
  let status: MessageStatus | undefined;
  // ACK values: 1=SENT, 2=RECEIVED, 3=READ, 4=PLAYED, -1=ERROR
  if (ack === 1) status = MessageStatus.SENT;
  else if (ack === 2) status = MessageStatus.DELIVERED;
  else if (ack === 3 || ack === 4) status = MessageStatus.READ;
  else if (ack < 0) status = MessageStatus.FAILED;

  if (status) {
    await prisma.message.updateMany({
      where: {
        sessionId,
        waMessageId: messageId,
      },
      data: {
        status,
        ackAt: new Date(),
      },
    });
  }
}
