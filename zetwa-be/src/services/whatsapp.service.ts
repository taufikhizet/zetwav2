import { Client, LocalAuth, type Message, type Chat, type Contact, type MessageMedia } from 'whatsapp-web.js';
import * as qrcode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import { prisma } from '../lib/prisma.js';
import { config } from '../config/index.js';
import { createLogger } from '../utils/logger.js';
import { SessionNotFoundError, SessionNotConnectedError } from '../utils/errors.js';

const logger = createLogger('whatsapp-service');

// Define enums locally matching Prisma schema
type SessionStatus = 'INITIALIZING' | 'QR_READY' | 'AUTHENTICATING' | 'CONNECTED' | 'DISCONNECTED' | 'FAILED' | 'LOGGED_OUT';
type MessageType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'STICKER' | 'LOCATION' | 'CONTACT' | 'POLL' | 'REACTION' | 'SYSTEM' | 'UNKNOWN';
type MessageDirection = 'INCOMING' | 'OUTGOING';

export interface WASession {
  client: Client;
  sessionId: string;
  userId: string;
  status: SessionStatus;
  qrCode?: string;
}

export interface SendMessageOptions {
  quotedMessageId?: string;
  mentions?: string[];
}

export interface SendMediaOptions extends SendMessageOptions {
  caption?: string;
  filename?: string;
}

class WhatsAppService extends EventEmitter {
  private sessions: Map<string, WASession> = new Map();
  private initializingIds: Set<string> = new Set();

  constructor() {
    super();
    this.setMaxListeners(100);
  }

  /**
   * Initialize WhatsApp sessions from database on startup
   */
  async initializeStoredSessions(): Promise<void> {
    try {
      const activeSessions = await prisma.waSession.findMany({
        where: {
          isActive: true,
          status: { in: ['CONNECTED', 'DISCONNECTED'] },
        },
      });

      logger.info(`Found ${activeSessions.length} sessions to restore`);

      for (const session of activeSessions) {
        try {
          await this.createSession(session.id, session.userId);
        } catch (error) {
          logger.error({ sessionId: session.id, error }, 'Failed to restore session');
        }
      }
    } catch (error) {
      logger.error({ error }, 'Failed to initialize stored sessions');
    }
  }

  /**
   * Create a new WhatsApp session
   */
  async createSession(sessionId: string, userId: string): Promise<void> {
    if (this.sessions.has(sessionId)) {
      logger.warn({ sessionId }, 'Session already exists');
      return;
    }

    if (this.initializingIds.has(sessionId)) {
      logger.warn({ sessionId }, 'Session is already initializing');
      return;
    }

    this.initializingIds.add(sessionId);

    try {
      const sessionPath = path.join(config.whatsapp.sessionPath, sessionId);

      // Ensure session directory exists
      if (!fs.existsSync(config.whatsapp.sessionPath)) {
        fs.mkdirSync(config.whatsapp.sessionPath, { recursive: true });
      }

      const clientOptions: ConstructorParameters<typeof Client>[0] = {
        authStrategy: new LocalAuth({
          clientId: sessionId,
          dataPath: config.whatsapp.sessionPath,
        }),
        puppeteer: {
          headless: config.whatsapp.headless,
          args: [
            // Essential security/sandbox args
            '--no-sandbox',
            '--disable-setuid-sandbox',
            
            // Memory optimization args - CRITICAL for multi-session
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--disable-software-rasterizer',
            '--disable-extensions',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-component-update',
            '--disable-default-apps',
            '--disable-sync',
            '--disable-translate',
            '--disable-hang-monitor',
            '--disable-popup-blocking',
            '--disable-prompt-on-repost',
            '--disable-domain-reliability',
            '--disable-features=TranslateUI,BlinkGenPropertyTrees',
            '--disable-ipc-flooding-protection',
            
            // Reduce memory footprint (Windows compatible)
            '--js-flags=--max-old-space-size=256',
            '--no-first-run',
            
            // Network optimization
            '--dns-prefetch-disable',
          ],
          ...(config.whatsapp.puppeteerPath && {
            executablePath: config.whatsapp.puppeteerPath,
          }),
        },
        // Resource management: Limit QR retries to prevent abandoned sessions from wasting resources
        // After qrMaxRetries, the client will emit 'disconnected' with reason 'Max qrcode retries reached'
        qrMaxRetries: config.whatsapp.qrMaxRetries,
        // Auth timeout: If not authenticated within this time, destroy the session
        authTimeoutMs: config.whatsapp.authTimeoutMs,
      };

      const client = new Client(clientOptions);

      const waSession: WASession = {
        client,
        sessionId,
        userId,
        status: 'INITIALIZING',
      };

      this.sessions.set(sessionId, waSession);

      // Setup event handlers
      this.setupEventHandlers(client, sessionId, userId);

      // Initialize client
      await client.initialize();

      logger.info({ sessionId, userId }, 'WhatsApp session created');
    } catch (error) {
      this.sessions.delete(sessionId);
      logger.error({ sessionId, error }, 'Failed to create session');
      throw error;
    } finally {
      this.initializingIds.delete(sessionId);
    }
  }

  /**
   * Setup WhatsApp client event handlers
   */
  private setupEventHandlers(client: Client, sessionId: string, userId: string): void {
    // QR Code event
    client.on('qr', async (qr) => {
      try {
        const qrDataUrl = await qrcode.toDataURL(qr);
        const session = this.sessions.get(sessionId);
        
        if (session) {
          session.qrCode = qrDataUrl;
          session.status = 'QR_READY';
        }

        await prisma.waSession.update({
          where: { id: sessionId },
          data: {
            status: 'QR_READY',
            qrCode: qrDataUrl,
            lastQrAt: new Date(),
          },
        });

        this.emit('qr', { sessionId, userId, qr: qrDataUrl });
        this.emit(`qr:${sessionId}`, qrDataUrl);

        logger.info({ sessionId }, 'QR code generated');
      } catch (error) {
        logger.error({ sessionId, error }, 'Failed to process QR code');
      }
    });

    // Authenticated event
    client.on('authenticated', async () => {
      try {
        const session = this.sessions.get(sessionId);
        if (session) {
          session.status = 'AUTHENTICATING';
        }

        await prisma.waSession.update({
          where: { id: sessionId },
          data: {
            status: 'AUTHENTICATING',
            qrCode: null,
          },
        });

        this.emit('authenticated', { sessionId, userId });
        logger.info({ sessionId }, 'Session authenticated');
      } catch (error) {
        logger.error({ sessionId, error }, 'Error handling authenticated event');
      }
    });

    // Ready event
    client.on('ready', async () => {
      try {
        const info = client.info;
        const session = this.sessions.get(sessionId);
        
        if (session) {
          session.status = 'CONNECTED';
          session.qrCode = undefined;
        }

        let profilePicUrl: string | undefined;
        try {
          profilePicUrl = await client.getProfilePicUrl(info.wid._serialized);
        } catch {
          // Profile pic might not be available
        }

        await prisma.waSession.update({
          where: { id: sessionId },
          data: {
            status: 'CONNECTED',
            phoneNumber: info.wid.user,
            pushName: info.pushname,
            profilePicUrl,
            qrCode: null,
            connectedAt: new Date(),
          },
        });

        this.emit('ready', { sessionId, userId, info });
        logger.info({ sessionId, phoneNumber: info.wid.user }, 'Session ready');
      } catch (error) {
        logger.error({ sessionId, error }, 'Error handling ready event');
      }
    });

    // Message received event
    client.on('message', async (message) => {
      try {
        await this.handleIncomingMessage(sessionId, userId, message);
      } catch (error) {
        logger.error({ sessionId, error }, 'Error handling incoming message');
      }
    });

    // Message sent event
    client.on('message_create', async (message) => {
      if (message.fromMe) {
        try {
          await this.handleOutgoingMessage(sessionId, userId, message);
        } catch (error) {
          logger.error({ sessionId, error }, 'Error handling outgoing message');
        }
      }
    });

    // Message ACK event
    client.on('message_ack', async (message, ack) => {
      try {
        await this.handleMessageAck(sessionId, message, ack);
        this.emit('message_ack', { sessionId, userId, messageId: message.id._serialized, ack });
      } catch (error) {
        logger.error({ sessionId, error }, 'Error handling message ack');
      }
    });

    // Disconnected event
    client.on('disconnected', async (reason) => {
      try {
        const session = this.sessions.get(sessionId);
        if (session) {
          session.status = 'DISCONNECTED';
          session.qrCode = undefined; // Clear QR code
        }

        // Convert reason to string for comparison (whatsapp-web.js types can vary)
        const reasonStr = String(reason);
        
        // Determine appropriate status based on disconnect reason
        const isQrTimeout = reasonStr === 'Max qrcode retries reached';
        const isAuthTimeout = reasonStr === 'Auth timeout';
        const newStatus: SessionStatus = isQrTimeout || isAuthTimeout ? 'FAILED' : 'DISCONNECTED';

        await prisma.waSession.update({
          where: { id: sessionId },
          data: {
            status: newStatus,
            qrCode: null, // Clear stale QR
            disconnectedAt: new Date(),
          },
        });

        // Emit appropriate event
        if (isQrTimeout) {
          this.emit('qr_timeout', { sessionId, userId, reason: reasonStr });
          logger.warn({ sessionId }, 'Session QR timeout - max retries reached, resources cleaned up');
        } else if (isAuthTimeout) {
          this.emit('auth_timeout', { sessionId, userId, reason: reasonStr });
          logger.warn({ sessionId }, 'Session auth timeout, resources cleaned up');
        }
        
        this.emit('disconnected', { sessionId, userId, reason: reasonStr });
        logger.info({ sessionId, reason: reasonStr }, 'Session disconnected');

        // Clean up Puppeteer instance to free resources
        // This is critical for abandoned sessions
        if (isQrTimeout || isAuthTimeout) {
          try {
            await client.destroy();
            this.sessions.delete(sessionId);
            logger.info({ sessionId }, 'Abandoned session cleaned up, resources freed');
          } catch (destroyError) {
            logger.error({ sessionId, error: destroyError }, 'Failed to destroy abandoned session');
          }
        }
      } catch (error) {
        logger.error({ sessionId, error }, 'Error handling disconnected event');
      }
    });

    // Auth failure event
    client.on('auth_failure', async (message) => {
      try {
        const session = this.sessions.get(sessionId);
        if (session) {
          session.status = 'FAILED';
        }

        await prisma.waSession.update({
          where: { id: sessionId },
          data: {
            status: 'FAILED',
          },
        });

        this.emit('auth_failure', { sessionId, userId, message });
        logger.error({ sessionId, message }, 'Authentication failed');
      } catch (error) {
        logger.error({ sessionId, error }, 'Error handling auth failure');
      }
    });

    // State change event
    client.on('change_state', async (state) => {
      this.emit('state_change', { sessionId, userId, state });
      logger.debug({ sessionId, state }, 'State changed');
    });
  }

  /**
   * Handle incoming message
   */
  private async handleIncomingMessage(
    sessionId: string,
    userId: string,
    message: Message
  ): Promise<void> {
    const chat = await message.getChat();
    const contact = await message.getContact();

    // Ensure chat exists in database
    const dbChat = await this.ensureChat(sessionId, chat);

    // Determine message type
    const messageType = this.getMessageType(message);

    // Save message to database
    const savedMessage = await prisma.message.create({
      data: {
        waMessageId: message.id._serialized,
        sessionId,
        chatId: dbChat.id,
        direction: 'INCOMING',
        type: messageType,
        body: message.body || null,
        caption: (message as { caption?: string }).caption || null,
        isFromMe: message.fromMe,
        isForwarded: message.isForwarded || false,
        timestamp: new Date(message.timestamp * 1000),
        status: 'DELIVERED',
        metadata: {
          from: message.from,
          to: message.to,
          author: message.author,
          deviceType: message.deviceType,
          hasMedia: message.hasMedia,
        },
      },
    });

    // Emit event for webhooks
    this.emit('message', {
      sessionId,
      userId,
      message: {
        id: savedMessage.id,
        waMessageId: message.id._serialized,
        type: messageType,
        body: message.body,
        from: message.from,
        to: message.to,
        timestamp: message.timestamp,
        isFromMe: message.fromMe,
        hasMedia: message.hasMedia,
        contact: {
          id: contact.id._serialized,
          name: contact.name || contact.pushname,
          number: contact.number,
        },
        chat: {
          id: chat.id._serialized,
          name: chat.name,
          isGroup: chat.isGroup,
        },
      },
    });

    logger.debug({ sessionId, messageId: message.id._serialized }, 'Incoming message processed');
  }

  /**
   * Handle outgoing message
   */
  private async handleOutgoingMessage(
    sessionId: string,
    userId: string,
    message: Message
  ): Promise<void> {
    const chat = await message.getChat();

    // Ensure chat exists in database
    const dbChat = await this.ensureChat(sessionId, chat);

    // Determine message type
    const messageType = this.getMessageType(message);

    // Save message to database
    const savedMessage = await prisma.message.upsert({
      where: {
        sessionId_waMessageId: {
          sessionId,
          waMessageId: message.id._serialized,
        },
      },
      update: {
        status: 'SENT',
      },
      create: {
        waMessageId: message.id._serialized,
        sessionId,
        chatId: dbChat.id,
        direction: 'OUTGOING',
        type: messageType,
        body: message.body || null,
        caption: (message as { caption?: string }).caption || null,
        isFromMe: true,
        timestamp: new Date(message.timestamp * 1000),
        status: 'SENT',
        metadata: {
          from: message.from,
          to: message.to,
        },
      },
    });

    this.emit('message_sent', {
      sessionId,
      userId,
      message: {
        id: savedMessage.id,
        waMessageId: message.id._serialized,
        type: messageType,
        body: message.body,
        to: message.to,
        timestamp: message.timestamp,
      },
    });

    logger.debug({ sessionId, messageId: message.id._serialized }, 'Outgoing message processed');
  }

  /**
   * Handle message acknowledgment
   */
  private async handleMessageAck(
    sessionId: string,
    message: Message,
    ack: number
  ): Promise<void> {
    const statusMap: Record<number, string> = {
      0: 'PENDING',
      1: 'SENT',
      2: 'DELIVERED',
      3: 'READ',
      4: 'READ',
    };

    const status = statusMap[ack] || 'SENT';

    await prisma.message.updateMany({
      where: {
        sessionId,
        waMessageId: message.id._serialized,
      },
      data: {
        status: status as 'PENDING' | 'SENT' | 'DELIVERED' | 'READ',
        ackAt: new Date(),
      },
    });
  }

  /**
   * Ensure chat exists in database
   */
  private async ensureChat(sessionId: string, chat: Chat) {
    return prisma.chat.upsert({
      where: {
        sessionId_waChatId: {
          sessionId,
          waChatId: chat.id._serialized,
        },
      },
      update: {
        name: chat.name,
        lastMessageAt: new Date(),
      },
      create: {
        waChatId: chat.id._serialized,
        sessionId,
        type: chat.isGroup ? 'GROUP' : 'PRIVATE',
        name: chat.name,
        isGroup: chat.isGroup,
        lastMessageAt: new Date(),
      },
    });
  }

  /**
   * Get message type from WhatsApp message
   */
  private getMessageType(message: Message): MessageType {
    const type = message.type;

    const typeMap: Record<string, MessageType> = {
      chat: 'TEXT',
      image: 'IMAGE',
      video: 'VIDEO',
      audio: 'AUDIO',
      ptt: 'AUDIO',
      document: 'DOCUMENT',
      sticker: 'STICKER',
      location: 'LOCATION',
      vcard: 'CONTACT',
      multi_vcard: 'CONTACT',
      poll_creation: 'POLL',
      reaction: 'REACTION',
      revoked: 'SYSTEM',
    };

    return typeMap[type] || 'UNKNOWN';
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): WASession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get session client
   */
  getClient(sessionId: string): Client {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }
    return session.client;
  }

  /**
   * Check if session is connected
   */
  isConnected(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    return session?.status === 'CONNECTED';
  }

  /**
   * Get all sessions for a user
   */
  getUserSessions(userId: string): WASession[] {
    return Array.from(this.sessions.values()).filter((s) => s.userId === userId);
  }

  /**
   * Send text message
   */
  async sendMessage(
    sessionId: string,
    to: string,
    message: string,
    options?: SendMessageOptions
  ): Promise<Message> {
    const client = this.getClient(sessionId);
    const session = this.sessions.get(sessionId);

    if (!session || session.status !== 'CONNECTED') {
      throw new SessionNotConnectedError(sessionId);
    }

    // Format phone number
    const chatId = to.includes('@') ? to : `${to.replace(/\D/g, '')}@c.us`;

    const sendOptions: { quotedMessageId?: string; mentions?: string[] } = {};

    if (options?.quotedMessageId) {
      sendOptions.quotedMessageId = options.quotedMessageId;
    }

    if (options?.mentions) {
      sendOptions.mentions = options.mentions;
    }

    const sentMessage = await client.sendMessage(chatId, message, sendOptions);

    logger.info({ sessionId, to: chatId }, 'Message sent');

    return sentMessage;
  }

  /**
   * Send media message
   */
  async sendMedia(
    sessionId: string,
    to: string,
    media: MessageMedia,
    options?: SendMediaOptions
  ): Promise<Message> {
    const client = this.getClient(sessionId);
    const session = this.sessions.get(sessionId);

    if (!session || session.status !== 'CONNECTED') {
      throw new SessionNotConnectedError(sessionId);
    }

    const chatId = to.includes('@') ? to : `${to.replace(/\D/g, '')}@c.us`;

    const sendOptions: { caption?: string; quotedMessageId?: string } = {};

    if (options?.caption) {
      sendOptions.caption = options.caption;
    }

    if (options?.quotedMessageId) {
      sendOptions.quotedMessageId = options.quotedMessageId;
    }

    const sentMessage = await client.sendMessage(chatId, media, sendOptions);

    logger.info({ sessionId, to: chatId, mediaType: media.mimetype }, 'Media sent');

    return sentMessage;
  }

  /**
   * Get QR code for session
   */
  getQRCode(sessionId: string): string | undefined {
    const session = this.sessions.get(sessionId);
    return session?.qrCode;
  }

  /**
   * Get session status
   */
  getStatus(sessionId: string): SessionStatus | undefined {
    return this.sessions.get(sessionId)?.status;
  }

  /**
   * Logout and destroy session
   */
  async destroySession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);

    if (session) {
      try {
        await session.client.logout();
      } catch {
        // Ignore logout errors
      }

      try {
        await session.client.destroy();
      } catch {
        // Ignore destroy errors
      }

      this.sessions.delete(sessionId);
    }

    // Remove session data
    const sessionPath = path.join(config.whatsapp.sessionPath, `session-${sessionId}`);
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
    }

    await prisma.waSession.update({
      where: { id: sessionId },
      data: {
        status: 'LOGGED_OUT',
        disconnectedAt: new Date(),
        // Clear user data on logout - user intentionally logged out
        phoneNumber: null,
        pushName: null,
        profilePicUrl: null,
        qrCode: null,
        lastQrAt: null,
        connectedAt: null,
      },
    });

    logger.info({ sessionId }, 'Session destroyed');
  }

  /**
   * Restart session
   */
  async restartSession(sessionId: string): Promise<void> {
    const dbSession = await prisma.waSession.findUnique({
      where: { id: sessionId },
    });

    if (!dbSession) {
      throw new SessionNotFoundError(sessionId);
    }

    // Destroy existing session if any
    const existingSession = this.sessions.get(sessionId);
    if (existingSession) {
      try {
        await existingSession.client.destroy();
      } catch {
        // Ignore errors
      }
      this.sessions.delete(sessionId);
    }

    // Clear session data in database (phone, name, etc.)
    await prisma.waSession.update({
      where: { id: sessionId },
      data: {
        status: 'INITIALIZING',
        phoneNumber: null,
        pushName: null,
        profilePicUrl: null,
        connectedAt: null,
        qrCode: null,
        lastQrAt: null,
      },
    });

    // Create new session
    await this.createSession(sessionId, dbSession.userId);

    logger.info({ sessionId }, 'Session restarted');
  }

  /**
   * Get all chats for session
   */
  async getChats(sessionId: string): Promise<Chat[]> {
    const client = this.getClient(sessionId);
    const session = this.sessions.get(sessionId);

    if (!session || session.status !== 'CONNECTED') {
      throw new SessionNotConnectedError(sessionId);
    }

    return client.getChats();
  }

  /**
   * Get all contacts for session
   */
  async getContacts(sessionId: string): Promise<Contact[]> {
    const client = this.getClient(sessionId);
    const session = this.sessions.get(sessionId);

    if (!session || session.status !== 'CONNECTED') {
      throw new SessionNotConnectedError(sessionId);
    }

    return client.getContacts();
  }

  /**
   * Check if number is registered on WhatsApp
   */
  async isRegistered(sessionId: string, number: string): Promise<boolean> {
    const client = this.getClient(sessionId);
    const session = this.sessions.get(sessionId);

    if (!session || session.status !== 'CONNECTED') {
      throw new SessionNotConnectedError(sessionId);
    }

    const formattedNumber = number.includes('@') ? number : `${number.replace(/\D/g, '')}@c.us`;
    const result = await client.isRegisteredUser(formattedNumber);

    return result;
  }

  /**
   * Get profile picture URL
   */
  async getProfilePicUrl(sessionId: string, contactId: string): Promise<string | undefined> {
    const client = this.getClient(sessionId);
    const session = this.sessions.get(sessionId);

    if (!session || session.status !== 'CONNECTED') {
      throw new SessionNotConnectedError(sessionId);
    }

    try {
      return await client.getProfilePicUrl(contactId);
    } catch {
      return undefined;
    }
  }

  /**
   * Graceful shutdown - destroy all sessions
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down WhatsApp service...');

    const sessionCount = this.sessions.size;
    if (sessionCount === 0) {
      logger.info('No active sessions to close');
      return;
    }

    logger.info({ sessionCount }, 'Closing active sessions...');

    const promises = Array.from(this.sessions.entries()).map(async ([sessionId, session]) => {
      try {
        // Set a per-session timeout
        const destroyPromise = session.client.destroy();
        const timeoutPromise = new Promise<void>((_, reject) => 
          setTimeout(() => reject(new Error('Session destroy timeout')), 5000)
        );
        
        await Promise.race([destroyPromise, timeoutPromise]);
        logger.debug({ sessionId }, 'Session closed');
      } catch (error) {
        // Log but don't throw - we want to continue closing other sessions
        logger.warn({ sessionId, error: error instanceof Error ? error.message : error }, 'Error closing session (will be force-closed)');
      }
    });

    await Promise.allSettled(promises);
    this.sessions.clear();

    logger.info('WhatsApp service shutdown complete');
  }
}

export const whatsappService = new WhatsAppService();
