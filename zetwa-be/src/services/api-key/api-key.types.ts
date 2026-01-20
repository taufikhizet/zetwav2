/**
 * API Key Module - Constants & Types
 * 
 * Centralized definitions for API key scopes and related types.
 */

// ============================================
// SCOPES CONFIGURATION
// ============================================

/**
 * Available API key scopes for granular access control
 * Format: resource:action
 */
export const API_KEY_SCOPES = [
  // Session management
  'sessions:read',
  'sessions:write',
  // Messaging
  'messages:send',
  'messages:read',
  // Contacts
  'contacts:read',
  'contacts:write',
  // Groups
  'groups:read',
  'groups:write',
  // Media handling
  'media:read',
  'media:write',
  // Webhooks
  'webhooks:read',
  'webhooks:write',
  // Presence & typing indicators
  'presence:read',
  'presence:write',
  // Labels (WhatsApp Business)
  'labels:read',
  'labels:write',
  // Status/Stories
  'status:read',
  'status:write',
  // Profile management
  'profile:read',
  'profile:write',
] as const;

export type ApiKeyScope = (typeof API_KEY_SCOPES)[number];

/**
 * Scope descriptions for documentation and UI
 */
export const SCOPE_DESCRIPTIONS: Record<ApiKeyScope, string> = {
  'sessions:read': 'Read session info and status',
  'sessions:write': 'Create, start, stop, and delete sessions',
  'messages:send': 'Send messages (text, media, location, etc.)',
  'messages:read': 'Read message history',
  'contacts:read': 'Read contacts list',
  'contacts:write': 'Create and modify contacts',
  'groups:read': 'Read group info and participants',
  'groups:write': 'Create, modify, and manage groups',
  'media:read': 'Download media files',
  'media:write': 'Upload and send media files',
  'webhooks:read': 'Read webhook configuration',
  'webhooks:write': 'Configure and modify webhooks',
  'presence:read': 'Read online/typing status of contacts',
  'presence:write': 'Set online status and typing indicators',
  'labels:read': 'Read labels (WhatsApp Business)',
  'labels:write': 'Create, update, and manage labels',
  'status:read': 'View status/stories from contacts',
  'status:write': 'Post and manage status/stories',
  'profile:read': 'Read WhatsApp profile information',
  'profile:write': 'Update profile name, about, and picture',
};

/**
 * Scope categories for grouping in UI
 */
export const SCOPE_CATEGORIES = {
  Sessions: ['sessions:read', 'sessions:write'],
  Messages: ['messages:send', 'messages:read'],
  Contacts: ['contacts:read', 'contacts:write'],
  Groups: ['groups:read', 'groups:write'],
  Media: ['media:read', 'media:write'],
  Webhooks: ['webhooks:read', 'webhooks:write'],
  Presence: ['presence:read', 'presence:write'],
  Labels: ['labels:read', 'labels:write'],
  Status: ['status:read', 'status:write'],
  Profile: ['profile:read', 'profile:write'],
} as const;

/**
 * Default scopes for new API keys
 */
export const DEFAULT_SCOPES: ApiKeyScope[] = [
  'sessions:read',
  'sessions:write',
  'messages:send',
];

// ============================================
// API KEY CONFIGURATION
// ============================================

/**
 * API key format configuration
 */
export const API_KEY_CONFIG = {
  /** Prefix for all API keys */
  PREFIX: 'zetwa_',
  /** Length of random part */
  RANDOM_LENGTH: 32,
  /** Total key length (prefix + random) */
  TOTAL_LENGTH: 38,
  /** Length of prefix to store for display */
  PREFIX_DISPLAY_LENGTH: 12,
  /** Length of suffix to store for identification */
  SUFFIX_LENGTH: 4,
} as const;

// ============================================
// TYPES & INTERFACES
// ============================================

export interface CreateApiKeyInput {
  name: string;
  description?: string;
  scopes?: string[];
  expiresAt?: Date;
}

export interface UpdateApiKeyInput {
  name?: string;
  description?: string;
  isActive?: boolean;
  expiresAt?: Date | string | null;
}

export interface ValidateKeyResult {
  userId: string;
  apiKeyId: string;
  scopes: string[];
}

export interface ApiKeyStats {
  totalKeys: number;
  activeKeys: number;
  inactiveKeys: number;
  totalUsage: number;
  expiredKeys: number;
}

/**
 * Fields to select when returning API key data (excludes sensitive fields)
 */
export const API_KEY_SELECT_FIELDS = {
  id: true,
  name: true,
  description: true,
  keyPrefix: true,
  keySuffix: true,
  scopes: true,
  isActive: true,
  usageCount: true,
  lastUsedAt: true,
  lastIpAddress: true,
  expiresAt: true,
  createdAt: true,
  updatedAt: true,
} as const;
