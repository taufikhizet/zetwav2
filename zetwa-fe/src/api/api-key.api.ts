import { api, type ApiResponse } from '@/lib/api'

export interface ApiKey {
  id: string
  name: string
  key: string
  keyPreview: string
  permissions: string[]
  scopes: string[]
  isActive: boolean
  lastUsedAt: string | null
  expiresAt: string | null
  createdAt: string
}

export interface CreateApiKeyInput {
  name: string
  permissions?: string[]
  scopes?: string[]
  expiresAt?: string
}

export const apiKeyApi = {
  list: async (): Promise<ApiKey[]> => {
    const response = await api.get<ApiResponse<ApiKey[]>>('/api-keys')
    return response.data.data
  },

  get: async (keyId: string): Promise<ApiKey> => {
    const response = await api.get<ApiResponse<ApiKey>>(`/api-keys/${keyId}`)
    return response.data.data
  },

  create: async (data: CreateApiKeyInput): Promise<ApiKey> => {
    const response = await api.post<ApiResponse<ApiKey>>('/api-keys', data)
    return response.data.data
  },

  update: async (keyId: string, data: { name?: string; isActive?: boolean }): Promise<ApiKey> => {
    const response = await api.patch<ApiResponse<ApiKey>>(`/api-keys/${keyId}`, data)
    return response.data.data
  },

  delete: async (keyId: string): Promise<void> => {
    await api.delete(`/api-keys/${keyId}`)
  },

  regenerate: async (keyId: string): Promise<ApiKey> => {
    const response = await api.post<ApiResponse<ApiKey>>(`/api-keys/${keyId}/regenerate`)
    return response.data.data
  },
}
