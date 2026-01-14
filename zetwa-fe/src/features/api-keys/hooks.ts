/**
 * API Keys Feature - React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiKeyApi } from '@/api/api-key.api'
import type { ApiKey, CreateApiKeyInput, UpdateApiKeyInput } from './types'

// Query keys
export const apiKeyKeys = {
  all: ['apiKeys'] as const,
  list: () => [...apiKeyKeys.all] as const,
  stats: () => [...apiKeyKeys.all, 'stats'] as const,
  detail: (id: string) => [...apiKeyKeys.all, id] as const,
}

/**
 * Hook to fetch all API keys
 */
export function useApiKeys() {
  return useQuery({
    queryKey: apiKeyKeys.list(),
    queryFn: apiKeyApi.list,
  })
}

/**
 * Hook to fetch API key statistics
 */
export function useApiKeyStats() {
  return useQuery({
    queryKey: apiKeyKeys.stats(),
    queryFn: apiKeyApi.getStats,
  })
}

/**
 * Hook to create a new API key
 */
export function useCreateApiKey(options?: {
  onSuccess?: (data: ApiKey) => void
  onError?: (error: Error) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateApiKeyInput) => apiKeyApi.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: apiKeyKeys.all })
      toast.success('API key created successfully')
      options?.onSuccess?.(data)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create API key')
      options?.onError?.(error)
    },
  })
}

/**
 * Hook to update an API key
 */
export function useUpdateApiKey(options?: {
  onSuccess?: (data: ApiKey) => void
  onError?: (error: Error) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateApiKeyInput }) =>
      apiKeyApi.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: apiKeyKeys.all })
      toast.success('API key updated')
      options?.onSuccess?.(data)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update API key')
      options?.onError?.(error)
    },
  })
}

/**
 * Hook to update API key scopes
 */
export function useUpdateApiKeyScopes(options?: {
  onSuccess?: (data: ApiKey) => void
  onError?: (error: Error) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, scopes }: { id: string; scopes: string[] }) =>
      apiKeyApi.updateScopes(id, scopes),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: apiKeyKeys.all })
      toast.success('Scopes updated')
      options?.onSuccess?.(data)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update scopes')
      options?.onError?.(error)
    },
  })
}

/**
 * Hook to delete an API key
 */
export function useDeleteApiKey(options?: {
  onSuccess?: () => void
  onError?: (error: Error) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiKeyApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeyKeys.all })
      toast.success('API key deleted')
      options?.onSuccess?.()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete API key')
      options?.onError?.(error)
    },
  })
}

/**
 * Hook to regenerate an API key
 */
export function useRegenerateApiKey(options?: {
  onSuccess?: (data: ApiKey) => void
  onError?: (error: Error) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiKeyApi.regenerate(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: apiKeyKeys.all })
      toast.success('API key regenerated')
      options?.onSuccess?.(data)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to regenerate API key')
      options?.onError?.(error)
    },
  })
}

/**
 * Hook to revoke all API keys
 */
export function useRevokeAllApiKeys(options?: {
  onSuccess?: (data: { revokedCount: number }) => void
  onError?: (error: Error) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => apiKeyApi.revokeAll(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: apiKeyKeys.all })
      toast.success(`${data.revokedCount} API key(s) revoked`)
      options?.onSuccess?.(data)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to revoke API keys')
      options?.onError?.(error)
    },
  })
}
