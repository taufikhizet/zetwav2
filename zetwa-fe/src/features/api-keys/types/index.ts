/**
 * API Keys Feature - Types & Constants
 */

// ============================================
// SCOPE CONFIGURATION
// ============================================

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
] as const

export type ApiKeyScope = (typeof API_KEY_SCOPES)[number]

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
}

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
} as const

export const SCOPE_ICONS: Record<string, string> = {
  Sessions: '📱',
  Messages: '💬',
  Contacts: '👥',
  Groups: '👨‍👩‍👧‍👦',
  Media: '📁',
  Webhooks: '🔗',
  Presence: '🟢',
  Labels: '🏷️',
  Status: '📷',
  Profile: '👤',
}

export const DEFAULT_SCOPES: ApiKeyScope[] = [
  'sessions:read',
  'sessions:write',
  'messages:send',
]

// ============================================
// TYPES
// ============================================

export interface ApiKey {
  id: string
  name: string
  description: string | null
  keyPrefix: string
  keySuffix: string
  keyPreview: string
  scopes: string[]
  isActive: boolean
  usageCount: number
  lastUsedAt: string | null
  lastIpAddress: string | null
  expiresAt: string | null
  createdAt: string
  updatedAt: string
  key?: string // Only present on create/regenerate
}

export interface CreateApiKeyInput {
  name: string
  description?: string
  scopes?: string[]
  expiresAt?: string
}

export interface UpdateApiKeyInput {
  name?: string
  description?: string | null
  isActive?: boolean
  expiresAt?: string | null
}

export interface ApiKeyStats {
  totalKeys: number
  activeKeys: number
  inactiveKeys: number
  expiredKeys: number
  totalUsage: number
}

export interface CreateApiKeyFormState {
  name: string
  description: string
  expiresAt: string
  scopes: string[]
}

// ============================================
// FORM DEFAULTS
// ============================================

export const DEFAULT_FORM_STATE: CreateApiKeyFormState = {
  name: '',
  description: '',
  expiresAt: '',
  scopes: [...DEFAULT_SCOPES],
}
