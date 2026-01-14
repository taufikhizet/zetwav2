import { api, type ApiResponse } from '@/lib/api'

// ============================================
// TYPES
// ============================================

/**
 * Available API key scopes for granular access control
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
] as const

export type ApiKeyScope = (typeof API_KEY_SCOPES)[number]

/**
 * Scope descriptions for UI display
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
}

/**
 * Scope categories for UI grouping
 */
export const SCOPE_CATEGORIES = {
  Sessions: ['sessions:read', 'sessions:write'],
  Messages: ['messages:send', 'messages:read'],
  Contacts: ['contacts:read', 'contacts:write'],
  Groups: ['groups:read', 'groups:write'],
  Media: ['media:read', 'media:write'],
  Webhooks: ['webhooks:read', 'webhooks:write'],
} as const

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
  // Only present on create/regenerate
  key?: string
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

export interface ScopesInfo {
  scopes: string[]
  descriptions: Record<string, string>
}

// ============================================
// API FUNCTIONS
// ============================================

export const apiKeyApi = {
  /**
   * List all API keys for current user
   */
  list: async (): Promise<ApiKey[]> => {
    const response = await api.get<ApiResponse<ApiKey[]>>('/api-keys')
    return response.data.data
  },

  /**
   * Get a single API key by ID
   */
  get: async (keyId: string): Promise<ApiKey> => {
    const response = await api.get<ApiResponse<ApiKey>>(`/api-keys/${keyId}`)
    return response.data.data
  },

  /**
   * Create a new API key
   * Returns the full key - shown only once
   */
  create: async (data: CreateApiKeyInput): Promise<ApiKey> => {
    const response = await api.post<ApiResponse<ApiKey>>('/api-keys', data)
    return response.data.data
  },

  /**
   * Update an API key (name, description, isActive)
   */
  update: async (keyId: string, data: UpdateApiKeyInput): Promise<ApiKey> => {
    const response = await api.patch<ApiResponse<ApiKey>>(`/api-keys/${keyId}`, data)
    return response.data.data
  },

  /**
   * Update API key scopes
   */
  updateScopes: async (keyId: string, scopes: string[]): Promise<ApiKey> => {
    const response = await api.patch<ApiResponse<ApiKey>>(`/api-keys/${keyId}/scopes`, { scopes })
    return response.data.data
  },

  /**
   * Delete an API key
   */
  delete: async (keyId: string): Promise<void> => {
    await api.delete(`/api-keys/${keyId}`)
  },

  /**
   * Regenerate API key
   * Returns the new full key - shown only once
   */
  regenerate: async (keyId: string): Promise<ApiKey> => {
    const response = await api.post<ApiResponse<ApiKey>>(`/api-keys/${keyId}/regenerate`)
    return response.data.data
  },

  /**
   * Get API key statistics for current user
   */
  getStats: async (): Promise<ApiKeyStats> => {
    const response = await api.get<ApiResponse<ApiKeyStats>>('/api-keys/stats')
    return response.data.data
  },

  /**
   * Get available scopes and descriptions
   */
  getScopes: async (): Promise<ScopesInfo> => {
    const response = await api.get<ApiResponse<ScopesInfo>>('/api-keys/scopes')
    return response.data.data
  },

  /**
   * Revoke all API keys
   */
  revokeAll: async (): Promise<{ revokedCount: number }> => {
    const response = await api.post<ApiResponse<{ revokedCount: number }>>('/api-keys/revoke-all')
    return response.data.data
  },
}
