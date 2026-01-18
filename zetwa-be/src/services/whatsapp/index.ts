/**
 * WhatsApp Service
 * Main service class combining all WhatsApp functionality
 */

import { Client, type Message, type Chat, type Contact, MessageMedia } from 'whatsapp-web.js';
import { prisma } from '../../lib/prisma.js';
import { SessionNotFoundError, SessionNotConnectedError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import { webhookService } from '../webhook.service.js';

// Import session config types
import type { SessionConfig } from '../../types/session-config.js';

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
import * as messaging from './messaging/index.js';
import * as groups from './groups.js';
import * as presence from './presence.js';
import * as labels from './labels.js';
import * as status from './status.js';
import * as profile from './profile.js';
import * as chats from './chats.js';
import * as contacts from './contacts.js';
import * as channels from './channels.js';
import * as waEvents from './events.js';
import * as calls from './calls.js';
import * as historyModule from './history.js';
import * as storageModule from './storage.js';

// Import refactored components
import { SessionStore, ExtendedWASession } from './store.js';
import { SessionLifecycle } from './lifecycle.js';

// Re-export types
export type { WASession, SessionStatus, SendMessageOptions, SendMediaOptions } from './types.js';
export { ExtendedWASession };

/**
 * Main WhatsApp Service Class
 */
export class WhatsAppService {
  // Use public readonly to allow access to store and lifecycle if needed,
  // but preferably use facade methods.
  public readonly store: SessionStore;
  public readonly lifecycle: SessionLifecycle;
  
  private events: TypedEventEmitter = new EventEmitterClass();

  public readonly messaging = messaging;
  public readonly groups = groups;
  public readonly presence = presence;
  public readonly labels = labels;
  public readonly status = status;
  public readonly profile = profile;
  public readonly chats = chats;
  public readonly contacts = contacts;
  public readonly channels = channels;
  public readonly waEvents = waEvents;
  public readonly calls = calls;
  public readonly history = historyModule;
  public readonly storage = storageModule;

  constructor() {
    this.store = new SessionStore();
    this.lifecycle = new SessionLifecycle(this.store, this.events);
    
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
    await this.lifecycle.initializeStoredSessions();
  }

  /**
   * Create a new WhatsApp session with optional config
   */
  async createSession(
    sessionId: string, 
    userId: string, 
    sessionConfig?: SessionConfig
  ): Promise<ExtendedWASession> {
    return this.lifecycle.createSession(sessionId, userId, sessionConfig);
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): WASession | undefined {
    return this.store.get(sessionId);
  }

  /**
   * Get session safely (throws if not found)
   */
  private getSessionSafe(sessionId: string): WASession {
    return this.store.getSafe(sessionId);
  }

  /**
   * Get WhatsApp client by session ID
   */
  getClient(sessionId: string): Client {
    return this.store.getClient(sessionId);
  }

  /**
   * Check if session is connected
   */
  isConnected(sessionId: string): boolean {
    return this.store.isConnected(sessionId);
  }

  /**
   * Get all sessions for a user
   */
  getUserSessions(userId: string): WASession[] {
    return this.store.getUserSessions(userId);
  }

  /**
   * Get QR code for session
   */
  getQRCode(sessionId: string): string | undefined {
    const session = this.store.get(sessionId);
    return session?.qrCode;
  }

  /**
   * Get session status
   */
  getStatus(sessionId: string): SessionStatus | undefined {
    return this.store.get(sessionId)?.status;
  }

  /**
   * Get session configuration
   */
  getSessionConfig(sessionId: string): SessionConfig | undefined {
    return this.store.get(sessionId)?.config;
  }

  /**
   * Get authenticated user ("me") information
   */
  getMeInfo(sessionId: string): { id?: string; phoneNumber?: string; pushName?: string } | null {
    const session = this.store.get(sessionId);
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
   * Get session screenshot (for debugging)
   */
  async getScreenshot(sessionId: string): Promise<Buffer | null> {
    const session = this.store.get(sessionId);
    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }

    try {
      if (session.client.pupPage && !session.client.pupPage.isClosed()) {
        return await session.client.pupPage.screenshot({ encoding: 'binary' }) as Buffer;
      }
    } catch (error) {
      logger.error({ sessionId, error }, 'Failed to take screenshot');
    }
    return null;
  }

  /**
   * Request pairing code
   */
  async requestPairingCode(sessionId: string, phoneNumber: string): Promise<string> {
    const session = this.store.get(sessionId);
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
      const formattedPhone = phoneNumber.replace(/[+\s-]/g, '');
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
    options?: SendMediaOptions & { sendAudioAsVoice?: boolean }
  ): Promise<Message> {
    return messaging.sendMedia(this.getSessionSafe(sessionId), to, media, options);
  }

  // ================================
  // SESSION MANAGEMENT
  // ================================

  async destroySession(sessionId: string, shouldLogout: boolean = false): Promise<void> {
    return this.lifecycle.destroySession(sessionId, shouldLogout);
  }

  async restartSession(sessionId: string): Promise<void> {
    return this.lifecycle.restartSession(sessionId);
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

  // ================================
  // CHANNELS (NEWSLETTERS)
  // ================================

  async listChannels(sessionId: string): Promise<any[]> {
    return channels.listChannels(this.getSessionSafe(sessionId));
  }

  async createChannel(
    sessionId: string, 
    name: string, 
    description?: string, 
    picture?: string
  ): Promise<any> {
    return channels.createChannel(this.getSessionSafe(sessionId), name, description, picture);
  }

  async deleteChannel(sessionId: string, id: string): Promise<void> {
    return channels.deleteChannel(this.getSessionSafe(sessionId), id);
  }

  async getChannel(sessionId: string, id: string): Promise<any> {
    return channels.getChannel(this.getSessionSafe(sessionId), id);
  }

  // ================================
  // EVENTS (CALENDAR)
  // ================================

  async sendEvent(
    sessionId: string,
    to: string,
    eventData: {
      name: string;
      description?: string;
      startTime: number;
      endTime?: number;
      location?: {
        latitude: number;
        longitude: number;
        name?: string;
      };
      canceled?: boolean;
    }
  ): Promise<any> {
    return waEvents.sendEvent(this.getSessionSafe(sessionId), to, eventData);
  }

  // ================================
  // CALLS
  // ================================

  async rejectCall(sessionId: string, callId: string): Promise<void> {
    return calls.rejectCall(this.getSessionSafe(sessionId), callId);
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
  // CHAT MANAGEMENT METHODS
  // ================================

  async archiveChat(sessionId: string, chatId: string) {
    return chats.archiveChat(this.getSessionSafe(sessionId), chatId);
  }

  async unarchiveChat(sessionId: string, chatId: string) {
    return chats.unarchiveChat(this.getSessionSafe(sessionId), chatId);
  }

  async deleteChat(sessionId: string, chatId: string) {
    return chats.deleteChat(this.getSessionSafe(sessionId), chatId);
  }

  async pinChat(sessionId: string, chatId: string) {
    return chats.pinChat(this.getSessionSafe(sessionId), chatId);
  }

  async unpinChat(sessionId: string, chatId: string) {
    return chats.unpinChat(this.getSessionSafe(sessionId), chatId);
  }

  async muteChat(sessionId: string, chatId: string, duration?: Date) {
    return chats.muteChat(this.getSessionSafe(sessionId), chatId, duration);
  }

  async unmuteChat(sessionId: string, chatId: string) {
    return chats.unmuteChat(this.getSessionSafe(sessionId), chatId);
  }

  async markChatRead(sessionId: string, chatId: string) {
    return chats.markChatRead(this.getSessionSafe(sessionId), chatId);
  }

  async markChatUnread(sessionId: string, chatId: string) {
    return chats.markChatUnread(this.getSessionSafe(sessionId), chatId);
  }

  async clearChat(sessionId: string, chatId: string) {
    return chats.clearChat(this.getSessionSafe(sessionId), chatId);
  }

  // ================================
  // CONTACT MANAGEMENT METHODS
  // ================================

  async blockContact(sessionId: string, contactId: string) {
    return contacts.blockContact(this.getSessionSafe(sessionId), contactId);
  }

  async unblockContact(sessionId: string, contactId: string) {
    return contacts.unblockContact(this.getSessionSafe(sessionId), contactId);
  }

  async getContactAbout(sessionId: string, contactId: string) {
    return contacts.getContactAbout(this.getSessionSafe(sessionId), contactId);
  }

  // ================================
  // EXTENDED MESSAGE METHODS
  // ================================

  async sendReaction(sessionId: string, messageId: string, reaction: string) {
    return messaging.sendReaction(this.getSessionSafe(sessionId), messageId, reaction);
  }

  async removeReaction(sessionId: string, messageId: string) {
    return messaging.removeReaction(this.getSessionSafe(sessionId), messageId);
  }

  async sendLocation(sessionId: string, to: string, latitude: number, longitude: number, description?: string, options?: { quotedMessageId?: string; url?: string }) {
    return messaging.sendLocation(this.getSessionSafe(sessionId), to, latitude, longitude, description, options);
  }

  async sendContact(sessionId: string, to: string, contact: ContactInfo, options?: { quotedMessageId?: string }) {
    return messaging.sendContactInfo(this.getSessionSafe(sessionId), to, contact, options);
  }

  async sendPoll(sessionId: string, to: string, name: string, options: string[], settings?: { selectableCount?: number; quotedMessageId?: string }) {
    return messaging.sendPoll(this.getSessionSafe(sessionId), to, name, options, settings);
  }

  async sendPollVote(sessionId: string, to: string, pollMessageId: string, selectedOptions: string[]) {
    return messaging.sendPollVote(this.getSessionSafe(sessionId), to, pollMessageId, selectedOptions);
  }

  async sendButtons(sessionId: string, to: string, body: string, buttons: MessageButton[], title?: string, footer?: string) {
    return messaging.sendButtons(this.getSessionSafe(sessionId), to, body, buttons, title, footer);
  }

  async sendList(sessionId: string, to: string, body: string, buttonText: string, sections: ListSection[], title?: string, footer?: string) {
    return messaging.sendList(this.getSessionSafe(sessionId), to, body, buttonText, sections, title, footer);
  }

  async forwardMessage(sessionId: string, messageId: string, to: string) {
    return messaging.forwardMessage(this.getSessionSafe(sessionId), messageId, to);
  }

  async deleteMessage(sessionId: string, messageId: string, forEveryone: boolean) {
    return messaging.deleteMessage(this.getSessionSafe(sessionId), messageId, forEveryone);
  }

  async editMessage(sessionId: string, messageId: string, newContent: string) {
    return messaging.editMessage(this.getSessionSafe(sessionId), messageId, newContent);
  }

  async starMessage(sessionId: string, messageId: string, star: boolean) {
    return messaging.starMessage(this.getSessionSafe(sessionId), messageId, star);
  }

  async getStarredMessages(sessionId: string) {
    return messaging.getStarredMessages(this.getSessionSafe(sessionId));
  }

  async downloadMedia(sessionId: string, messageId: string) {
    return messaging.downloadMedia(this.getSessionSafe(sessionId), messageId);
  }

  async getMessageInfo(sessionId: string, messageId: string) {
    return messaging.getMessageInfo(this.getSessionSafe(sessionId), messageId);
  }

  // ================================
  // SHUTDOWN
  // ================================

  async shutdown(): Promise<void> {
    return this.lifecycle.shutdown();
  }
}

// Export singleton instance
export const whatsappService = new WhatsAppService();
