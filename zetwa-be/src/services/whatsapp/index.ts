/**
 * WhatsApp Service
 * Main service class combining all WhatsApp functionality
 */

import { Client, LocalAuth, type Message, type Chat, type Contact, MessageMedia } from 'whatsapp-web.js';
import path from 'path';
import fs from 'fs';
import { prisma } from '../../lib/prisma.js';
import { config } from '../../config/index.js';
import { SessionNotFoundError, SessionNotConnectedError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import { webhookService } from '../webhook.service.js';

// Import session config types
import type { SessionConfig, ClientConfig, ProxyConfig } from '../../types/session-config.js';

// Import types
import type {
  WASession,
  SessionStatus,
  SendMessageOptions,
  SendMediaOptions,
  TypedEventEmitter,
  GroupUpdate,
  GroupSettings,
  LabelUpdate,
  ContactInfo,
  MessageButton,
  ListSection,
} from './types.js';
import { TypedEventEmitter as EventEmitterClass } from './types.js';

// Import modules
import { setupEventHandlers } from './event-handlers.js';
import * as messaging from './messaging.js';
import * as groups from './groups.js';
import * as presence from './presence.js';
import * as labels from './labels.js';
import * as status from './status.js';
import * as profile from './profile.js';
import * as messagesExtended from './messages-extended.js';

// Re-export types
export type { WASession, SessionStatus, SendMessageOptions, SendMediaOptions } from './types.js';

/**
 * Extended session with config
 */
interface ExtendedWASession extends WASession {
  config?: SessionConfig;
}

/**
 * Main WhatsApp Service Class
 */
export class WhatsAppService {
  private sessions: Map<string, ExtendedWASession> = new Map();
  private events: TypedEventEmitter = new EventEmitterClass();

  constructor() {
    this.initializeStoredSessions();
  }

  /**
   * Get event emitter for external subscriptions
   */
  getEvents(): TypedEventEmitter {
    return this.events;
  }

  /**
   * Subscribe to service events (delegate to internal emitter)
   */
  on<K extends import('./types.js').WhatsAppEventName>(
    event: K,
    listener: (data: import('./types.js').WhatsAppEventMap[K]) => void
  ): this {
    this.events.on(event, listener);
    return this;
  }

  /**
   * Initialize stored sessions on startup
   */
  async initializeStoredSessions(): Promise<void> {
    try {
      const storedSessions = await prisma.waSession.findMany({
        where: {
          status: {
            in: ['CONNECTED', 'AUTHENTICATING', 'QR_READY'],
          },
        },
      });

      logger.info({ count: storedSessions.length }, 'Found stored sessions to initialize');

      for (const session of storedSessions) {
        try {
          await this.createSession(session.id, session.userId);
        } catch (error) {
          logger.error({ sessionId: session.id, error }, 'Failed to initialize stored session');
        }
      }
    } catch (error) {
      logger.error({ error }, 'Failed to initialize stored sessions');
    }
  }

  /**
   * Update session status in memory and emit event
   */
  private updateSessionStatus(sessionId: string, status: SessionStatus): void {
    this.events.emit('state_change', { sessionId, state: status });
  }

  /**
   * Build puppeteer arguments based on session config
   */
  private getPuppeteerArgs(sessionConfig?: SessionConfig): string[] {
    const baseArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-sync',
      '--disable-translate',
      '--disable-features=TranslateUI',
      '--metrics-recording-only',
      '--mute-audio',
      '--no-default-browser-check',
      '--autoplay-policy=user-gesture-required',
    ];

    // Add proxy args if configured AND proxy server is provided
    if (sessionConfig?.proxy?.server && sessionConfig.proxy.server.trim()) {
      const proxyServer = sessionConfig.proxy.server.trim();
      logger.info({ proxyServer }, 'Using proxy for session');
      baseArgs.push(`--proxy-server=${proxyServer}`);
    }

    return baseArgs;
  }

  /**
   * Get browser identification from client config
   */
  private getClientInfo(clientConfig?: ClientConfig): { webVersion?: string; webVersionCache?: any } {
    // whatsapp-web.js uses different browser identification
    // This is a simplified version - can be extended based on needs
    return {};
  }

  /**
   * Create a new WhatsApp session with optional config
   */
  async createSession(
    sessionId: string, 
    userId: string, 
    sessionConfig?: SessionConfig
  ): Promise<ExtendedWASession> {
    if (this.sessions.has(sessionId)) {
      return this.sessions.get(sessionId)!;
    }

    logger.info({ sessionId, hasConfig: !!sessionConfig, hasProxy: !!sessionConfig?.proxy?.server }, 'Creating WhatsApp session');

    // Build client options
    const puppeteerArgs = this.getPuppeteerArgs(sessionConfig);
    const clientInfo = this.getClientInfo(sessionConfig?.client);

    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: sessionId,
        dataPath: config.whatsapp.sessionPath,
      }),
      puppeteer: {
        headless: true,
        args: puppeteerArgs,
        timeout: 60000, // 60 second timeout for puppeteer operations
      },
      qrMaxRetries: 5,
      ...clientInfo,
    });

    const session: ExtendedWASession = {
      sessionId,
      userId,
      client,
      status: 'INITIALIZING',
      config: sessionConfig,
    };

    this.sessions.set(sessionId, session);

    // Setup event handlers
    setupEventHandlers(
      client,
      sessionId,
      this.sessions,
      this.events,
      this.updateSessionStatus.bind(this)
    );

    // Initialize client with better error handling
    try {
      await client.initialize();
    } catch (error: any) {
      logger.error({ sessionId, error: error?.message || error }, 'Failed to initialize client');
      this.sessions.delete(sessionId);
      
      // Provide more helpful error messages
      const errorMessage = error?.message || String(error);
      if (errorMessage.includes('ERR_CONNECTION_RESET') || errorMessage.includes('ERR_CONNECTION_REFUSED')) {
        throw new Error(
          'Failed to connect to WhatsApp Web. This could be due to: ' +
          '(1) Network connectivity issues, ' +
          '(2) WhatsApp Web is temporarily unavailable, ' +
          '(3) Invalid proxy configuration, or ' +
          '(4) Firewall blocking the connection. ' +
          'Please check your network and try again.'
        );
      }
      if (errorMessage.includes('ERR_PROXY')) {
        throw new Error(
          'Proxy connection failed. Please verify your proxy server address and credentials are correct.'
        );
      }
      if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
        throw new Error(
          'Connection timed out while connecting to WhatsApp Web. Please check your internet connection and try again.'
        );
      }
      
      throw error;
    }

    return session;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): WASession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get session safely (throws if not found)
   */
  private getSessionSafe(sessionId: string): WASession {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }
    return session;
  }

  /**
   * Get WhatsApp client by session ID
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
   * Get session configuration
   */
  getSessionConfig(sessionId: string): SessionConfig | undefined {
    const session = this.sessions.get(sessionId);
    return session?.config;
  }

  /**
   * Get authenticated user ("me") information
   */
  getMeInfo(sessionId: string): { id?: string; phoneNumber?: string; pushName?: string } | null {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'CONNECTED') {
      return null;
    }
    
    try {
      const info = session.client.info;
      return {
        id: info?.wid?._serialized,
        phoneNumber: info?.wid?.user,
        pushName: info?.pushname,
      };
    } catch {
      return null;
    }
  }

  /**
   * Request pairing code for phone number authentication
   * This is an alternative to QR code scanning - user can enter a code
   * displayed on their WhatsApp mobile app to link the device.
   * 
   * Note: This feature requires whatsapp-web.js version 1.23.0+
   * and may not be available in all configurations.
   */
  async requestPairingCode(sessionId: string, phoneNumber: string): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }

    // Check if session is in a state where pairing code can be requested
    const validStatuses: SessionStatus[] = ['SCAN_QR', 'INITIALIZING'];
    if (!validStatuses.includes(session.status)) {
      throw new Error(
        `Cannot request pairing code. Session status is ${session.status}. ` +
        `Expected one of: ${validStatuses.join(', ')}`
      );
    }

    try {
      // whatsapp-web.js supports requestPairingCode since v1.23.0
      // Format phone number (remove + and spaces if present)
      const formattedPhone = phoneNumber.replace(/[+\s-]/g, '');
      
      // Request pairing code from the client
      // The method returns the pairing code as a string
      const code = await session.client.requestPairingCode(formattedPhone);
      
      logger.info({ sessionId, phoneNumber: phoneNumber.slice(-4) }, 'Pairing code generated');
      
      return code;
    } catch (error) {
      logger.error({ sessionId, error }, 'Failed to request pairing code');
      throw new Error(
        'Failed to generate pairing code. This feature may not be available. ' +
        'Please try scanning the QR code instead.'
      );
    }
  }

  // ================================
  // CORE MESSAGING
  // ================================

  async sendMessage(
    sessionId: string,
    to: string,
    message: string,
    options?: SendMessageOptions
  ): Promise<Message> {
    return messaging.sendMessage(this.getSessionSafe(sessionId), to, message, options);
  }

  async sendMedia(
    sessionId: string,
    to: string,
    media: MessageMedia,
    options?: SendMediaOptions
  ): Promise<Message> {
    return messaging.sendMedia(this.getSessionSafe(sessionId), to, media, options);
  }

  // ================================
  // SESSION MANAGEMENT
  // ================================

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

  async restartSession(sessionId: string): Promise<void> {
    const dbSession = await prisma.waSession.findUnique({
      where: { id: sessionId },
    });

    if (!dbSession) {
      throw new SessionNotFoundError(sessionId);
    }

    const existingSession = this.sessions.get(sessionId);
    if (existingSession) {
      try {
        await existingSession.client.destroy();
      } catch {
        // Ignore errors
      }
      this.sessions.delete(sessionId);
    }

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

    await this.createSession(sessionId, dbSession.userId);

    logger.info({ sessionId }, 'Session restarted');
  }

  // ================================
  // CHATS & CONTACTS
  // ================================

  async getChats(sessionId: string): Promise<Chat[]> {
    const session = this.getSessionSafe(sessionId);
    if (session.status !== 'CONNECTED') {
      throw new SessionNotConnectedError(sessionId);
    }
    return session.client.getChats();
  }

  async getContacts(sessionId: string): Promise<Contact[]> {
    const session = this.getSessionSafe(sessionId);
    if (session.status !== 'CONNECTED') {
      throw new SessionNotConnectedError(sessionId);
    }
    return session.client.getContacts();
  }

  async isRegistered(sessionId: string, number: string): Promise<boolean> {
    const session = this.getSessionSafe(sessionId);
    if (session.status !== 'CONNECTED') {
      throw new SessionNotConnectedError(sessionId);
    }
    const formattedNumber = number.includes('@') ? number : `${number.replace(/\D/g, '')}@c.us`;
    return session.client.isRegisteredUser(formattedNumber);
  }

  async getProfilePicUrl(sessionId: string, contactId: string): Promise<string | undefined> {
    const session = this.getSessionSafe(sessionId);
    if (session.status !== 'CONNECTED') {
      throw new SessionNotConnectedError(sessionId);
    }
    try {
      return await session.client.getProfilePicUrl(contactId);
    } catch {
      return undefined;
    }
  }

  // ================================
  // GROUP METHODS
  // ================================

  async createGroup(sessionId: string, name: string, participants: string[]) {
    return groups.createGroup(this.getSessionSafe(sessionId), name, participants);
  }

  async getGroups(sessionId: string) {
    return groups.getGroups(this.getSessionSafe(sessionId));
  }

  async getGroupInfo(sessionId: string, groupId: string) {
    return groups.getGroupInfo(this.getSessionSafe(sessionId), groupId);
  }

  async updateGroup(sessionId: string, groupId: string, updates: GroupUpdate) {
    return groups.updateGroup(this.getSessionSafe(sessionId), groupId, updates);
  }

  async updateGroupSettings(sessionId: string, groupId: string, settings: GroupSettings) {
    return groups.updateGroupSettings(this.getSessionSafe(sessionId), groupId, settings);
  }

  async getGroupParticipants(sessionId: string, groupId: string) {
    return groups.getGroupParticipants(this.getSessionSafe(sessionId), groupId);
  }

  async addGroupParticipants(sessionId: string, groupId: string, participants: string[]) {
    return groups.addGroupParticipants(this.getSessionSafe(sessionId), groupId, participants);
  }

  async removeGroupParticipants(sessionId: string, groupId: string, participants: string[]) {
    return groups.removeGroupParticipants(this.getSessionSafe(sessionId), groupId, participants);
  }

  async promoteParticipants(sessionId: string, groupId: string, participants: string[]) {
    return groups.promoteParticipants(this.getSessionSafe(sessionId), groupId, participants);
  }

  async demoteParticipants(sessionId: string, groupId: string, participants: string[]) {
    return groups.demoteParticipants(this.getSessionSafe(sessionId), groupId, participants);
  }

  async leaveGroup(sessionId: string, groupId: string) {
    return groups.leaveGroup(this.getSessionSafe(sessionId), groupId);
  }

  async getGroupInviteCode(sessionId: string, groupId: string) {
    return groups.getGroupInviteCode(this.getSessionSafe(sessionId), groupId);
  }

  async revokeGroupInvite(sessionId: string, groupId: string) {
    return groups.revokeGroupInvite(this.getSessionSafe(sessionId), groupId);
  }

  async joinGroup(sessionId: string, inviteCode: string) {
    return groups.joinGroup(this.getSessionSafe(sessionId), inviteCode);
  }

  async setGroupPicture(sessionId: string, groupId: string, imageUrl?: string, imageBase64?: string) {
    return groups.setGroupPicture(this.getSessionSafe(sessionId), groupId, imageUrl, imageBase64);
  }

  // ================================
  // PRESENCE METHODS
  // ================================

  async setPresence(sessionId: string, presenceState: string, chatId?: string) {
    return presence.setPresence(this.getSessionSafe(sessionId), presenceState, chatId);
  }

  async subscribePresence(sessionId: string, contactId: string) {
    return presence.subscribePresence(this.getSessionSafe(sessionId), contactId);
  }

  async getPresence(sessionId: string, contactId: string) {
    return presence.getPresence(this.getSessionSafe(sessionId), contactId);
  }

  async sendTyping(sessionId: string, chatId: string, typing: boolean) {
    return presence.sendTyping(this.getSessionSafe(sessionId), chatId, typing);
  }

  async sendRecording(sessionId: string, chatId: string, recording: boolean) {
    return presence.sendRecording(this.getSessionSafe(sessionId), chatId, recording);
  }

  async markSeen(sessionId: string, chatId: string) {
    return presence.markSeen(this.getSessionSafe(sessionId), chatId);
  }

  // ================================
  // LABELS METHODS
  // ================================

  async getLabels(sessionId: string) {
    return labels.getLabels(this.getSessionSafe(sessionId));
  }

  async createLabel(sessionId: string, name: string, color?: number) {
    return labels.createLabel(this.getSessionSafe(sessionId), name, color);
  }

  async getLabelById(sessionId: string, labelId: string) {
    return labels.getLabelById(this.getSessionSafe(sessionId), labelId);
  }

  async updateLabel(sessionId: string, labelId: string, updates: LabelUpdate) {
    return labels.updateLabel(this.getSessionSafe(sessionId), labelId, updates);
  }

  async deleteLabel(sessionId: string, labelId: string) {
    return labels.deleteLabel(this.getSessionSafe(sessionId), labelId);
  }

  async getChatsByLabel(sessionId: string, labelId: string) {
    return labels.getChatsByLabel(this.getSessionSafe(sessionId), labelId);
  }

  async assignLabelToChat(sessionId: string, labelId: string, chatId: string) {
    return labels.assignLabelToChat(this.getSessionSafe(sessionId), labelId, chatId);
  }

  async unassignLabelFromChat(sessionId: string, labelId: string, chatId: string) {
    return labels.unassignLabelFromChat(this.getSessionSafe(sessionId), labelId, chatId);
  }

  // ================================
  // STATUS METHODS
  // ================================

  async getMyStatuses(sessionId: string) {
    return status.getMyStatuses(this.getSessionSafe(sessionId));
  }

  async getContactStatuses(sessionId: string) {
    return status.getContactStatuses(this.getSessionSafe(sessionId));
  }

  async getContactStatus(sessionId: string, contactId: string) {
    return status.getContactStatus(this.getSessionSafe(sessionId), contactId);
  }

  async postTextStatus(sessionId: string, text: string, backgroundColor?: string, font?: number) {
    return status.postTextStatus(this.getSessionSafe(sessionId), text, backgroundColor, font);
  }

  async postMediaStatus(sessionId: string, mediaUrl?: string, mediaBase64?: string, mimetype?: string, caption?: string) {
    return status.postMediaStatus(this.getSessionSafe(sessionId), mediaUrl, mediaBase64, mimetype, caption);
  }

  async deleteStatus(sessionId: string, statusId: string) {
    return status.deleteStatus(this.getSessionSafe(sessionId), statusId);
  }

  async markStatusSeen(sessionId: string, statusId: string) {
    return status.markStatusSeen(this.getSessionSafe(sessionId), statusId);
  }

  // ================================
  // PROFILE METHODS
  // ================================

  async getProfile(sessionId: string) {
    return profile.getProfile(this.getSessionSafe(sessionId));
  }

  async setProfileName(sessionId: string, name: string) {
    return profile.setProfileName(this.getSessionSafe(sessionId), name);
  }

  async setProfileAbout(sessionId: string, about: string) {
    return profile.setProfileAbout(this.getSessionSafe(sessionId), about);
  }

  async setProfilePicture(sessionId: string, imageUrl?: string, imageBase64?: string) {
    return profile.setProfilePicture(this.getSessionSafe(sessionId), imageUrl, imageBase64);
  }

  async removeProfilePicture(sessionId: string) {
    return profile.removeProfilePicture(this.getSessionSafe(sessionId));
  }

  async getBusinessProfile(sessionId: string) {
    return profile.getBusinessProfile(this.getSessionSafe(sessionId));
  }

  // ================================
  // EXTENDED MESSAGE METHODS
  // ================================

  async sendReaction(sessionId: string, messageId: string, reaction: string) {
    return messagesExtended.sendReaction(this.getSessionSafe(sessionId), messageId, reaction);
  }

  async removeReaction(sessionId: string, messageId: string) {
    return messagesExtended.removeReaction(this.getSessionSafe(sessionId), messageId);
  }

  async sendLocation(sessionId: string, to: string, latitude: number, longitude: number, description?: string, url?: string) {
    return messagesExtended.sendLocation(this.getSessionSafe(sessionId), to, latitude, longitude, description, url);
  }

  async sendContact(sessionId: string, to: string, contact: ContactInfo) {
    return messagesExtended.sendContact(this.getSessionSafe(sessionId), to, contact);
  }

  async sendPoll(sessionId: string, to: string, name: string, options: string[], allowMultipleAnswers: boolean) {
    return messagesExtended.sendPoll(this.getSessionSafe(sessionId), to, name, options, allowMultipleAnswers);
  }

  async sendButtons(sessionId: string, to: string, body: string, buttons: MessageButton[], title?: string, footer?: string) {
    return messagesExtended.sendButtons(this.getSessionSafe(sessionId), to, body, buttons, title, footer);
  }

  async sendList(sessionId: string, to: string, body: string, buttonText: string, sections: ListSection[], title?: string, footer?: string) {
    return messagesExtended.sendList(this.getSessionSafe(sessionId), to, body, buttonText, sections, title, footer);
  }

  async forwardMessage(sessionId: string, messageId: string, to: string) {
    return messagesExtended.forwardMessage(this.getSessionSafe(sessionId), messageId, to);
  }

  async deleteMessage(sessionId: string, messageId: string, forEveryone: boolean) {
    return messagesExtended.deleteMessage(this.getSessionSafe(sessionId), messageId, forEveryone);
  }

  async editMessage(sessionId: string, messageId: string, newContent: string) {
    return messagesExtended.editMessage(this.getSessionSafe(sessionId), messageId, newContent);
  }

  async starMessage(sessionId: string, messageId: string, star: boolean) {
    return messagesExtended.starMessage(this.getSessionSafe(sessionId), messageId, star);
  }

  async getStarredMessages(sessionId: string) {
    return messagesExtended.getStarredMessages(this.getSessionSafe(sessionId));
  }

  async downloadMedia(sessionId: string, messageId: string) {
    return messagesExtended.downloadMedia(this.getSessionSafe(sessionId), messageId);
  }

  async getMessageInfo(sessionId: string, messageId: string) {
    return messagesExtended.getMessageInfo(this.getSessionSafe(sessionId), messageId);
  }

  // ================================
  // SHUTDOWN
  // ================================

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
        const destroyPromise = session.client.destroy();
        const timeoutPromise = new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error('Session destroy timeout')), 5000)
        );

        await Promise.race([destroyPromise, timeoutPromise]);
        logger.debug({ sessionId }, 'Session closed');
      } catch (error) {
        logger.warn({ sessionId, error: error instanceof Error ? error.message : error }, 'Error closing session (will be force-closed)');
      }
    });

    await Promise.allSettled(promises);
    this.sessions.clear();

    logger.info('WhatsApp service shutdown complete');
  }
}

// Export singleton instance
export const whatsappService = new WhatsAppService();
