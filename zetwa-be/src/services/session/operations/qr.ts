/**
 * Session QR Code and Pairing Operations
 * Handles QR code generation and pairing code requests
 */

import { whatsappService } from '../../whatsapp/index.js';
import { BadRequestError } from '../../../utils/errors.js';
import { logger } from '../../../utils/logger.js';
import { getById } from './read.js';
import { PAIRING_VALID_STATUSES } from '../constants.js';

/**
 * Get QR code for session
 */
export async function getQRCode(userId: string, sessionId: string) {
  const session = await getById(userId, sessionId);

  const qrCode = whatsappService.getQRCode(sessionId);
  const liveStatus = whatsappService.getStatus(sessionId);
  const currentStatus = liveStatus || session.status;

  if (currentStatus === 'FAILED') {
    return {
      status: 'FAILED',
      qrCode: null,
      message: 'Session expired. QR code was not scanned in time. Please restart the session to get a new QR code.',
      canRetry: true,
    };
  }

  if (currentStatus === 'LOGGED_OUT') {
    return {
      status: 'LOGGED_OUT',
      qrCode: null,
      message: 'Session has been logged out. Please restart to reconnect.',
      canRetry: true,
    };
  }

  if (currentStatus === 'DISCONNECTED') {
    return {
      status: 'DISCONNECTED',
      qrCode: null,
      message: 'Session disconnected. Please restart the session.',
      canRetry: true,
    };
  }

  if (!qrCode) {
    const status = whatsappService.getStatus(sessionId);

    if (status === 'CONNECTED') {
      throw new BadRequestError('Session is already connected');
    }

    return {
      status: status || session.status,
      qrCode: null,
      message: 'QR code not available. Session may be initializing.',
    };
  }

  return {
    status: 'QR_READY',
    qrCode,
  };
}

/**
 * Get QR code with format option (image or raw)
 */
export async function getQRCodeWithFormat(
  userId: string, 
  sessionId: string, 
  format: 'image' | 'raw' = 'image'
) {
  const session = await getById(userId, sessionId);
  const qrCode = whatsappService.getQRCode(sessionId);
  const liveStatus = whatsappService.getStatus(sessionId);
  const currentStatus = liveStatus || session.status;

  if (currentStatus === 'FAILED') {
    return {
      status: 'FAILED',
      value: null,
      message: 'Session expired. QR code was not scanned in time. Please restart the session to get a new QR code.',
      canRetry: true,
    };
  }

  if (currentStatus === 'LOGGED_OUT') {
    return {
      status: 'LOGGED_OUT',
      value: null,
      message: 'Session has been logged out. Please restart to reconnect.',
      canRetry: true,
    };
  }

  if (currentStatus === 'DISCONNECTED') {
    return {
      status: 'DISCONNECTED',
      value: null,
      message: 'Session disconnected. Please restart the session.',
      canRetry: true,
    };
  }

  if (currentStatus === 'CONNECTED') {
    return {
      status: 'WORKING',
      value: null,
      message: 'Session is already connected.',
      canRetry: false,
    };
  }

  if (!qrCode) {
    return {
      status: currentStatus,
      value: null,
      message: 'QR code not available. Session may be initializing.',
    };
  }

  // Return raw QR string or as base64 data URL based on format
  if (format === 'raw') {
    return {
      status: 'SCAN_QR_CODE',
      value: qrCode,
    };
  }

  // For image format, convert to data URL if not already
  const value = qrCode.startsWith('data:') 
    ? qrCode 
    : `data:image/png;base64,${qrCode}`;

  return {
    status: 'SCAN_QR_CODE',
    value,
  };
}

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
