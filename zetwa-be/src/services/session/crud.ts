/**
 * Session CRUD Operations
 */

import { prisma } from '../../lib/prisma.js';
import { whatsappService } from '../whatsapp/index.js';
import { NotFoundError, ForbiddenError, ConflictError, BadRequestError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import type { CreateSessionInput, UpdateSessionInput, SessionConfig } from './types.js';

/**
 * Create a new WhatsApp session
 */
export async function create(userId: string, input: CreateSessionInput) {
  const { name, description, config, start = true } = input;

  // Check if session name already exists for this user
  const existing = await prisma.waSession.findUnique({
    where: {
      userId_name: {
        userId,
        name,
      },
    },
  });

  if (existing) {
    throw new ConflictError(`Session with name "${name}" already exists`);
  }

  // Prepare metadata to store config and other session data
  const metadata: Record<string, unknown> = {};
  if (config) {
    metadata.config = config;
  }

  // Create session in database
  const session = await prisma.waSession.create({
    data: {
      name,
      description,
      userId,
      status: start ? 'INITIALIZING' : 'FAILED', // Use FAILED as "STOPPED" equivalent
      metadata: Object.keys(metadata).length > 0 ? JSON.parse(JSON.stringify(metadata)) : undefined,
    },
  });

  // Start WhatsApp client if start option is true
  if (start) {
    try {
      await whatsappService.createSession(session.id, userId, config);
    } catch (error) {
      // If WhatsApp client fails, delete the database record
      await prisma.waSession.delete({ where: { id: session.id } });
      throw error;
    }
  }

  logger.info({ sessionId: session.id, userId, start }, 'Session created');

  return session;
}

/**
 * Get all sessions for a user
 */
export async function list(userId: string) {
  const sessions = await prisma.waSession.findMany({
    where: { userId, isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      phoneNumber: true,
      pushName: true,
      profilePicUrl: true,
      connectedAt: true,
      createdAt: true,
      _count: {
        select: {
          webhooks: true,
          messages: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Enhance with live status
  return sessions.map((session) => ({
    ...session,
    liveStatus: whatsappService.getStatus(session.id) || session.status,
    isOnline: whatsappService.isConnected(session.id),
  }));
}

/**
 * Get session by ID
 */
export async function getById(userId: string, sessionId: string) {
  const session = await prisma.waSession.findUnique({
    where: { id: sessionId },
    include: {
      webhooks: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          url: true,
          events: true,
          isActive: true,
        },
      },
      _count: {
        select: {
          messages: true,
          chats: true,
          contacts: true,
        },
      },
    },
  });

  if (!session) {
    throw new NotFoundError('Session not found');
  }

  if (session.userId !== userId) {
    throw new ForbiddenError('Access denied');
  }

  // Get live status from memory, but also consider database status
  const memoryStatus = whatsappService.getStatus(sessionId);
  const dbStatus = session.status;

  logger.debug({ sessionId, memoryStatus, dbStatus }, 'Session status check');

  let liveStatus: string;
  if (memoryStatus) {
    liveStatus = memoryStatus;
  } else {
    if (dbStatus === 'QR_READY' || dbStatus === 'INITIALIZING' || dbStatus === 'AUTHENTICATING') {
      logger.info({ sessionId, dbStatus }, 'Detected stale session, marking as FAILED');
      liveStatus = 'FAILED';

      prisma.waSession
        .update({
          where: { id: sessionId },
          data: { status: 'FAILED', qrCode: null },
        })
        .catch((err) => {
          logger.error({ sessionId, error: err }, 'Failed to update stale session status');
        });
    } else {
      liveStatus = dbStatus;
    }
  }

  logger.debug({ sessionId, liveStatus }, 'Final live status');

  const isFailedOrDisconnected = ['FAILED', 'DISCONNECTED', 'LOGGED_OUT'].includes(liveStatus);

  return {
    ...session,
    liveStatus,
    isOnline: whatsappService.isConnected(sessionId),
    qrCode: isFailedOrDisconnected ? null : whatsappService.getQRCode(sessionId),
    lastQrAt: session.lastQrAt,
  };
}

/**
 * Update session
 */
export async function update(userId: string, sessionId: string, input: UpdateSessionInput) {
  const session = await getById(userId, sessionId);

  if (input.name && input.name !== session.name) {
    const existing = await prisma.waSession.findUnique({
      where: {
        userId_name: {
          userId,
          name: input.name,
        },
      },
    });

    if (existing) {
      throw new ConflictError(`Session with name "${input.name}" already exists`);
    }
  }

  return prisma.waSession.update({
    where: { id: sessionId },
    data: input,
  });
}

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

/**
 * Get session status
 */
export async function getStatus(userId: string, sessionId: string) {
  const session = await getById(userId, sessionId);

  return {
    id: session.id,
    name: session.name,
    status: whatsappService.getStatus(sessionId) || session.status,
    isOnline: whatsappService.isConnected(sessionId),
    phoneNumber: session.phoneNumber,
    pushName: session.pushName,
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
  method?: 'sms' | 'voice'
) {
  const session = await getById(userId, sessionId);
  const liveStatus = whatsappService.getStatus(sessionId);
  const currentStatus = liveStatus || session.status;

  // Can only request pairing code when waiting for QR scan
  const validStatuses = ['QR_READY', 'SCAN_QR', 'SCAN_QR_CODE', 'INITIALIZING', 'STARTING'];
  if (!validStatuses.includes(currentStatus)) {
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
 * Get session "me" info (authenticated user information)
 */
export async function getMeInfo(userId: string, sessionId: string) {
  const session = await getById(userId, sessionId);
  
  if (!whatsappService.isConnected(sessionId)) {
    throw new BadRequestError('Session is not connected');
  }

  const meInfo = whatsappService.getMeInfo(sessionId);
  
  return {
    id: meInfo?.id || session.phoneNumber ? `${session.phoneNumber}@c.us` : null,
    phoneNumber: session.phoneNumber,
    pushName: session.pushName,
    profilePicUrl: session.profilePicUrl,
  };
}
