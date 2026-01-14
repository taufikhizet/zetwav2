/**
 * Session Detail Page - Comprehensive session management
 * Uses modular components from @/components/session
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Loader2,
  Wifi,
  Webhook,
  Settings,
  Info,
  Send,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { sessionApi, type UpdateSessionInput } from '@/api/session.api'
import {
  SessionHeader,
  QRCodeSection,
  SessionSettingsTab,
  SessionInfoTab,
  WebhooksTab,
} from '@/components/session'
import { connectSocket, subscribeToSession, unsubscribeFromSession } from '@/lib/socket'
import { formatRelativeTime } from '@/lib/utils'

/**
 * Extract error message from API error response
 */
function extractErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object') {
    const axiosError = error as { 
      response?: { 
        data?: { 
          error?: { 
            message?: string
            details?: Array<{ field: string; message: string }> 
          } 
        } 
      }
      message?: string 
    }
    const apiError = axiosError.response?.data?.error
    
    if (apiError) {
      if (apiError.details && Array.isArray(apiError.details) && apiError.details.length > 0) {
        const detail = apiError.details[0]
        return `${detail.message}${detail.field ? ` (${detail.field})` : ''}`
      }
      if (apiError.message) {
        return apiError.message
      }
    }
    if (axiosError.message) {
      return axiosError.message
    }
  }
  if (error instanceof Error) {
    return error.message
  }
  return fallback
}

export default function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // ============================================
  // STATE
  // ============================================
  
  // QR/Auth state
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [isRestarting, setIsRestarting] = useState(false)
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  
  // Dialog states
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [sendOpen, setSendOpen] = useState(false)
  
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
  // SOCKET & QR HANDLING
  // ============================================

  const handleNewQR = useCallback((qr: string) => {
    setQrCode(qr)
    setIsRestarting(false)
  }, [])

  useEffect(() => {
    if (!sessionId) return

    const socket = connectSocket()
    subscribeToSession(sessionId)

    socket.on('session:qr', (data: { sessionId: string; qr: string }) => {
      if (data.sessionId === sessionId) {
        handleNewQR(data.qr)
      }
    })

    socket.on('session:ready', (data: { sessionId: string }) => {
      if (data.sessionId === sessionId) {
        toast.success('WhatsApp connected successfully!')
        setQrCode(null)
        queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
      }
    })

    socket.on('session:disconnected', (data: { sessionId: string }) => {
      if (data.sessionId === sessionId) {
        setQrCode(null)
        queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
      }
    })

    socket.on('session:qr_timeout', (data: { sessionId: string }) => {
      if (data.sessionId === sessionId) {
        setQrCode(null)
        queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
        toast.error('QR code expired. The session will try to get a new one.')
      }
    })

    socket.on('session:auth_failure', (data: { sessionId: string }) => {
      if (data.sessionId === sessionId) {
        setQrCode(null)
        queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
        toast.error('Authentication failed')
      }
    })

    return () => {
      unsubscribeFromSession(sessionId)
    }
  }, [sessionId, queryClient, handleNewQR])

  // Sync QR from session data (initial load)
  useEffect(() => {
    if (isRestarting) return
    
    const status = session?.liveStatus || session?.status
    if (['FAILED', 'DISCONNECTED', 'LOGGED_OUT'].includes(status || '')) {
      setQrCode(null)
      return
    }

    // If session has QR code and we don't have one yet, use it
    if (session?.qrCode && !qrCode) {
      handleNewQR(session.qrCode)
    }
  }, [session?.qrCode, session?.liveStatus, session?.status, qrCode, isRestarting, handleNewQR])

  // ============================================
  // MUTATIONS
  // ============================================

  const restartMutation = useMutation({
    mutationFn: () => sessionApi.restart(sessionId!),
    onMutate: () => {
      setIsRestarting(true)
      setQrCode(null)
      setPairingCode(null)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
      queryClient.invalidateQueries({ queryKey: ['session-qr', sessionId] })
      toast.success('Session restarting...')
    },
    onError: () => {
      setIsRestarting(false)
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

  // ============================================
  // LOADING STATE
  // ============================================

  if (isLoading || !session) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // ============================================
  // DERIVED STATE
  // ============================================

  const status = (session.liveStatus || session.status) as string
  const isConnected = session.isOnline || status === 'CONNECTED' || status === 'WORKING'

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <SessionHeader
        session={session}
        onRestart={() => restartMutation.mutate()}
        onLogout={() => setLogoutOpen(true)}
        onDelete={() => setDeleteOpen(true)}
        onSendMessage={() => setSendOpen(true)}
        isRestartPending={restartMutation.isPending}
      />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* QR/Auth Section - Always show when not connected */}
        {!isConnected && (
          <QRCodeSection
            sessionId={sessionId!}
            status={status as any}
            socketQR={qrCode}
            sessionQR={session?.qrCode}
            isConnected={isConnected}
            isRestarting={isRestarting}
            onRestart={() => restartMutation.mutate()}
            isRestartPending={restartMutation.isPending}
            onRequestPairingCode={(phone) => pairingCodeMutation.mutate(phone)}
            pairingCode={pairingCode}
            isPairingPending={pairingCodeMutation.isPending}
          />
        )}

        {/* Connected Status Card */}
        {isConnected && (
          <Card className="mb-8 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                  <Wifi className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-green-800 dark:text-green-200">WhatsApp Connected</h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Your session is active and ready to send/receive messages
                  </p>
                </div>
                {session.connectedAt && (
                  <div className="text-right text-sm text-green-700 dark:text-green-300">
                    <p>Connected</p>
                    <p className="font-medium">{formatRelativeTime(session.connectedAt)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="webhooks" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="webhooks" className="gap-2">
              <Webhook className="h-4 w-4" />
              Webhooks ({webhooks.length})
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="info" className="gap-2">
              <Info className="h-4 w-4" />
              Info
            </TabsTrigger>
          </TabsList>

          {/* Webhooks Tab */}
          <TabsContent value="webhooks">
            <WebhooksTab
              webhooks={webhooks}
              onCreateWebhook={async (data) => { await createWebhookMutation.mutateAsync(data) }}
              onUpdateWebhook={async (webhookId, data) => { await updateWebhookMutation.mutateAsync({ webhookId, data }) }}
              onDeleteWebhook={async (webhookId) => { await deleteWebhookMutation.mutateAsync(webhookId) }}
              onTestWebhook={async (webhookId) => await testWebhookMutation.mutateAsync(webhookId)}
              isCreating={createWebhookMutation.isPending}
              isUpdating={updateWebhookMutation.isPending}
              isDeleting={deleteWebhookMutation.isPending}
              isTesting={testWebhookMutation.isPending}
            />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <SessionSettingsTab
              session={session}
              onUpdate={async (data) => { await updateMutation.mutateAsync(data) }}
              isUpdating={updateMutation.isPending}
            />
          </TabsContent>

          {/* Info Tab */}
          <TabsContent value="info">
            <SessionInfoTab session={session} />
          </TabsContent>
        </Tabs>
      </div>

      {/* ============================================ */}
      {/* DIALOGS */}
      {/* ============================================ */}

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{session.name}"? This action cannot be undone and will remove all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logout Dialog */}
      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Logout Session</DialogTitle>
            <DialogDescription>
              This will disconnect WhatsApp from this session. You'll need to scan the QR code again to reconnect.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogoutOpen(false)}>Cancel</Button>
            <Button onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending}>
              {logoutMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Message Dialog */}
      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Message
            </DialogTitle>
            <DialogDescription>
              Send a test message to verify the connection
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Recipient Phone Number</Label>
              <Input
                placeholder="628123456789"
                value={messageForm.to}
                onChange={(e) => setMessageForm({ ...messageForm, to: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Enter phone number with country code (without + or spaces)
              </p>
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Type your message here..."
                value={messageForm.message}
                onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => sendMessageMutation.mutate()} 
              disabled={sendMessageMutation.isPending || !messageForm.to || !messageForm.message}
            >
              {sendMessageMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
