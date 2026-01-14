/**
 * Session CRUD - Read Operations
 * Handles session retrieval and listing
 */

import { prisma } from '../../../lib/prisma.js';
import { whatsappService } from '../../whatsapp/index.js';
import { NotFoundError, ForbiddenError } from '../../../utils/errors.js';
import { logger } from '../../../utils/logger.js';
import { transformToInlineConfig } from '../transformers.js';
import { FAILED_STATUSES, STALE_STATUSES } from '../constants.js';

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
 * Get session by ID with full details
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
          // Include new schema columns
          secret: true,
          customHeaders: true,
          retryAttempts: true,
          retryDelay: true,
          retryPolicy: true,
          timeout: true,
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
    if (STALE_STATUSES.includes(dbStatus)) {
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

  const isFailedOrDisconnected = FAILED_STATUSES.includes(liveStatus);

  // Build inline webhooks config for frontend
  const inlineWebhooks = session.webhooks.map(transformToInlineConfig);
  
  // Build config object from dedicated columns for frontend compatibility (WAHA-style)
  const config: Record<string, unknown> = {};
  
  // Debug mode
  if (session.debug) {
    config.debug = true;
  }
  
  // Client configuration
  if (session.deviceName || session.browserName) {
    config.client = {
      ...(session.deviceName && { deviceName: session.deviceName }),
      ...(session.browserName && { browserName: session.browserName }),
    };
  }
  
  // Proxy configuration
  if (session.proxyServer) {
    config.proxy = {
      server: session.proxyServer,
      ...(session.proxyUsername && { username: session.proxyUsername }),
      ...(session.proxyPassword && { password: session.proxyPassword }),
    };
  }
  
  // Ignore configuration
  if (session.ignoreStatus || session.ignoreGroups || session.ignoreChannels || session.ignoreBroadcast) {
    config.ignore = {
      ...(session.ignoreStatus && { status: true }),
      ...(session.ignoreGroups && { groups: true }),
      ...(session.ignoreChannels && { channels: true }),
      ...(session.ignoreBroadcast && { broadcast: true }),
    };
  }
  
  // NOWEB engine configuration (only if non-default values)
  if (!session.nowebStoreEnabled || session.nowebFullSync || !session.nowebMarkOnline) {
    config.noweb = {
      store: {
        enabled: session.nowebStoreEnabled,
        ...(session.nowebFullSync && { fullSync: true }),
      },
      ...(session.nowebMarkOnline === false && { markOnline: false }),
    };
  }
  
  // User custom metadata (from metadata column - now only stores user data, not config)
  const userMetadata = session.metadata as Record<string, string> | null;
  if (userMetadata && Object.keys(userMetadata).length > 0) {
    config.metadata = userMetadata;
  }
  
  // Add webhooks to config
  if (inlineWebhooks.length > 0) {
    config.webhooks = inlineWebhooks;
  }

  return {
    ...session,
    // Extract config to top level for frontend compatibility (WAHA-style)
    config: Object.keys(config).length > 0 ? config : undefined,
    liveStatus,
    isOnline: whatsappService.isConnected(sessionId),
    qrCode: isFailedOrDisconnected ? null : whatsappService.getQRCode(sessionId),
    lastQrAt: session.lastQrAt,
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
 * Get session "me" info (authenticated user information)
 */
export async function getMeInfo(userId: string, sessionId: string) {
  const session = await getById(userId, sessionId);
  
  if (!whatsappService.isConnected(sessionId)) {
    throw new Error('Session is not connected');
  }

  const meInfo = whatsappService.getMeInfo(sessionId);
  
  return {
    id: meInfo?.id || session.phoneNumber ? `${session.phoneNumber}@c.us` : null,
    phoneNumber: session.phoneNumber,
    pushName: session.pushName,
    profilePicUrl: session.profilePicUrl,
  };
}
