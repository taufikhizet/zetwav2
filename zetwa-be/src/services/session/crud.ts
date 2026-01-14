/**
 * Session CRUD Operations
 */

import { WebhookEvent } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { whatsappService } from '../whatsapp/index.js';
import { NotFoundError, ForbiddenError, ConflictError, BadRequestError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import type { CreateSessionInput, UpdateSessionInput, SessionConfig, WebhookEvent as WebhookEventType } from './types.js';

/**
 * All WAHA-style events (preferred modern format)
 * When user selects "*" (all events), we expand to these individual events
 */
const ALL_WAHA_EVENTS: WebhookEvent[] = [
  WebhookEvent.message,
  WebhookEvent.message_any,
  WebhookEvent.message_ack,
  WebhookEvent.message_reaction,
  WebhookEvent.message_revoked,
  WebhookEvent.message_edited,
  WebhookEvent.message_waiting,
  WebhookEvent.session_status,
  WebhookEvent.group_join,
  WebhookEvent.group_leave,
  WebhookEvent.group_update,
  WebhookEvent.presence_update,
  WebhookEvent.poll_vote,
  WebhookEvent.poll_vote_failed,
  WebhookEvent.call_received,
  WebhookEvent.call_accepted,
  WebhookEvent.call_rejected,
  WebhookEvent.label_upsert,
  WebhookEvent.label_deleted,
  WebhookEvent.label_chat_added,
  WebhookEvent.label_chat_deleted,
  WebhookEvent.contact_update,
  WebhookEvent.chat_archive,
];

/**
 * Create webhooks from inline webhook config
 * Internal use - called during session creation
 */
async function createWebhooksFromConfig(sessionId: string, webhooks: SessionConfig['webhooks']) {
  if (!webhooks || webhooks.length === 0) return [];
  
  const createdWebhooks = [];
  
  for (const webhookConfig of webhooks) {
    if (!webhookConfig.url) continue;
    
    try {
      // Map string events to WebhookEvent enum
      // If '*' or 'ALL' is present, expand to all individual WAHA events
      let events: WebhookEvent[];
      
      if (!webhookConfig.events?.length) {
        // Default to all events
        events = ALL_WAHA_EVENTS;
      } else if (webhookConfig.events.some(e => e === '*' || e === 'ALL')) {
        // Wildcard - expand to all WAHA events
        events = ALL_WAHA_EVENTS;
      } else {
        // Map individual events
        events = webhookConfig.events
          .map(e => {
            // Handle WAHA-style events (with dots) by converting to underscore format
            const normalizedEvent = e.replace(/\./g, '_');
            // Check if it's a valid enum value
            if (normalizedEvent in WebhookEvent) {
              return normalizedEvent as WebhookEvent;
            }
            return null;
          })
          .filter((e): e is WebhookEvent => e !== null);
        
        // If no valid events, use all events
        if (events.length === 0) {
          events = ALL_WAHA_EVENTS;
        }
      }
      
      // Remove duplicates
      const uniqueEvents = [...new Set(events)];
      
      // Generate webhook name: use provided name, fallback to URL hostname
      let webhookName = 'Webhook';
      if (webhookConfig.name && webhookConfig.name.trim()) {
        webhookName = webhookConfig.name.trim();
      } else {
        try {
          webhookName = new URL(webhookConfig.url).hostname || 'Webhook';
        } catch {
          webhookName = 'Webhook';
        }
      }
      
      // Convert timeout from seconds to milliseconds, default 30000ms
      const timeoutMs = webhookConfig.timeout 
        ? webhookConfig.timeout * 1000 
        : 30000;
      
      // Build custom headers JSON
      const customHeaders = webhookConfig.customHeaders?.reduce(
        (acc, h) => ({ ...acc, [h.name]: h.value }), 
        {} as Record<string, string>
      ) || null;
      
      // Convert inline webhook config to database format
      const webhook = await prisma.webhook.create({
        data: {
          name: webhookName,
          url: webhookConfig.url,
          sessionId,
          events: uniqueEvents,
          // Store custom headers as separate column (new schema)
          customHeaders: customHeaders && Object.keys(customHeaders).length > 0 ? customHeaders : undefined,
          // Store HMAC secret
          secret: webhookConfig.hmac?.key,
          // Store retry config in dedicated columns (new schema)
          retryAttempts: webhookConfig.retries?.attempts ?? 3,
          retryDelay: webhookConfig.retries?.delaySeconds ?? 2,
          retryPolicy: webhookConfig.retries?.policy ?? 'linear',
          timeout: timeoutMs,
        },
      });
      
      createdWebhooks.push(webhook);
      logger.info({ webhookId: webhook.id, sessionId, url: webhookConfig.url, name: webhookName }, 'Inline webhook created');
    } catch (error) {
      logger.warn({ sessionId, url: webhookConfig.url, error }, 'Failed to create inline webhook');
    }
  }
  
  return createdWebhooks;
}

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

  // Create session in database with dedicated config columns
  const session = await prisma.waSession.create({
    data: {
      name,
      description,
      userId,
      status: start ? 'INITIALIZING' : 'FAILED', // Use FAILED as "STOPPED" equivalent
      
      // Debug mode
      debug: config?.debug ?? false,
      
      // Client configuration
      deviceName: config?.client?.deviceName,
      browserName: config?.client?.browserName,
      
      // Proxy configuration
      proxyServer: config?.proxy?.server,
      proxyUsername: config?.proxy?.username,
      proxyPassword: config?.proxy?.password,
      
      // Event ignore configuration
      ignoreStatus: config?.ignore?.status ?? false,
      ignoreGroups: config?.ignore?.groups ?? false,
      ignoreChannels: config?.ignore?.channels ?? false,
      ignoreBroadcast: config?.ignore?.broadcast ?? false,
      
      // NOWEB engine configuration
      nowebStoreEnabled: config?.noweb?.store?.enabled ?? true,
      nowebFullSync: config?.noweb?.store?.fullSync ?? false,
      nowebMarkOnline: config?.noweb?.markOnline ?? true,
      
      // User custom metadata only (not config)
      metadata: config?.metadata ? JSON.parse(JSON.stringify(config.metadata)) : undefined,
    },
  });

  // Create webhooks from inline config if provided
  if (config?.webhooks && config.webhooks.length > 0) {
    await createWebhooksFromConfig(session.id, config.webhooks);
  }

  // Start WhatsApp client if start option is true
  if (start) {
    try {
      await whatsappService.createSession(session.id, userId, config);
    } catch (error: any) {
      // If WhatsApp client fails, delete the database record and webhooks
      logger.error({ sessionId: session.id, error: error?.message || error }, 'Failed to start session, cleaning up');
      
      // Delete webhooks first (cascade should handle this, but be explicit)
      await prisma.webhook.deleteMany({ where: { sessionId: session.id } });
      await prisma.waSession.delete({ where: { id: session.id } });
      
      // Re-throw with better error message
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

  // Build config object from dedicated columns (new structure)
  const inlineWebhooks = session.webhooks.map((webhook) => {
    // Transform customHeaders from JSON object to array format
    const customHeadersObj = webhook.customHeaders as Record<string, string> | null;
    const customHeaders = customHeadersObj 
      ? Object.entries(customHeadersObj).map(([name, value]) => ({ name, value }))
      : [];
    
    return {
      url: webhook.url,
      // Convert underscore format to dot format for WAHA compatibility
      events: webhook.events.map((event) => {
        // Keep legacy uppercase events as-is (e.g., MESSAGE_RECEIVED)
        if (event.toUpperCase() === event) {
          return event;
        }
        return event.replace(/_/g, '.');
      }),
      // Include HMAC config if secret exists
      ...(webhook.secret && { hmac: { key: webhook.secret } }),
      // Include retry configuration
      retries: {
        attempts: webhook.retryAttempts,
        delaySeconds: webhook.retryDelay,
        policy: webhook.retryPolicy,
      },
      // Include custom headers if any
      ...(customHeaders.length > 0 && { customHeaders }),
      // Include timeout (converted to seconds for frontend)
      timeout: Math.round(webhook.timeout / 1000),
    };
  });
  
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

  // Build update data
  const updateData: Record<string, unknown> = {};
  
  if (input.name !== undefined) {
    updateData.name = input.name;
  }
  
  if (input.description !== undefined) {
    updateData.description = input.description;
  }
  
  // Handle config update - update dedicated columns
  if (input.config !== undefined) {
    const cfg = input.config;
    
    // Debug mode
    if (cfg.debug !== undefined) {
      updateData.debug = cfg.debug;
    }
    
    // Client configuration - handle empty object to clear values
    if (cfg.client !== undefined) {
      // If client is empty object {}, clear both values
      const hasClientConfig = cfg.client.deviceName || cfg.client.browserName;
      updateData.deviceName = cfg.client.deviceName || null;
      updateData.browserName = cfg.client.browserName || null;
    }
    
    // Proxy configuration
    if (cfg.proxy !== undefined) {
      updateData.proxyServer = cfg.proxy.server || null;
      updateData.proxyUsername = cfg.proxy.username || null;
      updateData.proxyPassword = cfg.proxy.password || null;
    }
    
    // Ignore configuration - always update all fields if ignore is provided
    if (cfg.ignore !== undefined) {
      updateData.ignoreStatus = cfg.ignore.status ?? false;
      updateData.ignoreGroups = cfg.ignore.groups ?? false;
      updateData.ignoreChannels = cfg.ignore.channels ?? false;
      updateData.ignoreBroadcast = cfg.ignore.broadcast ?? false;
    }
    
    // NOWEB engine configuration - always update all fields if noweb is provided
    if (cfg.noweb !== undefined) {
      if (cfg.noweb.store !== undefined) {
        updateData.nowebStoreEnabled = cfg.noweb.store.enabled ?? true;
        updateData.nowebFullSync = cfg.noweb.store.fullSync ?? false;
      }
      updateData.nowebMarkOnline = cfg.noweb.markOnline ?? true;
    }
    
    // User custom metadata (only user-defined key-value pairs)
    if (cfg.metadata !== undefined) {
      updateData.metadata = cfg.metadata && Object.keys(cfg.metadata).length > 0 
        ? JSON.parse(JSON.stringify(cfg.metadata)) 
        : null;
    }
    
    logger.info({ sessionId, configUpdates: Object.keys(updateData).filter(k => !['name', 'description'].includes(k)) }, 'Updating session config');
  }

  const updatedSession = await prisma.waSession.update({
    where: { id: sessionId },
    data: updateData,
  });

  logger.info({ sessionId, userId }, 'Session updated');

  return updatedSession;
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
