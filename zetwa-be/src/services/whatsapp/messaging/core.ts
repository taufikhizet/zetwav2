/**
 * Core Messaging Functions
 * Send text and media messages
 */

import type { Message, MessageMedia } from 'whatsapp-web.js';
import type { WASession, SendMessageOptions, SendMediaOptions } from '../types.js';
import { SessionNotConnectedError } from '../../../utils/errors.js';
import { logger } from '../../../utils/logger.js';

/**
 * Format phone number to WhatsApp format
 */
export function formatChatId(to: string): string {
  return to.includes('@') ? to : `${to.replace(/\D/g, '')}@c.us`;
}

/**
 * Send text message
 */
export async function sendMessage(
  session: WASession,
  to: string,
  message: string,
  options?: SendMessageOptions
): Promise<Message> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const chatId = formatChatId(to);

  const sendOptions: { quotedMessageId?: string; mentions?: string[] } = {};

  if (options?.quotedMessageId) {
    sendOptions.quotedMessageId = options.quotedMessageId;
  }

  if (options?.mentions) {
    sendOptions.mentions = options.mentions;
  }

  const sentMessage = await session.client.sendMessage(chatId, message, sendOptions);

  logger.info({ sessionId: session.sessionId, to: chatId }, 'Message sent');

  return sentMessage;
}

/**
 * Send media message (Image, Video, Audio, Document)
 */
export async function sendMedia(
  session: WASession,
  to: string,
  media: MessageMedia,
  options?: SendMediaOptions & { sendAudioAsVoice?: boolean }
): Promise<Message> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const chatId = formatChatId(to);

  const sendOptions: { caption?: string; quotedMessageId?: string; sendAudioAsVoice?: boolean } = {};

  if (options?.caption) {
    sendOptions.caption = options.caption;
  }

  if (options?.quotedMessageId) {
    sendOptions.quotedMessageId = options.quotedMessageId;
  }
  
  if (options?.sendAudioAsVoice) {
    sendOptions.sendAudioAsVoice = true;
  }

  const sentMessage = await session.client.sendMessage(chatId, media, sendOptions);

  logger.info({ sessionId: session.sessionId, to: chatId, mediaType: media.mimetype }, 'Media sent');

  return sentMessage;
}
