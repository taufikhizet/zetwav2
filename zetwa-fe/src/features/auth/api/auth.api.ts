import { api, type ApiResponse } from '@/lib/api'
import type { User } from '@/stores/auth.store'

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  email: string
  password: string
  name: string
}

export const authApi = {
  login: async (data: LoginInput): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', data)
    return response.data.data
  },

  register: async (data: RegisterInput): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data)
    return response.data.data
  },

  logout: async (refreshToken: string): Promise<void> => {
    await api.post('/auth/logout', { refreshToken })
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>('/auth/profile')
    return response.data.data
  },

  updateProfile: async (data: { name: string; email: string }): Promise<User> => {
    const response = await api.patch<ApiResponse<User>>('/auth/profile', data)
    return response.data.data
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<void> => {
    await api.post('/auth/change-password', data)
  },

  refreshTokens: async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
    const response = await api.post<ApiResponse<{ accessToken: string; refreshToken: string }>>('/auth/refresh', {
      refreshToken,
    })
    return response.data.data
  },

  verifyEmail: async (token: string): Promise<void> => {
    await api.post('/auth/verify-email', { token })
  },

  resendVerification: async (): Promise<void> => {
    await api.post('/auth/resend-verification')
  },

  socialLogin: async (provider: 'google' | 'github', token: string): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/social', { provider, token })
    return response.data.data
  },

  completeOnboarding: async (data: { profession: string; usagePurpose: string; referralSource: string }): Promise<void> => {
    await api.post('/auth/onboarding', data)
  },
}
