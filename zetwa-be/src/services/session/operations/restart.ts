import { whatsappService } from '../../whatsapp/index.js';
import { logger } from '../../../utils/logger.js';
import { getById } from './read.js';

/**
 * Restart session
 */
export async function restart(userId: string, sessionId: string) {
  await getById(userId, sessionId);

  await whatsappService.restartSession(sessionId);

  logger.info({ sessionId, userId }, 'Session restarted');

  return {
    status: 'INITIALIZING',
    message: 'Session is restarting',
  };
}
