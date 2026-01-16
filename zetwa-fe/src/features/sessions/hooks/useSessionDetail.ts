import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { sessionApi, type UpdateSessionInput } from '../api/session.api'
import { extractErrorMessage } from '@/lib/utils'

export function useSessionDetail(sessionId: string | undefined) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // ============================================
  // STATE
  // ============================================
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [sendOpen, setSendOpen] = useState(false)
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  
  // Send message form
  const [messageForm, setMessageForm] = useState({ to: '', message: '' })

  // ============================================
  // QUERIES
  // ============================================
  const { data: session, isLoading } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => sessionApi.get(sessionId!),
    enabled: !!sessionId,
    refetchInterval: 3000,
  })

  const { data: webhooks = [] } = useQuery({
    queryKey: ['webhooks', sessionId],
    queryFn: () => sessionApi.getWebhooks(sessionId!),
    enabled: !!sessionId,
  })

  // ============================================
  // MUTATIONS
  // ============================================
  const restartMutation = useMutation({
    mutationFn: () => sessionApi.restart(sessionId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
      queryClient.invalidateQueries({ queryKey: ['session-qr', sessionId] })
      toast.success('Session restarting...')
    },
    onError: () => {
      toast.error('Failed to restart session')
    },
  })

  const logoutMutation = useMutation({
    mutationFn: () => sessionApi.logout(sessionId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
      toast.success('Logged out successfully')
      setLogoutOpen(false)
    },
    onError: () => toast.error('Failed to logout'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => sessionApi.delete(sessionId!),
    onSuccess: () => {
      toast.success('Session deleted')
      navigate('/dashboard/sessions')
    },
    onError: (error) => toast.error(extractErrorMessage(error, 'Failed to delete session')),
  })

  const updateMutation = useMutation({
    mutationFn: (data: UpdateSessionInput) => sessionApi.update(sessionId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
      toast.success('Session updated successfully')
    },
    onError: (error) => toast.error(extractErrorMessage(error, 'Failed to update session')),
  })

  const pairingCodeMutation = useMutation({
    mutationFn: (phoneNumber: string) => sessionApi.requestPairingCode(sessionId!, { phoneNumber }),
    onSuccess: (data) => {
      setPairingCode(data.code)
      toast.success('Pairing code generated')
    },
    onError: (error) => toast.error(extractErrorMessage(error, 'Failed to get pairing code')),
  })

  const sendMessageMutation = useMutation({
    mutationFn: () => sessionApi.sendMessage(sessionId!, messageForm),
    onSuccess: () => {
      toast.success('Message sent!')
      setSendOpen(false)
      setMessageForm({ to: '', message: '' })
    },
    onError: (error) => toast.error(extractErrorMessage(error, 'Failed to send message')),
  })

  // Webhook mutations
  const createWebhookMutation = useMutation({
    mutationFn: (data: Parameters<typeof sessionApi.createWebhook>[1]) => 
      sessionApi.createWebhook(sessionId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', sessionId] })
      toast.success('Webhook created')
    },
    onError: (error) => toast.error(extractErrorMessage(error, 'Failed to create webhook')),
  })

  const updateWebhookMutation = useMutation({
    mutationFn: ({ webhookId, data }: { webhookId: string; data: Parameters<typeof sessionApi.updateWebhook>[2] }) =>
      sessionApi.updateWebhook(sessionId!, webhookId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', sessionId] })
      toast.success('Webhook updated')
    },
    onError: (error) => toast.error(extractErrorMessage(error, 'Failed to update webhook')),
  })

  const deleteWebhookMutation = useMutation({
    mutationFn: (webhookId: string) => sessionApi.deleteWebhook(sessionId!, webhookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', sessionId] })
      toast.success('Webhook deleted')
    },
    onError: (error) => toast.error(extractErrorMessage(error, 'Failed to delete webhook')),
  })

  const testWebhookMutation = useMutation({
    mutationFn: (webhookId: string) => sessionApi.testWebhook(sessionId!, webhookId),
  })

  return {
    session,
    webhooks,
    isLoading,
    
    // UI State
    deleteOpen, setDeleteOpen,
    logoutOpen, setLogoutOpen,
    sendOpen, setSendOpen,
    pairingCode, setPairingCode,
    messageForm, setMessageForm,

    // Mutations
    restartMutation,
    logoutMutation,
    deleteMutation,
    updateMutation,
    pairingCodeMutation,
    sendMessageMutation,
    createWebhookMutation,
    updateWebhookMutation,
    deleteWebhookMutation,
    testWebhookMutation,
  }
}
