/**
 * WhatsApp Labels Functions (Business API)
 */

import type { WASession, LabelUpdate } from './types.js';
import { SessionNotConnectedError, BadRequestError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

/**
 * Get all labels
 */
export async function getLabels(session: WASession): Promise<Array<{
  id: string;
  name: string;
  color: number;
}>> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const labels = await session.client.getLabels();
  
  return labels.map((label) => ({
    id: label.id,
    name: label.name,
    color: label.hexColor ? parseInt(label.hexColor.replace('#', ''), 16) : 0,
  }));
}

/**
 * Create a new label
 */
export async function createLabel(
  session: WASession,
  name: string,
  color?: number
): Promise<{ id: string; name: string }> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  // whatsapp-web.js doesn't have createLabel - this would need custom implementation
  throw new BadRequestError('Creating labels is not supported in the current WhatsApp Web version');
}

/**
 * Get label by ID
 */
export async function getLabelById(
  session: WASession,
  labelId: string
): Promise<{ id: string; name: string; color: number }> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const label = await session.client.getLabelById(labelId);
  
  if (!label) {
    throw new BadRequestError('Label not found');
  }

  return {
    id: label.id,
    name: label.name,
    color: label.hexColor ? parseInt(label.hexColor.replace('#', ''), 16) : 0,
  };
}

/**
 * Update a label
 */
export async function updateLabel(
  session: WASession,
  labelId: string,
  updates: LabelUpdate
): Promise<{ id: string; name: string }> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  // whatsapp-web.js doesn't have updateLabel - this would need custom implementation
  throw new BadRequestError('Updating labels is not supported in the current WhatsApp Web version');
}

/**
 * Delete a label
 */
export async function deleteLabel(session: WASession, labelId: string): Promise<void> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  // whatsapp-web.js doesn't have deleteLabel - this would need custom implementation
  throw new BadRequestError('Deleting labels is not supported in the current WhatsApp Web version');
}

/**
 * Get chats by label
 */
export async function getChatsByLabel(
  session: WASession,
  labelId: string
): Promise<Array<{ id: string; name: string }>> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const chats = await session.client.getChatsByLabelId(labelId);
  
  return chats.map((chat) => ({
    id: chat.id._serialized,
    name: chat.name,
  }));
}

/**
 * Assign label to chat
 */
export async function assignLabelToChat(
  session: WASession,
  labelId: string,
  chatId: string
): Promise<void> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const chat = await session.client.getChatById(chatId);
  
  // Get current labels and add new one
  const currentLabels: string[] = (chat as unknown as { labels?: string[] }).labels || [];
  if (!currentLabels.includes(labelId)) {
    await chat.changeLabels([...currentLabels, labelId]);
  }
  
  logger.debug({ sessionId: session.sessionId, labelId, chatId }, 'Label assigned to chat');
}

/**
 * Unassign label from chat
 */
export async function unassignLabelFromChat(
  session: WASession,
  labelId: string,
  chatId: string
): Promise<void> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const chat = await session.client.getChatById(chatId);
  
  // Get current labels and remove the specified one
  const currentLabels: string[] = (chat as unknown as { labels?: string[] }).labels || [];
  const newLabels = currentLabels.filter((l: string) => l !== labelId);
  await chat.changeLabels(newLabels);
  
  logger.debug({ sessionId: session.sessionId, labelId, chatId }, 'Label removed from chat');
}
