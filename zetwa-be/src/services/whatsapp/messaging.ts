/**
 * WhatsApp Core Messaging Functions
 * Send text, media, and basic message operations
 */

import type { Message, MessageMedia, Location, Poll, Contact } from 'whatsapp-web.js';
import type { WASession, SendMessageOptions, SendMediaOptions } from './types.js';
import { SessionNotConnectedError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import { Poll as PollClass, Location as LocationClass } from 'whatsapp-web.js';

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

/**
 * Send Poll
 */
export async function sendPoll(
  session: WASession,
  to: string,
  name: string,
  options: string[],
  settings?: { selectableCount?: number; quotedMessageId?: string }
): Promise<Message> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const chatId = formatChatId(to);
  const poll = new PollClass(name, options, {
    allowMultipleAnswers: (settings?.selectableCount || 1) > 1,
    messageSecret: undefined // Optional secret
  });

  const sendOptions: { quotedMessageId?: string } = {};
  if (settings?.quotedMessageId) {
    sendOptions.quotedMessageId = settings.quotedMessageId;
  }

  const sentMessage = await session.client.sendMessage(chatId, poll, sendOptions);
  logger.info({ sessionId: session.sessionId, to: chatId }, 'Poll sent');
  return sentMessage;
}

/**
 * Send Location
 */
export async function sendLocation(
  session: WASession,
  to: string,
  latitude: number,
  longitude: number,
  description?: string,
  options?: { quotedMessageId?: string }
): Promise<Message> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const chatId = formatChatId(to);
  const location = new LocationClass(latitude, longitude, { name: description });

  const sendOptions: { quotedMessageId?: string } = {};
  if (options?.quotedMessageId) {
    sendOptions.quotedMessageId = options.quotedMessageId;
  }

  const sentMessage = await session.client.sendMessage(chatId, location, sendOptions);
  logger.info({ sessionId: session.sessionId, to: chatId }, 'Location sent');
  return sentMessage;
}

/**
 * Send Contact
 */
export async function sendContact(
  session: WASession,
  to: string,
  contactId: string,
  options?: { quotedMessageId?: string }
): Promise<Message> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const chatId = formatChatId(to);
  const contactJid = formatChatId(contactId);
  const contact = await session.client.getContactById(contactJid);

  const sendOptions: { quotedMessageId?: string } = {};
  if (options?.quotedMessageId) {
    sendOptions.quotedMessageId = options.quotedMessageId;
  }

  const sentMessage = await session.client.sendMessage(chatId, contact, sendOptions);
  logger.info({ sessionId: session.sessionId, to: chatId, contactId: contactJid }, 'Contact sent');
  return sentMessage;
}

/**
 * Send Reaction
 */
export async function sendReaction(
  session: WASession,
  messageId: string,
  reaction: string
): Promise<void> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  try {
    // Extract chatId from messageId (false_12345@c.us_ID)
    const parts = messageId.split('_');
    if (parts.length < 2 || !parts[1]) throw new Error("Invalid message ID format");
    
    const chatId = parts[1];
    
    // 1. Try to find the message via chat
    const chat = await session.client.getChatById(chatId);
    
    // Fetch recent messages to find the target message
    // This is a "best effort" approach since we don't have a DB store
    const messages = await chat.fetchMessages({ limit: 50 });
    const message = messages.find(m => m.id._serialized === messageId);
    
    if (message) {
      await message.react(reaction);
      logger.info({ sessionId: session.sessionId, messageId, reaction }, 'Reaction sent');
      return;
    }
    
    // If message not found in recent history, we can't react easily without store
    logger.warn({ sessionId: session.sessionId, messageId }, 'Message not found for reaction (checked recent 50)');
    throw new Error("Message not found in recent history - cannot react");
    
  } catch (e: any) {
    logger.error({ sessionId: session.sessionId, messageId, error: e.message }, 'Failed to send reaction');
    throw e;
  }
}
