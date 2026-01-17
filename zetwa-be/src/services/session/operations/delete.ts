/**
 * Session CRUD - Delete Operations
 * Handles session deletion and logout
 */

import { prisma } from '../../../lib/prisma.js';
import { whatsappService } from '../../whatsapp/index.js';
import { logger } from '../../../utils/logger.js';
import { getById } from './read.js';

/**
 * Delete session (HARD delete)
 */
export async function remove(userId: string, sessionId: string) {
  await getById(userId, sessionId);

  // Perform true logout and cleanup
  await whatsappService.destroySession(sessionId, true);

  // Hard delete from database
  await prisma.waSession.delete({
    where: { id: sessionId },
  });

  logger.info({ sessionId, userId }, 'Session permanently deleted');
}

/**
 * Logout session
 */
export async function logout(userId: string, sessionId: string) {
  await getById(userId, sessionId);

  // Perform true logout
  await whatsappService.destroySession(sessionId, true);

  return {
    status: 'LOGGED_OUT',
    message: 'Session logged out successfully',
  };
}
