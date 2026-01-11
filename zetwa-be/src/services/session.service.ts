import { prisma } from '../lib/prisma.js';
import { whatsappService } from './whatsapp.service.js';
import { NotFoundError, ForbiddenError, ConflictError, BadRequestError } from '../utils/errors.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('session-service');

// Define enums locally matching Prisma schema
type SessionStatus = 'INITIALIZING' | 'QR_READY' | 'AUTHENTICATING' | 'CONNECTED' | 'DISCONNECTED' | 'FAILED' | 'LOGGED_OUT';
type WebhookEvent = 
  | 'MESSAGE_RECEIVED'
  | 'MESSAGE_SENT'
  | 'MESSAGE_ACK'
  | 'MESSAGE_REVOKED'
  | 'QR_RECEIVED'
  | 'AUTHENTICATED'
  | 'AUTH_FAILURE'
  | 'READY'
  | 'DISCONNECTED'
  | 'STATE_CHANGE'
  | 'CONTACT_CHANGED'
  | 'GROUP_JOIN'
  | 'GROUP_LEAVE'
  | 'GROUP_UPDATE'
  | 'CALL_RECEIVED'
  | 'ALL';

export interface CreateSessionInput {
  name: string;
  description?: string;
}

export interface UpdateSessionInput {
  name?: string;
  description?: string;
}

export interface CreateWebhookInput {
  name: string;
  url: string;
  events?: WebhookEvent[];
  headers?: Record<string, string>;
  secret?: string;
  retryCount?: number;
  timeout?: number;
}

class SessionService {
  /**
   * Create a new WhatsApp session
   */
  async create(userId: string, input: CreateSessionInput) {
    const { name, description } = input;

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

    // Create session in database
    const session = await prisma.waSession.create({
      data: {
        name,
        description,
        userId,
        status: 'INITIALIZING',
      },
    });

    // Start WhatsApp client
    try {
      await whatsappService.createSession(session.id, userId);
    } catch (error) {
      // If WhatsApp client fails, delete the database record
      await prisma.waSession.delete({ where: { id: session.id } });
      throw error;
    }

    logger.info({ sessionId: session.id, userId }, 'Session created');

    return session;
  }

  /**
   * Get all sessions for a user
   */
  async list(userId: string) {
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
  async getById(userId: string, sessionId: string) {
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
    // This is important for cases where session was destroyed (QR timeout, auth failure)
    // but page is refreshed - the in-memory session no longer exists
    const memoryStatus = whatsappService.getStatus(sessionId);
    const dbStatus = session.status;
    
    logger.debug({ sessionId, memoryStatus, dbStatus }, 'Session status check');
    
    // If database shows FAILED but memory has no session, trust database
    // If memory has session, trust memory status
    // This handles the case where session expired and was cleaned up
    let liveStatus: string;
    if (memoryStatus) {
      liveStatus = memoryStatus;
    } else {
      // No session in memory - use database status
      // If status is QR_READY but no session in memory, it means session expired
      // and the QR was never scanned - treat as FAILED
      if (dbStatus === 'QR_READY' || dbStatus === 'INITIALIZING' || dbStatus === 'AUTHENTICATING') {
        // Session should exist in memory but doesn't - mark as expired/failed
        // This can happen if server restarted or session was cleaned up
        logger.info({ sessionId, dbStatus }, 'Detected stale session, marking as FAILED');
        liveStatus = 'FAILED';
        
        // Also update database to reflect this
        prisma.waSession.update({
          where: { id: sessionId },
          data: { status: 'FAILED', qrCode: null }
        }).catch((err) => {
          // Log but don't throw - this is a cleanup operation
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
      // Don't return stale QR code if session is failed/disconnected
      qrCode: isFailedOrDisconnected ? null : whatsappService.getQRCode(sessionId),
      lastQrAt: session.lastQrAt,
    };
  }

  /**
   * Update session
   */
  async update(userId: string, sessionId: string, input: UpdateSessionInput) {
    // Verify ownership
    const session = await this.getById(userId, sessionId);

    // Check name uniqueness if changing name
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
   * Delete session
   */
  async delete(userId: string, sessionId: string) {
    // Verify ownership
    await this.getById(userId, sessionId);

    // Destroy WhatsApp session
    await whatsappService.destroySession(sessionId);

    // Soft delete in database
    await prisma.waSession.update({
      where: { id: sessionId },
      data: { isActive: false },
    });

    logger.info({ sessionId, userId }, 'Session deleted');
  }

  /**
   * Get QR code for session
   */
  async getQRCode(userId: string, sessionId: string) {
    const session = await this.getById(userId, sessionId);

    const qrCode = whatsappService.getQRCode(sessionId);
    const liveStatus = whatsappService.getStatus(sessionId);
    const currentStatus = liveStatus || session.status;

    // Check if session has failed (QR timeout/max retries reached)
    if (currentStatus === 'FAILED') {
      return {
        status: 'FAILED',
        qrCode: null,
        message: 'Session expired. QR code was not scanned in time. Please restart the session to get a new QR code.',
        canRetry: true,
      };
    }

    // Check if session is logged out
    if (currentStatus === 'LOGGED_OUT') {
      return {
        status: 'LOGGED_OUT',
        qrCode: null,
        message: 'Session has been logged out. Please restart to reconnect.',
        canRetry: true,
      };
    }

    // Check if session is disconnected
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
  async restart(userId: string, sessionId: string) {
    // Verify ownership
    await this.getById(userId, sessionId);

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
  async logout(userId: string, sessionId: string) {
    // Verify ownership
    await this.getById(userId, sessionId);

    await whatsappService.destroySession(sessionId);

    return {
      status: 'LOGGED_OUT',
      message: 'Session logged out successfully',
    };
  }

  /**
   * Get session status
   */
  async getStatus(userId: string, sessionId: string) {
    const session = await this.getById(userId, sessionId);
    
    return {
      id: session.id,
      name: session.name,
      status: whatsappService.getStatus(sessionId) || session.status,
      isOnline: whatsappService.isConnected(sessionId),
      phoneNumber: session.phoneNumber,
      pushName: session.pushName,
    };
  }

  // ================================
  // Webhook Management
  // ================================

  /**
   * Create webhook for session
   */
  async createWebhook(userId: string, sessionId: string, input: CreateWebhookInput) {
    // Verify session ownership
    await this.getById(userId, sessionId);

    const webhook = await prisma.webhook.create({
      data: {
        name: input.name,
        url: input.url,
        sessionId,
        events: input.events || ['ALL'],
        headers: input.headers || {},
        secret: input.secret,
        retryCount: input.retryCount || 3,
        timeout: input.timeout || 30000,
      },
    });

    logger.info({ webhookId: webhook.id, sessionId }, 'Webhook created');

    return webhook;
  }

  /**
   * Get webhooks for session
   */
  async getWebhooks(userId: string, sessionId: string) {
    // Verify session ownership
    await this.getById(userId, sessionId);

    return prisma.webhook.findMany({
      where: { sessionId },
      include: {
        _count: {
          select: { logs: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update webhook
   */
  async updateWebhook(
    userId: string,
    sessionId: string,
    webhookId: string,
    data: Partial<CreateWebhookInput> & { isActive?: boolean }
  ) {
    // Verify session ownership
    await this.getById(userId, sessionId);

    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId },
    });

    if (!webhook || webhook.sessionId !== sessionId) {
      throw new NotFoundError('Webhook not found');
    }

    return prisma.webhook.update({
      where: { id: webhookId },
      data,
    });
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(userId: string, sessionId: string, webhookId: string) {
    // Verify session ownership
    await this.getById(userId, sessionId);

    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId },
    });

    if (!webhook || webhook.sessionId !== sessionId) {
      throw new NotFoundError('Webhook not found');
    }

    await prisma.webhook.delete({
      where: { id: webhookId },
    });

    logger.info({ webhookId, sessionId }, 'Webhook deleted');
  }

  /**
   * Get webhook logs
   */
  async getWebhookLogs(
    userId: string,
    sessionId: string,
    webhookId: string,
    limit: number = 50
  ) {
    // Verify session ownership
    await this.getById(userId, sessionId);

    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId },
    });

    if (!webhook || webhook.sessionId !== sessionId) {
      throw new NotFoundError('Webhook not found');
    }

    return prisma.webhookLog.findMany({
      where: { webhookId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

export const sessionService = new SessionService();
