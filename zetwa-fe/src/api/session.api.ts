import { api, type ApiResponse } from '@/lib/api'

// ================================
// Session Configuration Types (WAHA-inspired)
// ================================

/** Proxy configuration for the session */
export interface ProxyConfig {
  server: string
  username?: string
  password?: string
}

/** HMAC configuration for webhook security */
export interface HmacConfig {
  key?: string
}

/** Retry configuration for webhooks */
export interface RetriesConfig {
  delaySeconds?: number
  attempts?: number
  policy?: 'linear' | 'exponential' | 'constant'
}

/** Custom header for webhooks */
export interface CustomHeader {
  name: string
  value: string
}

/** Inline webhook configuration (per session) */
export interface InlineWebhookConfig {
  url: string
  events: string[]
  hmac?: HmacConfig
  retries?: RetriesConfig
  customHeaders?: CustomHeader[]
}

/** Store configuration for session data persistence */
export interface StoreConfig {
  enabled: boolean
  fullSync?: boolean
}

/** Engine-specific configuration (NOWEB/Baileys) */
export interface NowebConfig {
  store?: StoreConfig
  markOnline?: boolean
}

/** Configuration for ignoring specific event types */
export interface IgnoreConfig {
  status?: boolean
  groups?: boolean
  channels?: boolean
  broadcast?: boolean
}

/** Client configuration - how session appears in WhatsApp */
export interface ClientConfig {
  deviceName?: string
  browserName?: string
}

/** Main session configuration object */
export interface SessionConfig {
  webhooks?: InlineWebhookConfig[]
  metadata?: Record<string, string>
  proxy?: ProxyConfig
  debug?: boolean
  ignore?: IgnoreConfig
  client?: ClientConfig
  noweb?: NowebConfig
}

// ================================
// Session Types
// ================================

export interface Session {
  id: string
  name: string
  description: string | null
  status: string
  phoneNumber: string | null
  pushName: string | null
  profilePicUrl: string | null
  connectedAt: string | null
  createdAt: string
  liveStatus?: string
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

export interface CreateSessionInput {
  name: string
  description?: string
  config?: SessionConfig
  start?: boolean
}

export interface UpdateSessionInput {
  name?: string
  description?: string
  config?: SessionConfig
}

/** QR code response with format support (legacy) */
export interface QRCodeResponse {
  status: string
  value?: string | null
  qrCode?: string | null
  message?: string
  canRetry?: boolean
  /** Action to take when session needs intervention (e.g., 'restart') */
  action?: 'restart' | null
  /** API endpoint to call for the action */
  endpoint?: string
}

/** Smart QR code response - unified response format */
export interface SmartQRResponse {
  /** Whether the operation was successful */
  success: boolean
  /** Current session status */
  status: 'WORKING' | 'AUTHENTICATING' | 'SCAN_QR_CODE' | 'INITIALIZING' | 'STARTING' | 
          'FAILED' | 'DISCONNECTED' | 'LOGGED_OUT' | 'ERROR' | 'UNKNOWN' | string
  /** QR code (base64 image or raw string depending on format) */
  qr: string | null
  /** Output format used */
  format?: 'image' | 'raw'
  /** Human-readable message */
  message: string
  /** Suggested action if restart needed */
  action?: 'restart'
  /** API endpoint for the action */
  endpoint?: string
  /** Helpful hint for next steps */
  hint?: string
}

/** Options for QR request - SIMPLIFIED following industry best practices */
export interface SmartQROptions {
  /** Output format: 'image' (base64) or 'raw' (QR string) */
  format?: 'image' | 'raw'
  /** 
   * Wait briefly (max 5s) if session is initializing
   * For realtime updates, use WebSocket instead
   */
  wait?: boolean
  /** Max timeout in ms (default: 5000, max: 10000) */
  timeout?: number
}

/** Pairing code response */
export interface PairingCodeResponse {
  code: string
  phoneNumber: string
  message: string
}

/** Request pairing code input */
export interface RequestCodeInput {
  phoneNumber: string
  method?: 'sms' | 'voice'
}

/** Me (authenticated user) information */
export interface MeInfo {
  id?: string
  phoneNumber?: string
  pushName?: string
  profilePicUrl?: string
}

export interface Webhook {
  id: string
  name: string
  url: string
  events: string[]
  isActive: boolean
  secret?: string | null
  // New dedicated columns from schema update
  retryAttempts: number
  retryDelay: number
  retryPolicy: string
  timeout: number
  customHeaders?: Array<{ name: string; value: string }> | null
  // Retries object (transformed from backend for easy access)
  retries?: {
    attempts: number
    delaySeconds: number
    policy: string
  }
  createdAt: string
  _count?: {
    logs: number
  }
  // Legacy fields (for backward compat - deprecated)
  /** @deprecated Use retryAttempts instead */
  retryCount?: number
  /** @deprecated Use customHeaders instead */
  headers?: Record<string, unknown> | null
}

export interface CreateWebhookInput {
  name: string
  url: string
  events?: string[]
  headers?: Record<string, string>
  secret?: string
  retryCount?: number
  timeout?: number
  /** Retry configuration */
  retries?: {
    attempts?: number
    delaySeconds?: number
    policy?: 'linear' | 'exponential' | 'constant'
  }
  /** Custom headers to send with webhook */
  customHeaders?: Array<{ name: string; value: string }>
}

export interface WebhookLog {
  id: string
  event: string
  payload: unknown
  statusCode: number | null
  response: string | null
  error: string | null
  duration: number | null
  attempts: number
  success: boolean
  createdAt: string
}

export const sessionApi = {
  list: async (): Promise<Session[]> => {
    const response = await api.get<ApiResponse<Session[]>>('/sessions')
    return response.data.data
  },

  get: async (sessionId: string): Promise<Session> => {
    const response = await api.get<ApiResponse<Session>>(`/sessions/${sessionId}`)
    return response.data.data
  },

  create: async (data: CreateSessionInput): Promise<Session> => {
    const response = await api.post<ApiResponse<Session>>('/sessions', data)
    return response.data.data
  },

  update: async (sessionId: string, data: UpdateSessionInput): Promise<Session> => {
    const response = await api.patch<ApiResponse<Session>>(`/sessions/${sessionId}`, data)
    return response.data.data
  },

  delete: async (sessionId: string): Promise<void> => {
    await api.delete(`/sessions/${sessionId}`)
  },

  /** Get QR code with optional format (image or raw) */
  getQR: async (sessionId: string, format: 'image' | 'raw' = 'image'): Promise<QRCodeResponse> => {
    const response = await api.get<ApiResponse<QRCodeResponse>>(
      `/sessions/${sessionId}/qr`,
      { params: { format } }
    )
    return response.data.data
  },

  /** Get QR code from auth endpoint - SIMPLIFIED version
   * 
   * This is the recommended endpoint for getting QR codes.
   * Design follows best practices from WAHA, wwebjs-api, and open-wa.
   * 
   * IMPORTANT FOR FRONTEND:
   * - Primary: Use WebSocket for realtime QR updates
   * - Fallback: Use this endpoint with polling
   * - For restart: Call sessionApi.restart() explicitly
   * 
   * @param sessionId - Session ID
   * @param options - QR options
   * @returns QR response with status and QR code (if available)
   * 
   * @example
   * // Basic - get current state
   * const result = await sessionApi.getAuthQR(sessionId)
   * 
   * @example
   * // With brief wait for session to initialize
   * const result = await sessionApi.getAuthQR(sessionId, { wait: true })
   */
  getAuthQR: async (sessionId: string, options?: SmartQROptions): Promise<SmartQRResponse> => {
    const params: Record<string, string> = {}
    if (options?.format) params.format = options.format
    if (options?.wait) params.wait = 'true'
    if (options?.timeout) params.timeout = String(options.timeout)
    
    const response = await api.get<ApiResponse<SmartQRResponse>>(
      `/sessions/${sessionId}/auth/qr`,
      { params }
    )
    return response.data.data
  },

  /** Request pairing code for phone number authentication (alternative to QR) */
  requestPairingCode: async (sessionId: string, data: RequestCodeInput): Promise<PairingCodeResponse> => {
    const response = await api.post<ApiResponse<PairingCodeResponse>>(
      `/sessions/${sessionId}/auth/request-code`,
      data
    )
    return response.data.data
  },

  /** Get authenticated user information */
  getMeInfo: async (sessionId: string): Promise<MeInfo> => {
    const response = await api.get<ApiResponse<MeInfo>>(`/sessions/${sessionId}/me`)
    return response.data.data
  },

  getStatus: async (sessionId: string): Promise<{ id: string; name: string; status: string; isOnline: boolean; phoneNumber: string | null; pushName: string | null }> => {
    const response = await api.get<ApiResponse<{ id: string; name: string; status: string; isOnline: boolean; phoneNumber: string | null; pushName: string | null }>>(
      `/sessions/${sessionId}/status`
    )
    return response.data.data
  },

  restart: async (sessionId: string): Promise<{ status: string; message: string }> => {
    const response = await api.post<ApiResponse<{ status: string; message: string }>>(
      `/sessions/${sessionId}/restart`
    )
    return response.data.data
  },

  logout: async (sessionId: string): Promise<{ status: string; message: string }> => {
    const response = await api.post<ApiResponse<{ status: string; message: string }>>(
      `/sessions/${sessionId}/logout`
    )
    return response.data.data
  },

  // Webhooks
  getWebhooks: async (sessionId: string): Promise<Webhook[]> => {
    const response = await api.get<ApiResponse<Webhook[]>>(`/sessions/${sessionId}/webhooks`)
    return response.data.data
  },

  createWebhook: async (sessionId: string, data: CreateWebhookInput): Promise<Webhook> => {
    const response = await api.post<ApiResponse<Webhook>>(`/sessions/${sessionId}/webhooks`, data)
    return response.data.data
  },

  updateWebhook: async (sessionId: string, webhookId: string, data: Partial<CreateWebhookInput & { isActive: boolean }>): Promise<Webhook> => {
    const response = await api.patch<ApiResponse<Webhook>>(`/sessions/${sessionId}/webhooks/${webhookId}`, data)
    return response.data.data
  },

  deleteWebhook: async (sessionId: string, webhookId: string): Promise<void> => {
    await api.delete(`/sessions/${sessionId}/webhooks/${webhookId}`)
  },

  testWebhook: async (sessionId: string, webhookId: string): Promise<{ success: boolean; statusCode?: number; response?: string; error?: string; duration: number }> => {
    const response = await api.post<ApiResponse<{ success: boolean; statusCode?: number; response?: string; error?: string; duration: number }>>(
      `/sessions/${sessionId}/webhooks/${webhookId}/test`
    )
    return response.data.data
  },

  getWebhookLogs: async (sessionId: string, webhookId: string, limit?: number): Promise<WebhookLog[]> => {
    const response = await api.get<ApiResponse<WebhookLog[]>>(
      `/sessions/${sessionId}/webhooks/${webhookId}/logs`,
      { params: { limit } }
    )
    return response.data.data
  },

  // Messages
  sendMessage: async (sessionId: string, data: { to: string; message: string }): Promise<{ messageId: string; to: string; timestamp: number }> => {
    const response = await api.post<ApiResponse<{ messageId: string; to: string; timestamp: number }>>(
      `/sessions/${sessionId}/messages/send`,
      data
    )
    return response.data.data
  },

  checkNumber: async (sessionId: string, number: string): Promise<{ number: string; isRegistered: boolean }> => {
    const response = await api.get<ApiResponse<{ number: string; isRegistered: boolean }>>(
      `/sessions/${sessionId}/check-number/${number}`
    )
    return response.data.data
  },
}
