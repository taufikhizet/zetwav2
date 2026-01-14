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
  'sessions:read',
  'sessions:write',
  'messages:send',
  'messages:read',
  'contacts:read',
  'contacts:write',
  'groups:read',
  'groups:write',
  'media:read',
  'media:write',
  'webhooks:read',
  'webhooks:write',
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
