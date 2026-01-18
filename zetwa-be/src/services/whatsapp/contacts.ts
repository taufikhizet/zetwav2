/**
 * WhatsApp Contact Management Functions
 */

import type { WASession } from './types.js';
import { SessionNotConnectedError, BadRequestError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import { formatChatId } from './messaging/index.js';

/**
 * Block a contact
 */
export async function blockContact(session: WASession, contactId: string): Promise<boolean> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const formattedContactId = formatChatId(contactId);
  const contact = await session.client.getContactById(formattedContactId);
  
  await contact.block();
  
  logger.info({ sessionId: session.sessionId, contactId: formattedContactId }, 'Contact blocked');
  return true;
}

/**
 * Unblock a contact
 */
export async function unblockContact(session: WASession, contactId: string): Promise<boolean> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const formattedContactId = formatChatId(contactId);
  const contact = await session.client.getContactById(formattedContactId);
  
  await contact.unblock();
  
  logger.info({ sessionId: session.sessionId, contactId: formattedContactId }, 'Contact unblocked');
  return true;
}

/**
 * Get contact about
 */
export async function getContactAbout(session: WASession, contactId: string): Promise<string | null> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const formattedContactId = formatChatId(contactId);
  const contact = await session.client.getContactById(formattedContactId);
  
  try {
    const about = await contact.getAbout();
    return about || null;
  } catch (error) {
    logger.warn({ sessionId: session.sessionId, contactId: formattedContactId, error }, 'Failed to get contact about');
    return null;
  }
}
