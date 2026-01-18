import type { Client, Message as WAMessage } from 'whatsapp-web.js';
import type { WASession, TypedEventEmitter } from '../types.js';
import { logger } from '../../../utils/logger.js';
import {
  handleIncomingMessage,
  handleOutgoingMessage,
  handleMessageAck,
} from '../message-handlers.js';
import { webhookService } from '../../webhook.service.js';
import * as statusService from '../status.js';

export function setupMessageHandlers(
  client: Client,
  sessionId: string,
  sessions: Map<string, WASession>,
  events: TypedEventEmitter
): void {
  // Incoming message event
  client.on('message', async (message: WAMessage) => {
    await handleIncomingMessage(sessionId, message, sessions, events);
  });

  // Outgoing message (message_create) event
  client.on('message_create', async (message: WAMessage) => {
    // Handle Status Updates (both incoming and outgoing)
    // We capture this here to update our in-memory cache
    if (message.id.remote === 'status@broadcast') {
        await statusService.handleStatusUpdate(sessionId, message);
    }

    if (message.fromMe) {
      await handleOutgoingMessage(sessionId, message, sessions, events);
    }
  });

  // Message ACK event
  client.on('message_ack', async (message: WAMessage, ack: number) => {
    await handleMessageAck(sessionId, message, ack, events);
  });

  // Message Reaction
  client.on('message_reaction', async (reaction) => {
    logger.debug({ sessionId, messageId: reaction.msgId.id, reaction: reaction.reaction }, 'Message reaction received');
    const payload = {
      sessionId,
      messageId: reaction.msgId._serialized,
      reaction: reaction.reaction,
      senderId: reaction.senderId,
    };
    events.emit('message_reaction', payload);
    webhookService.emit(sessionId, 'message.reaction', payload);
  });
}
