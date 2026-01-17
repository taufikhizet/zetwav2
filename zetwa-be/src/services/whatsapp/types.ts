/**
 * WhatsApp Service Types & Interfaces
 */

import type { Client, Message, MessageMedia } from 'whatsapp-web.js';
import { EventEmitter } from 'events';

// Re-export from whatsapp-web.js for convenience
export type { Client, Message, Chat, Contact, MessageMedia, Label, Location } from 'whatsapp-web.js';

/**
 * Session status types
 */
export type SessionStatus =
  | 'INITIALIZING'
  | 'SCAN_QR'
  | 'AUTHENTICATING'
  | 'AUTHENTICATED'
  | 'CONNECTED'
  | 'DISCONNECTED'
  | 'LOGGED_OUT'
  | 'FAILED';

/**
 * WhatsApp session representation in memory
 */
export interface WASession {
  sessionId: string;
  userId: string;
  client: Client;
  status: SessionStatus;
  qrCode?: string;
  phoneNumber?: string;
  pushName?: string;
}

/**
 * Options for sending text messages
 */
export interface SendMessageOptions {
  quotedMessageId?: string;
  mentions?: string[];
}

/**
 * Options for sending media messages
 */
export interface SendMediaOptions {
  caption?: string;
  quotedMessageId?: string;
}

/**
 * Message type enumeration
 */
export type MessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'voice'
  | 'document'
  | 'sticker'
  | 'location'
  | 'contact'
  | 'poll'
  | 'reaction'
  | 'unknown';

/**
 * Serialized message format for webhooks and API responses
 */
export interface SerializedMessage {
  id: string;
  from: string;
  to: string;
  body: string;
  type: MessageType;
  timestamp: number;
  isGroup: boolean;
  isStatus: boolean;
  hasMedia: boolean;
  hasQuotedMsg: boolean;
  quotedMsgId?: string;
  author?: string;
  mediaType?: string;
  mediaUrl?: string;
  caption?: string;
  location?: {
    latitude: number;
    longitude: number;
    description?: string;
  };
  vCards?: string[];
  mentionedIds?: string[];
  groupId?: string;
  groupName?: string;
}

/**
 * Message acknowledgment status
 */
export interface MessageAck {
  messageId: string;
  ack: number;
  ackName: string;
}

/**
 * Contact information for vCard
 */
export interface ContactInfo {
  name: string;
  phone: string;
  organization?: string;
  email?: string;
}

/**
 * Button definition for interactive messages
 */
export interface MessageButton {
  id: string;
  text: string;
}

/**
 * List section for list messages
 */
export interface ListSection {
  title: string;
  rows: Array<{
    id: string;
    title: string;
    description?: string;
  }>;
}

/**
 * Label update options
 */
export interface LabelUpdate {
  name?: string;
  color?: number;
}

/**
 * Group update options
 */
export interface GroupUpdate {
  name?: string;
  description?: string;
}

/**
 * Group settings options
 */
export interface GroupSettings {
  announce?: boolean;
  restrict?: boolean;
}

/**
 * Event payload types for WhatsApp events
 */
export interface QrEventPayload {
  sessionId: string;
  userId?: string;
  qr: string;
}

export interface ReadyEventPayload {
  sessionId: string;
  userId?: string;
  info?: { phoneNumber?: string; pushName?: string };
}

export interface AuthenticatedEventPayload {
  sessionId: string;
  userId?: string;
}

export interface AuthFailureEventPayload {
  sessionId: string;
  userId?: string;
  message?: string;
}

export interface DisconnectedEventPayload {
  sessionId: string;
  userId?: string;
  reason?: string;
}

export interface MessageEventPayload {
  sessionId: string;
  userId?: string;
  message?: SerializedMessage;
}

export interface MessageAckEventPayload {
  sessionId: string;
  messageId?: string;
  ack?: MessageAck;
}

export interface StateChangeEventPayload {
  sessionId: string;
  state?: SessionStatus;
}

export interface TimeoutEventPayload {
  sessionId: string;
  userId?: string;
  reason?: string;
}

export interface GroupJoinEventPayload {
  sessionId: string;
  groupId: string;
  participants: string[];
  type: string;
}

export interface GroupLeaveEventPayload {
  sessionId: string;
  groupId: string;
  participant: string;
  type: string;
}

export interface GroupUpdateEventPayload {
  sessionId: string;
  groupId: string;
  update: string; // subject, description, picture
  value?: string;
  author?: string;
}

export interface CallEventPayload {
  sessionId: string;
  call: any; // TODO: Define strict Call type
}

export interface ReactionEventPayload {
  sessionId: string;
  messageId: string;
  reaction: string;
  senderId: string;
}

/**
 * Event emitter interface for WhatsApp events - using object payloads
 */
export interface WhatsAppEventMap {
  qr: QrEventPayload;
  ready: ReadyEventPayload;
  authenticated: AuthenticatedEventPayload;
  auth_failure: AuthFailureEventPayload;
  disconnected: DisconnectedEventPayload;
  qr_timeout: TimeoutEventPayload;
  auth_timeout: TimeoutEventPayload;
  message: MessageEventPayload;
  message_sent: MessageEventPayload;
  message_ack: MessageAckEventPayload;
  state_change: StateChangeEventPayload;
  // New events
  group_join: GroupJoinEventPayload;
  group_leave: GroupLeaveEventPayload;
  group_update: GroupUpdateEventPayload;
  call: CallEventPayload;
  message_reaction: ReactionEventPayload;
}

export type WhatsAppEventName = keyof WhatsAppEventMap;

/**
 * Typed event emitter for WhatsApp service
 * Uses object payloads for all events
 */
export class TypedEventEmitter extends EventEmitter {
  override emit<K extends WhatsAppEventName>(event: K, data: WhatsAppEventMap[K]): boolean {
    return super.emit(event, data);
  }

  override on<K extends WhatsAppEventName>(event: K, listener: (data: WhatsAppEventMap[K]) => void): this {
    return super.on(event, listener);
  }

  override once<K extends WhatsAppEventName>(event: K, listener: (data: WhatsAppEventMap[K]) => void): this {
    return super.once(event, listener);
  }

  override off<K extends WhatsAppEventName>(event: K, listener: (data: WhatsAppEventMap[K]) => void): this {
    return super.off(event, listener);
  }
}
