/**
 * Session Types - Comprehensive session configuration types
 */

import type { InlineWebhookConfig } from '@/features/webhooks/types/webhook.types'

// Proxy configuration for session
export interface ProxyConfig {
  /** Proxy server URL (e.g., http://proxy.example.com:8080) */
  server: string
  /** Proxy username (optional) */
  username?: string
  /** Proxy password (optional) */
  password?: string
}

// Client configuration - how session appears in WhatsApp
export interface ClientConfig {
  /** Device name shown in linked devices (e.g., Windows, macOS) */
  deviceName?: string
  /** Browser name shown in linked devices (e.g., Chrome, Firefox) */
  browserName?: string
}

// Ignore configuration for filtering events
export interface IgnoreConfig {
  /** Ignore status/stories events */
  status?: boolean
  /** Ignore group events */
  groups?: boolean
  /** Ignore channel events */
  channels?: boolean
  /** Ignore broadcast list events */
  broadcast?: boolean
}

// Store configuration for message persistence
export interface StoreConfig {
  /** Enable message store */
  enabled: boolean
  /** Perform full sync on connection */
  fullSync?: boolean
}

// NOWEB engine configuration
export interface NowebConfig {
  /** Message store configuration */
  store?: StoreConfig
  /** Mark as online when connected */
  markOnline?: boolean
}

// WEBJS engine configuration
export interface WebjsConfig {
  /** Enable tag events for presence and ack (may impact performance) */
  tagsEventsOn?: boolean
}

// Complete session configuration
export interface SessionConfig {
  /** Inline webhooks to create with session */
  webhooks?: InlineWebhookConfig[]
  /** Custom metadata included in all webhooks */
  metadata?: Record<string, string>
  /** Proxy configuration */
  proxy?: ProxyConfig
  /** Enable debug mode */
  debug?: boolean
  /** Event ignore filters */
  ignore?: IgnoreConfig
  /** Client identification */
  client?: ClientConfig
  /** NOWEB engine configuration */
  noweb?: NowebConfig
  /** WEBJS engine configuration */
  webjs?: WebjsConfig
}

// Session creation input
export interface CreateSessionInput {
  /** Session name (alphanumeric, hyphens, underscores) */
  name: string
  /** Optional description */
  description?: string
  /** Session configuration */
  config?: SessionConfig
  /** Start session immediately after creation */
  start?: boolean
}

// Session update input
export interface UpdateSessionInput {
  /** New session name */
  name?: string
  /** New description */
  description?: string
  /** Updated configuration */
  config?: SessionConfig
}

// Session status enum
export type SessionStatus = 
  | 'INITIALIZING'
  | 'QR_READY'
  | 'AUTHENTICATING'
  | 'CONNECTED'
  | 'DISCONNECTED'
  | 'FAILED'
  | 'LOGGED_OUT'
  // WAHA-compatible aliases
  | 'STOPPED'
  | 'STARTING'
  | 'SCAN_QR_CODE'
  | 'WORKING'

// Session information
export interface Session {
  id: string
  name: string
  description: string | null
  status: SessionStatus
  phoneNumber: string | null
  pushName: string | null
  profilePicUrl: string | null
  connectedAt: string | null
  createdAt: string
  liveStatus?: SessionStatus
  isOnline?: boolean
  qrCode?: string | null
  lastQrAt?: string | null
  config?: SessionConfig
  metadata?: Record<string, unknown>
  _count?: {
    webhooks: number
    messages: number
    chats?: number
    contacts?: number
  }
}

// Me (authenticated user) information
export interface MeInfo {
  id?: string
  phoneNumber?: string
  pushName?: string
  profilePicUrl?: string
}
