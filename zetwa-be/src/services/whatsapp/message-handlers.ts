/**
 * WhatsApp Message Handlers
 * Handles incoming, outgoing, and ACK message events
 */

import type { Message as WAMessage, Chat } from 'whatsapp-web.js';
import type { WASession, SerializedMessage, MessageType, TypedEventEmitter } from './types.js';
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

    logger.debug({ sessionId, ...ackData }, 'Message ACK');

    events.emit('message_ack', { sessionId, messageId: ackData.messageId, ack: ackData });
    webhookService.emit(sessionId, 'message.ack', ackData);
  } catch (error) {
    logger.error({ sessionId, error }, 'Error handling message ACK');
  }
}
