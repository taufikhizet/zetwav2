import { prisma } from '../lib/prisma.js';
import { whatsappService } from './whatsapp.service.js';
import { NotFoundError, ForbiddenError, ConflictError, BadRequestError } from '../utils/errors.js';
import { createLogger } from '../utils/logger.js';
import type { SessionStatus, WebhookEvent } from '@prisma/client';

const logger = createLogger('session-service');

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

    return {
      ...session,
      liveStatus: whatsappService.getStatus(sessionId) || session.status,
      isOnline: whatsappService.isConnected(sessionId),
      qrCode: whatsappService.getQRCode(sessionId),
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
