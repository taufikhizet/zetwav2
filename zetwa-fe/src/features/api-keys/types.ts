/**
 * API Keys Feature - Types & Constants
 */

// ============================================
// SCOPE CONFIGURATION
// ============================================

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
}

export const SCOPE_CATEGORIES = {
  Sessions: ['sessions:read', 'sessions:write'],
  Messages: ['messages:send', 'messages:read'],
  Contacts: ['contacts:read', 'contacts:write'],
  Groups: ['groups:read', 'groups:write'],
  Media: ['media:read', 'media:write'],
  Webhooks: ['webhooks:read', 'webhooks:write'],
} as const

export const SCOPE_ICONS: Record<string, string> = {
  Sessions: '📱',
  Messages: '💬',
  Contacts: '👥',
  Groups: '👨‍👩‍👧‍👦',
  Media: '📁',
  Webhooks: '🔗',
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
