/**
 * WhatsApp Extended Message Functions
 * Reactions, locations, contacts, polls, buttons, lists, etc.
 */

import { Message, Location, Poll, MessageMedia } from 'whatsapp-web.js';
import type { WASession, ContactInfo, MessageButton, ListSection } from './types.js';
import { SessionNotConnectedError, BadRequestError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import { formatChatId } from './messaging.js';

/**
 * Send reaction to message
 */
export async function sendReaction(
  session: WASession,
  messageId: string,
  reaction: string
): Promise<{ success: boolean }> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const message = await session.client.getMessageById(messageId);
  
  if (!message) {
    throw new BadRequestError('Message not found');
  }

  await message.react(reaction);
  
  logger.debug({ sessionId: session.sessionId, messageId, reaction }, 'Reaction sent');

  return { success: true };
}

/**
 * Remove reaction from message
 */
export async function removeReaction(session: WASession, messageId: string): Promise<void> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const message = await session.client.getMessageById(messageId);
  
  if (!message) {
    throw new BadRequestError('Message not found');
  }

  await message.react(''); // Empty string removes reaction
  
  logger.debug({ sessionId: session.sessionId, messageId }, 'Reaction removed');
}

/**
 * Send location message
 */
export async function sendLocation(
  session: WASession,
  to: string,
  latitude: number,
  longitude: number,
  description?: string,
  url?: string
): Promise<Message> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const chatId = formatChatId(to);
  
  const location = new Location(latitude, longitude, {
    name: description,
    url,
  });

  const result = await session.client.sendMessage(chatId, location);
  
  logger.info({ sessionId: session.sessionId, to: chatId }, 'Location sent');

  return result;
}

/**
 * Send contact vCard
 */
export async function sendContact(
  session: WASession,
  to: string,
  contact: ContactInfo,
  options?: { quotedMessageId?: string }
): Promise<Message> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const chatId = formatChatId(to);
  
  // Clean phone number for waid (digits only)
  const cleanPhone = contact.phone.replace(/\D/g, '');

  // Create vCard
  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${contact.name}`,
    `TEL;type=CELL;type=VOICE;waid=${cleanPhone}:+${cleanPhone}`,
    contact.organization ? `ORG:${contact.organization}` : '',
    contact.email ? `EMAIL:${contact.email}` : '',
    'END:VCARD',
  ].filter(Boolean).join('\n');

  const sendOptions: { quotedMessageId?: string } = {};
  if (options?.quotedMessageId) {
    sendOptions.quotedMessageId = options.quotedMessageId;
  }

  const result = await session.client.sendMessage(chatId, vcard, sendOptions);
  
  logger.info({ sessionId: session.sessionId, to: chatId }, 'Contact sent');

  return result;
}

/**
 * Send poll message
 */
export async function sendPoll(
  session: WASession,
  to: string,
  name: string,
  options: string[],
  allowMultipleAnswers: boolean
): Promise<Message> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const chatId = formatChatId(to);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const poll = new Poll(name, options, { allowMultipleAnswers } as any);

  const result = await session.client.sendMessage(chatId, poll);
  
  logger.info({ sessionId: session.sessionId, to: chatId }, 'Poll sent');

  return result;
}

/**
 * Send buttons message (fallback to text)
 */
export async function sendButtons(
  session: WASession,
  to: string,
  body: string,
  buttons: MessageButton[],
  title?: string,
  footer?: string
): Promise<Message> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const chatId = formatChatId(to);
  
  // Note: Buttons may not work due to WhatsApp restrictions
  // Send as text message with buttons info as fallback
  const buttonText = buttons.map((b, i) => `${i + 1}. ${b.text}`).join('\n');
  const fullMessage = `${title ? `*${title}*\n\n` : ''}${body}\n\n${buttonText}${footer ? `\n\n_${footer}_` : ''}`;

  const result = await session.client.sendMessage(chatId, fullMessage);
  
  logger.info({ sessionId: session.sessionId, to: chatId }, 'Buttons message sent (as text fallback)');

  return result;
}

/**
 * Send list message (fallback to text)
 */
export async function sendList(
  session: WASession,
  to: string,
  body: string,
  buttonText: string,
  sections: ListSection[],
  title?: string,
  footer?: string
): Promise<Message> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const chatId = formatChatId(to);
  
  // Note: List messages may not work due to WhatsApp restrictions
  // Send as text message with list info as fallback
  let listText = title ? `*${title}*\n\n` : '';
  listText += `${body}\n\n`;
  
  for (const section of sections) {
    listText += `*${section.title}*\n`;
    for (const row of section.rows) {
      listText += `• ${row.title}${row.description ? ` - ${row.description}` : ''}\n`;
    }
    listText += '\n';
  }
  
  if (footer) {
    listText += `_${footer}_`;
  }

  const result = await session.client.sendMessage(chatId, listText);
  
  logger.info({ sessionId: session.sessionId, to: chatId }, 'List message sent (as text fallback)');

  return result;
}

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

  await message.star();
  
  logger.info({ sessionId: session.sessionId, messageId, star }, 'Message starred');
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

  // getStarredMessages may not exist in all whatsapp-web.js versions
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
