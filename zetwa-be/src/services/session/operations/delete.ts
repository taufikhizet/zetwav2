/**
 * Session CRUD - Delete Operations
 * Handles session deletion and logout
 */

import { prisma } from '../../../lib/prisma.js';
import { whatsappService } from '../../whatsapp/index.js';
import { logger } from '../../../utils/logger.js';
import { getById } from './read.js';

/**
 * Delete session (soft delete)
 */
export async function remove(userId: string, sessionId: string) {
  await getById(userId, sessionId);

  await whatsappService.destroySession(sessionId);

  await prisma.waSession.update({
    where: { id: sessionId },
    data: { isActive: false },
  });

  logger.info({ sessionId, userId }, 'Session deleted');
}

/**
 * Logout session
 */
export async function logout(userId: string, sessionId: string) {
  await getById(userId, sessionId);

  await whatsappService.destroySession(sessionId);

  return {
    status: 'LOGGED_OUT',
    message: 'Session logged out successfully',
  };
}
