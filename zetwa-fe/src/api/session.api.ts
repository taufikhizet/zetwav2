import { api, type ApiResponse } from '@/lib/api'

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
}

export interface Webhook {
  id: string
  name: string
  url: string
  events: string[]
  isActive: boolean
  secret?: string | null
  retryCount: number
  timeout: number
  createdAt: string
  _count?: {
    logs: number
  }
}

export interface CreateWebhookInput {
  name: string
  url: string
  events?: string[]
  headers?: Record<string, string>
  secret?: string
  retryCount?: number
  timeout?: number
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

  update: async (sessionId: string, data: Partial<CreateSessionInput>): Promise<Session> => {
    const response = await api.patch<ApiResponse<Session>>(`/sessions/${sessionId}`, data)
    return response.data.data
  },

  delete: async (sessionId: string): Promise<void> => {
    await api.delete(`/sessions/${sessionId}`)
  },

  getQR: async (sessionId: string): Promise<{ status: string; qrCode: string | null; message?: string }> => {
    const response = await api.get<ApiResponse<{ status: string; qrCode: string | null; message?: string }>>(
      `/sessions/${sessionId}/qr`
    )
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
