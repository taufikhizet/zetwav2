/**
 * WhatsApp Status/Stories Functions
 */

import { MessageMedia } from 'whatsapp-web.js';
import axios from 'axios';
import type { WASession } from './types.js';
import { SessionNotConnectedError, BadRequestError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

/**
 * Get my statuses
 */
export async function getMyStatuses(session: WASession): Promise<Array<{
  id: string;
  timestamp: number;
  caption?: string;
}>> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  // whatsapp-web.js has limited status support
  return [];
}

/**
 * Get all contacts' statuses
 */
export async function getContactStatuses(session: WASession): Promise<Array<{
  contactId: string;
  statuses: Array<{ id: string; timestamp: number }>;
}>> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  // whatsapp-web.js has limited status support
  return [];
}

/**
 * Get specific contact's statuses
 */
export async function getContactStatus(
  session: WASession,
  contactId: string
): Promise<Array<{ id: string; timestamp: number }>> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  // whatsapp-web.js has limited status support
  return [];
}

/**
 * Post text status
 */
export async function postTextStatus(
  session: WASession,
  text: string,
  backgroundColor?: string,
  font?: number
): Promise<{ statusId: string }> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  // whatsapp-web.js doesn't fully support status posting
  throw new BadRequestError('Posting text status is not fully supported. Use media status instead.');
}

/**
 * Post media status
 */
export async function postMediaStatus(
  session: WASession,
  mediaUrl?: string,
  mediaBase64?: string,
  mimetype?: string,
  caption?: string
): Promise<{ statusId: string }> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  let media: MessageMedia;

  if (mediaUrl) {
    const response = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
    const base64 = Buffer.from(response.data).toString('base64');
    const contentType = response.headers['content-type'] || mimetype || 'image/jpeg';
    media = new MessageMedia(contentType, base64);
  } else if (mediaBase64 && mimetype) {
    media = new MessageMedia(mimetype, mediaBase64);
  } else {
    throw new BadRequestError('Either mediaUrl or mediaBase64 with mimetype is required');
  }

  // Send to status@broadcast
  const result = await session.client.sendMessage('status@broadcast', media, {
    caption,
  });

  logger.info({ sessionId: session.sessionId }, 'Media status posted');

  return { statusId: result.id._serialized };
}

/**
 * Delete status
 */
export async function deleteStatus(session: WASession, statusId: string): Promise<void> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  // whatsapp-web.js doesn't support deleting status
  throw new BadRequestError('Deleting status is not supported');
}

/**
 * Mark status as seen
 */
export async function markStatusSeen(session: WASession, statusId: string): Promise<void> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  // whatsapp-web.js doesn't support marking status as seen
  throw new BadRequestError('Marking status as seen is not supported');
}
