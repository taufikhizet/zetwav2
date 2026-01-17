/**
 * WhatsApp Message Handlers
 * Handles incoming, outgoing, and ACK message events
 */

import type { Message as WAMessage, Chat } from 'whatsapp-web.js';
import type { WASession, SerializedMessage, MessageType, TypedEventEmitter } from './types.js';
import { prisma } from '../../lib/prisma.js';
import { MessageDirection, MessageStatus, MessageType as PrismaMessageType, ChatType } from '@prisma/client';
import { webhookService } from '../webhook.service.js';
import { logger } from '../../utils/logger.js';
import { getAckName } from './event-handlers.js';

/**
 * Determine message type from WhatsApp message
 */
export function getMessageType(message: WAMessage): MessageType {
  if (message.type === 'chat') return 'text';
  if (message.type === 'image') return 'image';
  if (message.type === 'video') return 'video';
  if (message.type === 'audio') return 'audio';
  if (message.type === 'ptt') return 'voice';
  if (message.type === 'document') return 'document';
  if (message.type === 'sticker') return 'sticker';
  if (message.type === 'location') return 'location';
  if (message.type === 'vcard' || message.type === 'multi_vcard') return 'contact';
  if (message.type === 'poll_creation') return 'poll';
  if (message.type === 'reaction') return 'reaction';
  return 'unknown';
}

/**
 * Map internal message type to Prisma message type
 */
function mapToPrismaMessageType(type: MessageType): PrismaMessageType {
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
async function syncChat(sessionId: string, chat: Chat): Promise<string> {
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
async function saveMessage(
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
 * Ensure chat is loaded for a message
 */
export async function ensureChat(message: WAMessage): Promise<Chat | null> {
  try {
    return await message.getChat();
  } catch {
    return null;
  }
}

/**
 * Serialize WhatsApp message to our format
 */
export async function serializeMessage(message: WAMessage): Promise<SerializedMessage> {
  const chat = await ensureChat(message);
  const type = getMessageType(message);

  const serialized: SerializedMessage = {
    id: message.id._serialized,
    from: message.from,
    to: message.to,
    body: message.body,
    type,
    timestamp: message.timestamp,
    isGroup: message.from.includes('@g.us'),
    isStatus: message.isStatus,
    hasMedia: message.hasMedia,
    hasQuotedMsg: message.hasQuotedMsg,
  };

  // Add group info
  if (chat && serialized.isGroup) {
    serialized.groupId = chat.id._serialized;
    serialized.groupName = chat.name;
  }

  // Add author for group messages
  if (message.author) {
    serialized.author = message.author;
  }

  // Add quoted message ID
  if (message.hasQuotedMsg) {
    try {
      const quotedMsg = await message.getQuotedMessage();
      serialized.quotedMsgId = quotedMsg.id._serialized;
    } catch {
      // Quoted message might not be available
    }
  }

  // Add location data
  if (type === 'location' && message.location) {
    serialized.location = {
      latitude: parseFloat(String(message.location.latitude)),
      longitude: parseFloat(String(message.location.longitude)),
      description: message.location.description,
    };
  }

  // Add vCards
  if (type === 'contact') {
    serialized.vCards = message.vCards;
  }

  // Add mentions
  if (message.mentionedIds && message.mentionedIds.length > 0) {
    serialized.mentionedIds = message.mentionedIds.map((id) => 
      typeof id === 'string' ? id : (id as { _serialized: string })._serialized
    );
  }

  return serialized;
}

/**
 * Handle incoming WhatsApp message
 */
export async function handleIncomingMessage(
  sessionId: string,
  message: WAMessage,
  sessions: Map<string, WASession>,
  events: TypedEventEmitter
): Promise<void> {
  try {
    const session = sessions.get(sessionId);
    if (!session || session.status !== 'CONNECTED') return;

    // Ignore status updates if needed
    if (message.isStatus) {
      logger.debug({ sessionId, messageId: message.id._serialized }, 'Status update received');
      return;
    }

    const serializedMessage = await serializeMessage(message);

    // Save to database
    try {
      const chat = await ensureChat(message);
      if (chat) {
        const dbChatId = await syncChat(sessionId, chat);
        await saveMessage(
          sessionId,
          serializedMessage,
          MessageDirection.INCOMING,
          serializedMessage.id,
          dbChatId
        );
      }
    } catch (dbError) {
      logger.error({ sessionId, error: dbError }, 'Error saving incoming message to database');
    }

    logger.debug(
      {
        sessionId,
        messageId: serializedMessage.id,
        from: serializedMessage.from,
        type: serializedMessage.type,
      },
      'Message received'
    );

    events.emit('message', { sessionId, userId: session?.userId, message: serializedMessage });
    webhookService.emit(sessionId, 'message.received', serializedMessage);
  } catch (error) {
    logger.error({ sessionId, error }, 'Error handling incoming message');
  }
}

/**
 * Handle outgoing WhatsApp message
 */
export async function handleOutgoingMessage(
  sessionId: string,
  message: WAMessage,
  sessions: Map<string, WASession>,
  events: TypedEventEmitter
): Promise<void> {
  try {
    const session = sessions.get(sessionId);
    if (!session || session.status !== 'CONNECTED') return;

    const serializedMessage = await serializeMessage(message);

    // Save to database
    try {
      const chat = await ensureChat(message);
      if (chat) {
        const dbChatId = await syncChat(sessionId, chat);
        await saveMessage(
          sessionId,
          serializedMessage,
          MessageDirection.OUTGOING,
          serializedMessage.id,
          dbChatId
        );
      }
    } catch (dbError) {
      logger.error({ sessionId, error: dbError }, 'Error saving outgoing message to database');
    }

    logger.debug(
      {
        sessionId,
        messageId: serializedMessage.id,
        to: serializedMessage.to,
        type: serializedMessage.type,
      },
      'Message sent (from device)'
    );

    events.emit('message_sent', { sessionId, userId: session?.userId, message: serializedMessage });
    webhookService.emit(sessionId, 'message.sent', serializedMessage);
  } catch (error) {
    logger.error({ sessionId, error }, 'Error handling outgoing message');
  }
}

/**
 * Handle message acknowledgment
 */
export async function handleMessageAck(
  sessionId: string,
  message: WAMessage,
  ack: number,
  events: TypedEventEmitter
): Promise<void> {
  try {
    const ackData = {
      messageId: message.id._serialized,
      ack,
      ackName: getAckName(ack),
    };

    // Update message status in database
    try {
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
            waMessageId: message.id._serialized,
          },
          data: {
            status,
            ackAt: new Date(),
          },
        });
      }
    } catch (dbError) {
      // Don't log as error if message not found (might be sent before DB persistence was active)
      logger.debug({ sessionId, error: dbError }, 'Error updating message status in database');
    }

    logger.debug({ sessionId, ...ackData }, 'Message ACK');

    events.emit('message_ack', { sessionId, messageId: ackData.messageId, ack: ackData });
    webhookService.emit(sessionId, 'message.ack', ackData);
  } catch (error) {
    logger.error({ sessionId, error }, 'Error handling message ACK');
  }
}
