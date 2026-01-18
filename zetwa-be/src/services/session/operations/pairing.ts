import { whatsappService } from '../../whatsapp/index.js';
import { BadRequestError } from '../../../utils/errors.js';
import { logger } from '../../../utils/logger.js';
import { getById } from './read.js';
import { PAIRING_VALID_STATUSES } from '../constants.js';

/**
 * Request pairing code for phone number authentication (alternative to QR)
 * This allows users to link WhatsApp by entering a code on their phone
 * instead of scanning a QR code.
 */
export async function requestPairingCode(
  userId: string,
  sessionId: string,
  phoneNumber: string,
  _method?: 'sms' | 'voice'
) {
  const session = await getById(userId, sessionId);
  const liveStatus = whatsappService.getStatus(sessionId);
  const currentStatus = liveStatus || session.status;

  // Can only request pairing code when waiting for QR scan
  if (!PAIRING_VALID_STATUSES.includes(currentStatus)) {
    throw new BadRequestError(
      `Can request pairing code only when session is ready for authentication. ` +
      `Current status: ${currentStatus}`
    );
  }

  try {
    const code = await whatsappService.requestPairingCode(sessionId, phoneNumber);
    
    // Format code as XXXX-XXXX for readability
    const formattedCode = code.length === 8 
      ? `${code.slice(0, 4)}-${code.slice(4)}`
      : code;

    logger.info({ sessionId, userId, phoneNumber: phoneNumber.slice(-4) }, 'Pairing code requested');

    return {
      code: formattedCode,
      phoneNumber,
      message: 'Enter this code on your WhatsApp mobile app to link this device.',
    };
  } catch (error) {
    logger.error({ sessionId, error }, 'Failed to request pairing code');
    throw new BadRequestError(
      'Failed to request pairing code. Make sure the session is initialized and phone number is valid.'
    );
  }
}
