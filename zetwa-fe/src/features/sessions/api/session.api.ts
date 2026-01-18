import { api, type ApiResponse } from '@/lib/api'
import type { 
  Session, 
  CreateSessionInput, 
  UpdateSessionInput
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
  retryAttempts: number
  retryDelay: number
  retryPolicy: string
  timeout: number
  customHeaders?: Array<{ name: string; value: string }> | null
  retries?: {
    attempts: number
    delaySeconds: number
    policy: string
  }
  createdAt: string
  _count?: {
    logs: number
  }
  retryCount?: number
  headers?: Record<string, unknown> | null
}

export interface CreateWebhookInput {
  name: string
  url: string
  events?: string[]
  headers?: Record<string, string>
  secret?: string
  timeout?: number
  retries?: {
    attempts?: number
    delaySeconds?: number
    policy?: 'linear' | 'exponential' | 'constant'
  }
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

  // Messages
  sendMessage: async (sessionId: string, data: { to: string; message: string; linkPreview?: boolean; reply_to?: string }): Promise<any> => {
    const response = await api.post(`/sessions/${sessionId}/messages/send`, data)
    return response.data
  },

  sendMedia: async (sessionId: string, data: { to: string; mediaUrl?: string; mediaBase64?: string; mimetype?: string; filename?: string; caption?: string; reply_to?: string }): Promise<any> => {
    const response = await api.post(`/sessions/${sessionId}/messages/send-media`, data)
    return response.data
  },

  forwardMessage: async (sessionId: string, data: { messageId: string; to: string }): Promise<any> => {
    const response = await api.post(`/sessions/${sessionId}/messages/forward`, data)
    return response.data
  },

  deleteMessage: async (sessionId: string, messageId: string, forEveryone: boolean = true): Promise<any> => {
    const response = await api.delete(`/sessions/${sessionId}/messages/${messageId}`, {
      params: { forEveryone }
    })
    return response.data
  },

  getMessages: async (sessionId: string, params: { page?: number; limit?: number; chatId?: string; direction?: string } = {}): Promise<any> => {
    const response = await api.get(`/sessions/${sessionId}/messages`, { params })
    return response.data.data
  },

  downloadMessageMedia: async (sessionId: string, messageId: string): Promise<any> => {
    const response = await api.get(`/sessions/${sessionId}/messages/${messageId}/download`)
    return response.data
  },

  // Chats
  getChats: async (sessionId: string, live: boolean = false): Promise<any[]> => {
    const endpoint = live ? `/sessions/${sessionId}/chats/live` : `/sessions/${sessionId}/chats`
    const response = await api.get<ApiResponse<any[]>>(endpoint)
    return response.data.data
  },

  archiveChat: async (sessionId: string, chatId: string, archive: boolean): Promise<void> => {
    await api.post(`/sessions/${sessionId}/chats/${chatId}/archive`, { archive })
  },

  deleteChat: async (sessionId: string, chatId: string): Promise<void> => {
    await api.delete(`/sessions/${sessionId}/chats/${chatId}`)
  },

  pinChat: async (sessionId: string, chatId: string, pin: boolean): Promise<void> => {
    await api.post(`/sessions/${sessionId}/chats/${chatId}/pin`, { pin })
  },

  muteChat: async (sessionId: string, chatId: string, duration?: string): Promise<void> => {
    await api.post(`/sessions/${sessionId}/chats/${chatId}/mute`, { duration })
  },

  unmuteChat: async (sessionId: string, chatId: string): Promise<void> => {
    await api.post(`/sessions/${sessionId}/chats/${chatId}/unmute`)
  },

  markChatRead: async (sessionId: string, chatId: string, read: boolean): Promise<void> => {
    await api.post(`/sessions/${sessionId}/chats/${chatId}/mark-read`, { read })
  },

  // Contacts
  getContacts: async (sessionId: string, live: boolean = false): Promise<any[]> => {
    const endpoint = live ? `/sessions/${sessionId}/contacts/live` : `/sessions/${sessionId}/contacts`
    const response = await api.get<ApiResponse<any[]>>(endpoint)
    return response.data.data
  },

  blockContact: async (sessionId: string, contactId: string, block: boolean): Promise<void> => {
    await api.post(`/sessions/${sessionId}/contacts/${contactId}/block`, { block })
  },

  checkNumber: async (sessionId: string, number: string): Promise<any> => {
    const response = await api.get(`/sessions/${sessionId}/check-number/${number}`)
    return response.data.data
  },

  getContactAbout: async (sessionId: string, contactId: string): Promise<string | null> => {
    const response = await api.get(`/sessions/${sessionId}/contacts/${contactId}/about`)
    return response.data.data.about
  },

  getContactProfilePicture: async (sessionId: string, contactId: string): Promise<string | null> => {
    const response = await api.get(`/sessions/${sessionId}/contacts/${contactId}/profile-picture`)
    return response.data.data.profilePicUrl
  },

  getMe: async (sessionId: string): Promise<any> => {
    const response = await api.get(`/sessions/${sessionId}/me`)
    return response.data.data
  },

  // Groups
  getGroups: async (sessionId: string): Promise<any[]> => {
    const response = await api.get<ApiResponse<any[]>>(`/sessions/${sessionId}/groups`)
    return response.data.data
  },

  getGroupInviteCode: async (sessionId: string, groupId: string): Promise<string> => {
    const response = await api.get(`/sessions/${sessionId}/groups/${groupId}/invite-code`)
    return response.data.data.code
  },

  revokeGroupInviteCode: async (sessionId: string, groupId: string): Promise<string> => {
    const response = await api.post(`/sessions/${sessionId}/groups/${groupId}/invite-code/revoke`)
    return response.data.data.newCode
  },

  joinGroup: async (sessionId: string, code: string): Promise<string> => {
    const response = await api.post(`/sessions/${sessionId}/groups/join`, { code })
    return response.data.data.groupId
  },

  getGroup: async (sessionId: string, groupId: string): Promise<any> => {
    const response = await api.get<ApiResponse<any>>(`/sessions/${sessionId}/groups/${groupId}`)
    return response.data.data
  },

  createGroup: async (sessionId: string, data: { name: string; participants: string[] }): Promise<any> => {
    const response = await api.post<ApiResponse<any>>(`/sessions/${sessionId}/groups`, data)
    return response.data.data
  },

  // Chat Actions
  clearChat: async (sessionId: string, chatId: string): Promise<void> => {
    await api.post(`/sessions/${sessionId}/chats/${chatId}/clear`)
  },

  // Session Actions
  getScreenshot: async (sessionId: string): Promise<Blob> => {
    const response = await api.get(`/sessions/${sessionId}/screenshot`, { responseType: 'blob' })
    return response.data
  },

  // Presence
  setPresence: async (sessionId: string, data: { presence: string; chatId?: string }): Promise<void> => {
    await api.post(`/sessions/${sessionId}/presence`, data)
  },

  subscribePresence: async (sessionId: string, contactId: string): Promise<any> => {
    const response = await api.post(`/sessions/${sessionId}/presence/subscribe`, { contactId })
    return response.data
  },

  getPresence: async (sessionId: string, contactId: string): Promise<any> => {
    const response = await api.get(`/sessions/${sessionId}/presence/${contactId}`)
    return response.data.data
  },

  // Extended Messages
  sendLocation: async (sessionId: string, data: { to: string; latitude: number; longitude: number; description?: string; url?: string; reply_to?: string }): Promise<any> => {
    const response = await api.post(`/sessions/${sessionId}/messages/send-location`, data)
    return response.data
  },

  sendContact: async (sessionId: string, data: { to: string; contact: { name: string; phone: string; organization?: string; email?: string }; reply_to?: string }): Promise<any> => {
    const response = await api.post(`/sessions/${sessionId}/messages/send-contact`, data)
    return response.data
  },

  sendPoll: async (sessionId: string, data: { to: string; poll: { name: string; options: string[]; multipleAnswers?: boolean }; reply_to?: string }): Promise<any> => {
    const response = await api.post(`/sessions/${sessionId}/messages/send-poll`, data)
    return response.data
  },

  sendPollVote: async (sessionId: string, data: { to: string; pollMessageId: string; selectedOptions: string[] }): Promise<any> => {
    const response = await api.post(`/sessions/${sessionId}/messages/poll-vote`, data)
    return response.data
  },

  sendButtons: async (sessionId: string, data: { to: string; body: string; buttons: { id: string; text: string }[]; title?: string; footer?: string; reply_to?: string }): Promise<any> => {
    const response = await api.post(`/sessions/${sessionId}/messages/send-buttons`, data)
    return response.data
  },

  sendList: async (sessionId: string, data: { to: string; body: string; buttonText: string; sections: { title: string; rows: { id: string; title: string; description?: string }[] }[]; title?: string; footer?: string; reply_to?: string }): Promise<any> => {
    const response = await api.post(`/sessions/${sessionId}/messages/send-list`, data)
    return response.data
  },

  sendReaction: async (sessionId: string, data: { messageId: string; reaction: string }): Promise<any> => {
    const response = await api.post(`/sessions/${sessionId}/messages/reaction`, data)
    return response.data
  },

  starMessage: async (sessionId: string, messageId: string, star: boolean = true): Promise<any> => {
    const response = await api.post(`/sessions/${sessionId}/messages/${messageId}/star`, { star })
    return response.data
  },

  editMessage: async (sessionId: string, messageId: string, newContent: string): Promise<any> => {
    const response = await api.patch(`/sessions/${sessionId}/messages/${messageId}`, { newContent })
    return response.data
  },

  // Presence Helpers
  sendTyping: async (sessionId: string, chatId: string): Promise<void> => {
    await api.post(`/sessions/${sessionId}/presence/typing/${chatId}`)
  },

  stopTyping: async (sessionId: string, chatId: string): Promise<void> => {
    await api.delete(`/sessions/${sessionId}/presence/typing/${chatId}`)
  },

  // Labels
  getLabels: async (sessionId: string): Promise<any[]> => {
    const response = await api.get<ApiResponse<any[]>>(`/sessions/${sessionId}/labels`)
    return response.data.data
  },

  createLabel: async (sessionId: string, data: { name: string; color?: string }): Promise<any> => {
    const response = await api.post<ApiResponse<any>>(`/sessions/${sessionId}/labels`, data)
    return response.data.data
  },

  updateLabel: async (sessionId: string, labelId: string, data: { name?: string; color?: string }): Promise<any> => {
    const response = await api.patch<ApiResponse<any>>(`/sessions/${sessionId}/labels/${labelId}`, data)
    return response.data.data
  },

  deleteLabel: async (sessionId: string, labelId: string): Promise<void> => {
    await api.delete(`/sessions/${sessionId}/labels/${labelId}`)
  },

  getChatsByLabel: async (sessionId: string, labelId: string): Promise<any[]> => {
    const response = await api.get<ApiResponse<any[]>>(`/sessions/${sessionId}/labels/${labelId}/chats`)
    return response.data.data
  },

  assignLabel: async (sessionId: string, data: { labelId: string; chatId: string }): Promise<void> => {
    await api.post(`/sessions/${sessionId}/labels/assign`, data)
  },

  unassignLabel: async (sessionId: string, data: { labelId: string; chatId: string }): Promise<void> => {
    await api.post(`/sessions/${sessionId}/labels/unassign`, data)
  },

  // Status
  getContactStatuses: async (sessionId: string): Promise<any[]> => {
    const response = await api.get<ApiResponse<any[]>>(`/sessions/${sessionId}/status/contacts`)
    return response.data.data
  },

  postTextStatus: async (sessionId: string, data: { text: string; backgroundColor?: string; font?: number }): Promise<any> => {
    const response = await api.post(`/sessions/${sessionId}/status/text`, data)
    return response.data
  },

  postMediaStatus: async (sessionId: string, data: { mediaUrl?: string; mediaBase64?: string; mimetype: string; caption?: string }): Promise<any> => {
    const response = await api.post(`/sessions/${sessionId}/status/media`, data)
    return response.data
  },

  // Profile
  getProfile: async (sessionId: string): Promise<any> => {
    const response = await api.get<ApiResponse<any>>(`/sessions/${sessionId}/profile`)
    return response.data.data
  },

  requestPairingCode: async (sessionId: string, data: { phoneNumber: string }): Promise<{ code: string }> => {
    const response = await api.post<ApiResponse<{ code: string }>>(`/sessions/${sessionId}/pairing-code`, data)
    return response.data.data
  },

  getQR: async (sessionId: string, format: 'image' | 'raw' = 'image'): Promise<any> => {
    const response = await api.get(
      `/sessions/${sessionId}/qr`,
      { params: { format } }
    )
    return response.data.data
  },

  getAuthQR: async (sessionId: string, params: { format?: 'image' | 'raw' } = {}): Promise<any> => {
    const response = await api.get(
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
