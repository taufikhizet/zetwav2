import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ArrowLeft,
  RefreshCw,
  LogOut,
  Trash2,
  Plus,
  Webhook,
  Send,
  QrCode,
  Phone,
  Loader2,
  Copy,
  Check,
  ExternalLink,
  AlertTriangle,
  XCircle,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { sessionApi } from '@/api/session.api'
import { getStatusColor, getStatusText, formatDate, copyToClipboard } from '@/lib/utils'
import { connectSocket, subscribeToSession, unsubscribeFromSession } from '@/lib/socket'

export default function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // QR Code state - simplified based on whatsapp-web.js best practices
  // WhatsApp auto-regenerates QR, socket delivers new QR automatically
  // No countdown needed - just display QR and wait for socket updates
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  // Flag to prevent race condition when QR expires - stops stale QR from being restored
  const [isQrExpired, setIsQrExpired] = useState(false)
  // Flag to prevent race condition during restart - stops effect from re-setting isQrExpired
  const [isRestarting, setIsRestarting] = useState(false)
  
  // Dialog states
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [restartOpen, setRestartOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [webhookOpen, setWebhookOpen] = useState(false)
  const [editWebhookOpen, setEditWebhookOpen] = useState(false)
  const [sendOpen, setSendOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  // Webhook form
  const [webhookForm, setWebhookForm] = useState({
    name: '',
    url: '',
    events: ['ALL'] as string[],
    secret: '',
  })

  // Edit webhook state
  const [editingWebhook, setEditingWebhook] = useState<{
    id: string
    name: string
    url: string
    events: string[]
    secret: string
    isActive: boolean
  } | null>(null)

  // Send message form
  const [messageForm, setMessageForm] = useState({
    to: '',
    message: '',
  })

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

  // Initialize isQrExpired based on session status on first load
  // This handles page refresh case where status might already be FAILED
  // Also handles case where backend detects stale session (QR_READY but no live session)
  useEffect(() => {
    // Skip this effect while restarting to prevent race condition
    // The restart flow will handle state reset properly
    if (isRestarting) {
      return
    }
    
    if (session) {
      const sessionStatus = session.liveStatus || session.status
      const isFailedState = [
        'FAILED', 
        'QR_TIMEOUT'
      ].includes(sessionStatus)
      
      // Check if session claims to be ready but has no QR code from API
      // This indicates a stale state that should be treated as failed
      // But NOT during restart - status might be INITIALIZING without QR yet
      const isStaleQrState = 
        (sessionStatus === 'QR_READY') && 
        !session.qrCode && 
        !session.isOnline
      
      if ((isFailedState || isStaleQrState) && !isQrExpired) {
        setIsQrExpired(true)
        setQrCode(null)
      }
      
      // Reset isQrExpired if session is now connected or has valid QR
      if (session.isOnline || sessionStatus === 'CONNECTED') {
        if (isQrExpired) {
          setIsQrExpired(false)
        }
      }
      
      // Reset isQrExpired if session is initializing (after restart)
      if (sessionStatus === 'INITIALIZING' && isQrExpired) {
        setIsQrExpired(false)
      }
    }
  }, [session?.liveStatus, session?.status, session?.qrCode, session?.isOnline, isQrExpired, isRestarting])

  // Safety timeout for isRestarting flag
  // If restart takes too long (30s), reset the flag to prevent UI from being stuck
  useEffect(() => {
    if (!isRestarting) return
    
    const timeout = setTimeout(() => {
      console.warn('Restart timeout - resetting isRestarting flag')
      setIsRestarting(false)
      // Don't automatically set expired - let the normal effect handle it
    }, 30000) // 30 seconds timeout
    
    return () => clearTimeout(timeout)
  }, [isRestarting])

  // Handle new QR code from socket or API - simple, just display it
  // Also reset expired/restarting flags since we have a valid new QR
  const handleNewQR = useCallback((qr: string) => {
    setQrCode(qr)
    setIsRefreshing(false)
    setIsQrExpired(false) // New QR means session is active, not expired
    setIsRestarting(false) // Restart completed successfully
  }, [])

  // Socket connection for real-time updates
  useEffect(() => {
    if (!sessionId) return

    const socket = connectSocket()
    subscribeToSession(sessionId)

    socket.on('session:qr', (data: { sessionId: string; qr: string; timestamp: string }) => {
      if (data.sessionId === sessionId) {
        // WhatsApp auto-regenerates QR, just display the new one
        handleNewQR(data.qr)
        // Show toast only if user was waiting
        if (isRefreshing) {
          toast.success('New QR code received!', { duration: 2000 })
        }
      }
    })

    socket.on('session:ready', (data: { sessionId: string }) => {
      if (data.sessionId === sessionId) {
        setQrCode(null)
        setIsQrExpired(false) // Session connected, definitely not expired
        setIsRestarting(false)
        queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
        toast.success('Session connected successfully!')
      }
    })

    socket.on('session:disconnected', (data: { sessionId: string; reason?: string }) => {
      if (data.sessionId === sessionId) {
        queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
        toast.warning('Session disconnected')
      }
    })

    // QR Timeout - user didn't scan in time, session cleaned up
    socket.on('session:qr_timeout', (data: { sessionId: string; message: string }) => {
      if (data.sessionId === sessionId) {
        setIsQrExpired(true) // Set flag FIRST to prevent race condition
        setQrCode(null)
        queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
        toast.error('QR code expired', {
          description: 'You didn\'t scan the QR code in time. Please restart the session to try again.',
          duration: 10000,
        })
      }
    })

    // Auth Timeout - authentication took too long
    socket.on('session:auth_timeout', (data: { sessionId: string; message: string }) => {
      if (data.sessionId === sessionId) {
        setIsQrExpired(true) // Set flag FIRST to prevent race condition
        setQrCode(null)
        queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
        toast.error('Authentication timed out', {
          description: 'Please restart the session and try again.',
          duration: 10000,
        })
      }
    })

    socket.on('session:auth_failure', (data: { sessionId: string }) => {
      if (data.sessionId === sessionId) {
        setIsQrExpired(true) // Set flag FIRST to prevent race condition
        setQrCode(null)
        queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
        toast.error('Authentication failed. Please try again.')
      }
    })

    return () => {
      unsubscribeFromSession(sessionId)
    }
  }, [sessionId, queryClient, handleNewQR])

  // Fetch QR code on mount if available from session data
  // But only if session is not in failed/disconnected state AND QR hasn't expired
  useEffect(() => {
    // Skip this effect during restart - we expect temporary inconsistent state
    if (isRestarting) {
      return
    }
    
    const sessionStatus = session?.liveStatus || session?.status
    // LOGGED_OUT is intentional action by user, not an expiry - handle separately
    const isExpiredOrFailed = sessionStatus === 'FAILED' || sessionStatus === 'DISCONNECTED'
    
    // If session status shows failed/expired, set the flag
    // But NOT for LOGGED_OUT - that's handled by isSessionLoggedOut
    if (isExpiredOrFailed) {
      setIsQrExpired(true)
      if (qrCode) {
        setQrCode(null)
      }
      return
    }
    
    // Only restore QR from session if:
    // 1. Session has qrCode
    // 2. We don't have qrCode in state
    // 3. QR hasn't been marked as expired (prevents race condition)
    // 4. Session is not in failed state
    // 5. Session is not logged out
    if (session?.qrCode && !qrCode && !isQrExpired && !isExpiredOrFailed && sessionStatus !== 'LOGGED_OUT') {
      handleNewQR(session.qrCode)
    }
  }, [session?.qrCode, session?.liveStatus, session?.status, qrCode, isQrExpired, isRestarting, handleNewQR])

  const deleteMutation = useMutation({
    mutationFn: () => sessionApi.delete(sessionId!),
    onSuccess: () => {
      toast.success('Session deleted')
      navigate('/dashboard/sessions')
    },
    onError: () => {
      toast.error('Failed to delete session')
    },
  })

  const restartMutation = useMutation({
    mutationFn: () => sessionApi.restart(sessionId!),
    onMutate: () => {
      // Set restarting flag BEFORE mutation to prevent race conditions
      setIsRestarting(true)
    },
    onSuccess: () => {
      setRestartOpen(false)
      setQrCode(null)
      setIsQrExpired(false) // Reset flag so new QR can be displayed
      // Note: isRestarting will be reset when new QR is received via socket
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
      toast.success('Session restarting... Please wait for new QR code.')
    },
    onError: () => {
      setIsRestarting(false) // Reset on error so UI can show correct state
      toast.error('Failed to restart session')
    },
  })

  // Request new QR code - simple and direct
  // Based on whatsapp-web.js: WhatsApp auto-regenerates QR, we just fetch latest
  const requestNewQR = useCallback(async () => {
    if (isRefreshing) {
      toast.info('Already refreshing...', { duration: 2000 })
      return
    }
    
    setIsRefreshing(true)
    // Don't clear QR - keep showing old QR while fetching new one
    // This prevents UI flash/flicker
    
    try {
      // Fetch QR directly from API
      const result = await sessionApi.getQR(sessionId!)
      
      if (result.qrCode) {
        handleNewQR(result.qrCode)
        toast.success('QR code ready!', { duration: 2000 })
      } else if (result.status === 'CONNECTED') {
        toast.success('Session is already connected!', { duration: 3000 })
        queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
      } else if (result.status === 'FAILED' || result.canRetry) {
        // Session expired - need to restart
        setQrCode(null)
        queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
        toast.error('Session expired', {
          description: result.message || 'Please restart the session to get a new QR code.',
          duration: 5000,
        })
      } else if (result.status === 'DISCONNECTED' || result.status === 'LOGGED_OUT') {
        // Session disconnected - need to restart
        setQrCode(null)
        queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
        toast.warning(result.message || 'Session disconnected. Please restart.', {
          duration: 5000,
        })
      } else {
        // No QR yet, WhatsApp will auto-generate and send via socket
        toast.info('Waiting for QR code from WhatsApp...', { duration: 3000 })
      }
    } catch (error) {
      console.error('Failed to fetch QR:', error)
      toast.error('Failed to fetch QR code')
    } finally {
      setIsRefreshing(false)
    }
  }, [sessionId, isRefreshing, queryClient, handleNewQR])

  const logoutMutation = useMutation({
    mutationFn: () => sessionApi.logout(sessionId!),
    onSuccess: () => {
      setLogoutOpen(false)
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
      toast.success('Session logged out successfully')
    },
    onError: () => {
      toast.error('Failed to logout')
    },
  })

  const createWebhookMutation = useMutation({
    mutationFn: (data: typeof webhookForm) => sessionApi.createWebhook(sessionId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', sessionId] })
      toast.success('Webhook created')
      setWebhookOpen(false)
      setWebhookForm({ name: '', url: '', events: ['ALL'], secret: '' })
    },
    onError: () => {
      toast.error('Failed to create webhook')
    },
  })

  const updateWebhookMutation = useMutation({
    mutationFn: (data: { id: string; name: string; url: string; events: string[]; secret: string; isActive: boolean }) => 
      sessionApi.updateWebhook(sessionId!, data.id, {
        name: data.name,
        url: data.url,
        events: data.events as any,
        secret: data.secret || undefined,
        isActive: data.isActive,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', sessionId] })
      toast.success('Webhook updated')
      setEditWebhookOpen(false)
      setEditingWebhook(null)
    },
    onError: () => {
      toast.error('Failed to update webhook')
    },
  })

  const deleteWebhookMutation = useMutation({
    mutationFn: (webhookId: string) => sessionApi.deleteWebhook(sessionId!, webhookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', sessionId] })
      toast.success('Webhook deleted')
    },
    onError: () => {
      toast.error('Failed to delete webhook')
    },
  })

  const testWebhookMutation = useMutation({
    mutationFn: (webhookId: string) => sessionApi.testWebhook(sessionId!, webhookId),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Webhook test successful (${data.duration}ms)`)
      } else {
        toast.error(`Webhook test failed: ${data.error}`)
      }
    },
    onError: () => {
      toast.error('Failed to test webhook')
    },
  })

  const sendMessageMutation = useMutation({
    mutationFn: () => sessionApi.sendMessage(sessionId!, messageForm),
    onSuccess: () => {
      toast.success('Message sent!')
      setSendOpen(false)
      setMessageForm({ to: '', message: '' })
    },
    onError: () => {
      toast.error('Failed to send message')
    },
  })

  const handleCopyId = async () => {
    await copyToClipboard(sessionId!)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading || !session) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const status = session.liveStatus || session.status
  const isConnected = session.isOnline || status === 'CONNECTED'
  
  // Separate states for different UI displays:
  // 1. LOGGED_OUT - User intentionally logged out (different from expired)
  // 2. FAILED/QR_TIMEOUT - QR expired or auth failed
  // 3. DISCONNECTED - Connection lost unexpectedly
  const isSessionLoggedOut = status === 'LOGGED_OUT' && !isRestarting
  // IMPORTANT: Exclude LOGGED_OUT from failed state - it's intentional, not an error
  const isSessionFailed = !isRestarting && !isSessionLoggedOut && (['FAILED', 'QR_TIMEOUT'].includes(status) || isQrExpired)
  const isSessionDisconnected = status === 'DISCONNECTED' && !isSessionFailed && !isRestarting && !isSessionLoggedOut
  
  // Show QR card only if:
  // 1. Status is QR_READY or INITIALIZING OR we're restarting (waiting for new QR)
  // 2. Session hasn't failed/expired/logged out
  // 3. We have QR code from API (session.qrCode) OR local state (qrCode) OR we're initializing/restarting
  const hasValidQrSession = (status === 'QR_READY' || status === 'INITIALIZING' || isRestarting) && !isSessionFailed && !isSessionLoggedOut
  const showQRCard = hasValidQrSession && (!!session.qrCode || !!qrCode || status === 'INITIALIZING' || isRestarting)
  const hasQRCode = !!qrCode
  
  // Special case: QR_READY status but no QR and no live session = stale state, show as failed
  // But NOT if we're restarting - that's expected behavior
  const isStaleState = !isRestarting && 
                       (status === 'QR_READY' || status === 'INITIALIZING') && 
                       !session.qrCode && !qrCode && !session.isOnline && !isSessionFailed && !isSessionLoggedOut

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/dashboard/sessions">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{session.name}</h1>
            <div className={`w-3 h-3 rounded-full ${getStatusColor(status)} ${
              ['QR_READY', 'INITIALIZING'].includes(status) ? 'animate-pulse' : ''
            }`} />
          </div>
          {session.description && (
            <p className="text-muted-foreground mt-1">{session.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setRestartOpen(true)} disabled={restartMutation.isPending}>
            <RefreshCw className={`mr-2 h-4 w-4 ${restartMutation.isPending ? 'animate-spin' : ''}`} />
            Restart
          </Button>
          {isConnected && (
            <Button variant="outline" onClick={() => setLogoutOpen(true)} disabled={logoutMutation.isPending}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          )}
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Session Failed/Expired Card - Show when max retries reached OR stale state detected */}
          {(isSessionFailed || isStaleState) && (
            <Card className="border-orange-500/50 bg-orange-50 dark:bg-orange-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                  <AlertTriangle className="h-5 w-5" />
                  Session Expired
                </CardTitle>
                <CardDescription className="text-orange-700 dark:text-orange-300">
                  {isStaleState 
                    ? 'This session is no longer active. Please restart to reconnect.'
                    : 'QR code was not scanned in time. The session has been terminated.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-orange-100 dark:bg-orange-900/30 p-4 rounded-lg">
                  <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-2">
                    Why did this happen?
                  </h4>
                  <ul className="list-disc list-inside text-sm text-orange-700 dark:text-orange-300 space-y-1">
                    <li>The QR code expired before being scanned</li>
                    <li>Maximum QR code refresh attempts were reached</li>
                    <li>WhatsApp authentication timed out</li>
                    {isStaleState && <li>Server was restarted while session was pending</li>}
                  </ul>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                  <h4 className="font-medium mb-2">What to do next?</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Click the button below to restart the session and generate a new QR code.
                    Make sure to scan the QR code within 2 minutes.
                  </p>
                  <Button onClick={() => setRestartOpen(true)} disabled={restartMutation.isPending}>
                    {restartMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Restarting...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Restart Session & Get New QR Code
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Session Logged Out Card - User intentionally logged out */}
          {isSessionLoggedOut && (
            <Card className="border-blue-500/50 bg-blue-50 dark:bg-blue-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <LogOut className="h-5 w-5" />
                  Logged Out
                </CardTitle>
                <CardDescription className="text-blue-700 dark:text-blue-300">
                  This session has been logged out from WhatsApp.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                    Session Data Cleared
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    All WhatsApp account data (phone number, profile) has been removed from this session for security. 
                    You can reconnect by scanning a new QR code.
                  </p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                  <h4 className="font-medium mb-2">Ready to reconnect?</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Click the button below to start a new WhatsApp connection.
                    You will need to scan a new QR code.
                  </p>
                  <Button onClick={() => setRestartOpen(true)} disabled={restartMutation.isPending}>
                    {restartMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Reconnecting...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Reconnect WhatsApp
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Session Disconnected Card - Connection lost unexpectedly */}
          {isSessionDisconnected && (
            <Card className="border-red-500/50 bg-red-50 dark:bg-red-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <XCircle className="h-5 w-5" />
                  Connection Lost
                </CardTitle>
                <CardDescription className="text-red-700 dark:text-red-300">
                  This session has been disconnected from WhatsApp unexpectedly.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-lg">
                  <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
                    Possible reasons:
                  </h4>
                  <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300 space-y-1">
                    <li>WhatsApp was disconnected from your phone</li>
                    <li>Network connection issues</li>
                    <li>WhatsApp server temporarily unavailable</li>
                    <li>Session was removed from linked devices</li>
                  </ul>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                  <h4 className="font-medium mb-2">Reconnect your session</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Try reconnecting to restore your WhatsApp session.
                  </p>
                  <Button onClick={() => setRestartOpen(true)} disabled={restartMutation.isPending}>
                    {restartMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Reconnecting...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Reconnect Session
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* QR Code Card - show if QR_READY or INITIALIZING */}
          {(showQRCard || status === 'INITIALIZING') && !isSessionFailed && !isSessionLoggedOut && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Connect WhatsApp
                </CardTitle>
                <CardDescription>
                  Scan this QR code with your WhatsApp mobile app to connect
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                {hasQRCode ? (
                  // QR Code Display - Simple, no countdown
                  // WhatsApp auto-regenerates QR and socket delivers new one
                  <>
                    <div className="relative">
                      <div className={`bg-white p-4 rounded-lg shadow-sm transition-opacity duration-200 ${isRefreshing ? 'opacity-50' : 'opacity-100'}`}>
                        <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                      </div>
                      {/* Subtle loading overlay - doesn't hide QR, just dims it */}
                      {isRefreshing && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-background/80 rounded-full p-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground mt-4 text-center">
                      Open WhatsApp → Settings → Linked Devices → Link a Device
                    </p>

                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      QR code refreshes automatically
                    </p>

                    {/* Manual Refresh Button - for when user wants to force refresh */}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={requestNewQR} 
                      className="mt-3"
                      disabled={isRefreshing}
                    >
                      {isRefreshing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Refreshing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Refresh QR Code
                        </>
                      )}
                    </Button>
                  </>
                ) : showQRCard && !hasQRCode ? (
                  // Waiting for QR Code (status is QR_READY but qrCode not yet received)
                  <div className="flex flex-col items-center py-8">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">
                      {isRefreshing ? 'Refreshing QR code...' : 'Waiting for QR code...'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">QR code will appear shortly</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={requestNewQR} 
                      className="mt-4"
                      disabled={isRefreshing}
                    >
                      {isRefreshing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Refreshing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Refresh
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  // Initializing State
                  <div className="flex flex-col items-center py-8">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">Initializing session...</p>
                    <p className="text-sm text-muted-foreground mt-2">This may take a moment...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Connected Info */}
          {isConnected && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-green-500" />
                  Connected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  {session.profilePicUrl && (
                    <img src={session.profilePicUrl} alt="Profile" className="w-16 h-16 rounded-full" />
                  )}
                  <div>
                    <p className="font-semibold text-lg">{session.pushName || 'Unknown'}</p>
                    <p className="text-muted-foreground">{session.phoneNumber}</p>
                  </div>
                </div>
                <Button className="mt-4" onClick={() => setSendOpen(true)}>
                  <Send className="mr-2 h-4 w-4" />
                  Send Test Message
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Webhooks */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="h-5 w-5" />
                  Webhooks
                </CardTitle>
                <CardDescription>
                  Receive real-time notifications for WhatsApp events
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setWebhookOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Webhook
              </Button>
            </CardHeader>
            <CardContent>
              {webhooks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Webhook className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No webhooks configured</p>
                  <p className="text-sm">Add a webhook to receive event notifications</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {webhooks.map((webhook) => (
                    <div key={webhook.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{webhook.name}</p>
                          {webhook.isActive ? (
                            <Badge variant="success" className="text-xs">Active</Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">Disabled</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{webhook.url}</p>
                        <div className="flex gap-1 mt-1">
                          {webhook.events.slice(0, 3).map((event) => (
                            <Badge key={event} variant="secondary" className="text-xs">
                              {event}
                            </Badge>
                          ))}
                          {webhook.events.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{webhook.events.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testWebhookMutation.mutate(webhook.id)}
                          disabled={testWebhookMutation.isPending}
                        >
                          Test
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingWebhook({
                              id: webhook.id,
                              name: webhook.name,
                              url: webhook.url,
                              events: webhook.events,
                              secret: webhook.secret || '',
                              isActive: webhook.isActive,
                            })
                            setEditWebhookOpen(true)
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => deleteWebhookMutation.mutate(webhook.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Session Info */}
          <Card>
            <CardHeader>
              <CardTitle>Session Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Session ID</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 text-sm bg-muted px-2 py-1 rounded truncate">
                    {sessionId}
                  </code>
                  <Button variant="ghost" size="icon" onClick={handleCopyId}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Separator />
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={isConnected ? 'success' : 'secondary'}>
                    {getStatusText(status)}
                  </Badge>
                </div>
                {session.phoneNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-medium">{session.phoneNumber}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Messages</span>
                  <span className="font-medium">{session._count?.messages || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Webhooks</span>
                  <span className="font-medium">{session._count?.webhooks || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span className="text-muted-foreground">{formatDate(session.createdAt)}</span>
                </div>
                {session.connectedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Connected</span>
                    <span className="text-muted-foreground">{formatDate(session.connectedAt)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* API Usage */}
          <Card>
            <CardHeader>
              <CardTitle>API Endpoints</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Send Message</p>
                <code className="block bg-muted px-2 py-1 rounded text-xs mt-1">
                  POST /api/sessions/{sessionId}/messages/send
                </code>
              </div>
              <div>
                <p className="text-muted-foreground">Get Status</p>
                <code className="block bg-muted px-2 py-1 rounded text-xs mt-1">
                  GET /api/sessions/{sessionId}/status
                </code>
              </div>
              <Link to="/dashboard/docs" className="inline-flex items-center text-primary hover:underline text-sm mt-2">
                View full documentation <ExternalLink className="ml-1 h-3 w-3" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Delete Session
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{session.name}"?
            </DialogDescription>
          </DialogHeader>
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
            <p className="font-medium">⚠️ This action cannot be undone!</p>
            <ul className="list-disc list-inside mt-1 text-xs">
              <li>Session will be permanently deleted</li>
              <li>All webhooks will be removed</li>
              <li>Message history will be lost</li>
              <li>WhatsApp connection will be terminated</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, Delete Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restart Dialog */}
      <Dialog open={restartOpen} onOpenChange={setRestartOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Restart Session
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to restart "{session.name}"?
            </DialogDescription>
          </DialogHeader>
          <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-sm p-3 rounded-lg">
            <p className="font-medium">⚠️ What will happen:</p>
            <ul className="list-disc list-inside mt-1 text-xs">
              <li>Current WhatsApp connection will be terminated</li>
              <li>A new session will be initialized</li>
              <li>You will need to scan a new QR code</li>
              <li>Webhooks and settings will be preserved</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestartOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => restartMutation.mutate()}
              disabled={restartMutation.isPending}
            >
              {restartMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, Restart Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logout Dialog */}
      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5" />
              Logout from WhatsApp
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to logout "{session.name}"?
            </DialogDescription>
          </DialogHeader>
          <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm p-3 rounded-lg">
            <p className="font-medium">ℹ️ What will happen:</p>
            <ul className="list-disc list-inside mt-1 text-xs">
              <li>WhatsApp connection will be terminated</li>
              <li>Phone number and profile data will be cleared</li>
              <li>You will need to scan a new QR code to reconnect</li>
              <li>Webhooks and message history will be preserved</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogoutOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Webhook Dialog */}
      <Dialog open={webhookOpen} onOpenChange={setWebhookOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Webhook</DialogTitle>
            <DialogDescription>
              Configure a webhook endpoint to receive WhatsApp events
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="My Webhook"
                value={webhookForm.name}
                onChange={(e) => setWebhookForm({ ...webhookForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                placeholder="https://example.com/webhook"
                value={webhookForm.url}
                onChange={(e) => setWebhookForm({ ...webhookForm, url: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Secret (optional)</Label>
              <Input
                placeholder="Webhook signing secret"
                value={webhookForm.secret}
                onChange={(e) => setWebhookForm({ ...webhookForm, secret: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Used to sign webhook payloads for verification
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWebhookOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createWebhookMutation.mutate(webhookForm)}
              disabled={createWebhookMutation.isPending || !webhookForm.name || !webhookForm.url}
            >
              {createWebhookMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Webhook
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Webhook Dialog */}
      <Dialog open={editWebhookOpen} onOpenChange={(open) => {
        setEditWebhookOpen(open)
        if (!open) setEditingWebhook(null)
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Webhook</DialogTitle>
            <DialogDescription>
              Update your webhook configuration
            </DialogDescription>
          </DialogHeader>
          {editingWebhook && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  placeholder="My Webhook"
                  value={editingWebhook.name}
                  onChange={(e) => setEditingWebhook({ ...editingWebhook, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>URL</Label>
                <Input
                  placeholder="https://example.com/webhook"
                  value={editingWebhook.url}
                  onChange={(e) => setEditingWebhook({ ...editingWebhook, url: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Secret (optional)</Label>
                <Input
                  placeholder="Webhook signing secret"
                  value={editingWebhook.secret}
                  onChange={(e) => setEditingWebhook({ ...editingWebhook, secret: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Used to sign webhook payloads for verification
                </p>
              </div>
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant={editingWebhook.isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEditingWebhook({ ...editingWebhook, isActive: true })}
                  >
                    Active
                  </Button>
                  <Button
                    variant={!editingWebhook.isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEditingWebhook({ ...editingWebhook, isActive: false })}
                  >
                    Disabled
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditWebhookOpen(false)
              setEditingWebhook(null)
            }}>
              Cancel
            </Button>
            <Button
              onClick={() => editingWebhook && updateWebhookMutation.mutate(editingWebhook)}
              disabled={updateWebhookMutation.isPending || !editingWebhook?.name || !editingWebhook?.url}
            >
              {updateWebhookMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Message Dialog */}
      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Message</DialogTitle>
            <DialogDescription>
              Send a test message to verify your session is working
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Recipient</Label>
              <Input
                placeholder="628123456789"
                value={messageForm.to}
                onChange={(e) => setMessageForm({ ...messageForm, to: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Phone number with country code (without + or spaces)
              </p>
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Input
                placeholder="Hello from Zetwa!"
                value={messageForm.message}
                onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendOpen(false)}>
              Cancel
            </Button>
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
