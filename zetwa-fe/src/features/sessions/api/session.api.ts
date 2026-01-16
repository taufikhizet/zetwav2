import { api, type ApiResponse } from '@/lib/api'
import type { 
  Session, 
  CreateSessionInput, 
  UpdateSessionInput, 
  QRCodeResponse, 
} from '../types/session.types'

// Re-export types for convenience
export type { Session, CreateSessionInput, UpdateSessionInput, SessionConfig } from '../types/session.types'

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

  restart: async (sessionId: string): Promise<void> => {
    await api.post(`/sessions/${sessionId}/restart`)
  },

  logout: async (sessionId: string): Promise<void> => {
    await api.post(`/sessions/${sessionId}/logout`)
  },

  sendMessage: async (sessionId: string, data: { to: string; message: string }): Promise<void> => {
    await api.post(`/sessions/${sessionId}/messages`, data)
  },

  requestPairingCode: async (sessionId: string, data: { phoneNumber: string }): Promise<{ code: string }> => {
    const response = await api.post<ApiResponse<{ code: string }>>(`/sessions/${sessionId}/pairing-code`, data)
    return response.data.data
  },

  /** Get QR code with optional format (image or raw) */
  getQR: async (sessionId: string, format: 'image' | 'raw' = 'image'): Promise<QRCodeResponse> => {
    const response = await api.get<ApiResponse<QRCodeResponse>>(
      `/sessions/${sessionId}/qr`,
      { params: { format } }
    )
    return response.data.data
  },

  /** 
   * Get QR code from auth endpoint - SIMPLIFIED version
   * This is the recommended endpoint for getting QR codes.
   */
  getAuthQR: async (sessionId: string, params: { format?: 'image' | 'raw' } = {}): Promise<QRCodeResponse> => {
    const response = await api.get<ApiResponse<QRCodeResponse>>(
      `/sessions/${sessionId}/qr`,
      { params }
    )
    return response.data.data
  },

  // Webhook operations
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

  testWebhook: async (sessionId: string, webhookId: string): Promise<{ success: boolean; statusCode?: number; duration: number; error?: string }> => {
    const response = await api.post<ApiResponse<{ success: boolean; statusCode?: number; duration: number; error?: string }>>(`/sessions/${sessionId}/webhooks/${webhookId}/test`)
    return response.data.data
  }
}
