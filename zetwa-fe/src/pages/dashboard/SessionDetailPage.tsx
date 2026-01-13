/**
 * Session Detail Page - Comprehensive session management with WAHA-style UI
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  LogOut,
  Trash2,
  QrCode,
  Smartphone,
  Phone,
  Copy,
  Check,
  Wifi,
  AlertTriangle,
  Send,
  Webhook,
  Plus,
  MoreVertical,
  User,
  Eye,
  EyeOff,
  TestTube2,
  Pencil,
  Info,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { sessionApi, type Webhook as WebhookType } from '@/api/session.api'
import { getSessionStatus } from '@/components/session'
import { connectSocket, subscribeToSession, unsubscribeFromSession } from '@/lib/socket'
import { cn, formatRelativeTime } from '@/lib/utils'

// ============================================
// MAIN COMPONENT
// ============================================

export default function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // ============================================
  // STATE
  // ============================================
  
  // QR/Auth state
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [isQrExpired, setIsQrExpired] = useState(false)
  const [isRestarting, setIsRestarting] = useState(false)
  const [authMethod, setAuthMethod] = useState<'qr' | 'phone'>('qr')
  const [pairingPhone, setPairingPhone] = useState('')
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [pairingCodeCopied, setPairingCodeCopied] = useState(false)
  
  // Dialog states
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [sendOpen, setSendOpen] = useState(false)
  const [webhookOpen, setWebhookOpen] = useState(false)
  const [editWebhookOpen, setEditWebhookOpen] = useState(false)
  
  // Misc state
  const [idCopied, setIdCopied] = useState(false)
  const [messageForm, setMessageForm] = useState({ to: '', message: '' })
  const [webhookForm, setWebhookForm] = useState({ name: '', url: '', events: ['ALL'], secret: '' })
  const [editingWebhook, setEditingWebhook] = useState<WebhookType | null>(null)

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
    setIsQrExpired(false)
    setIsRestarting(false)
  }, [])

  // Socket connection for real-time updates
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
        setIsQrExpired(true)
        setQrCode(null)
        toast.error('QR code expired. Please restart the session.')
      }
    })

    socket.on('session:auth_failure', (data: { sessionId: string }) => {
      if (data.sessionId === sessionId) {
        setIsQrExpired(true)
        setQrCode(null)
        toast.error('Authentication failed')
      }
    })

    return () => {
      unsubscribeFromSession(sessionId)
    }
  }, [sessionId, queryClient, handleNewQR])

  // Sync QR from session data
  useEffect(() => {
    if (isRestarting) return
    
    const status = session?.liveStatus || session?.status
    if (['FAILED', 'DISCONNECTED'].includes(status || '')) {
      setIsQrExpired(true)
      setQrCode(null)
      return
    }

    if (session?.qrCode && !qrCode && !isQrExpired) {
      handleNewQR(session.qrCode)
    }
  }, [session?.qrCode, session?.liveStatus, session?.status, qrCode, isQrExpired, isRestarting, handleNewQR])

  // ============================================
  // MUTATIONS
  // ============================================

  const restartMutation = useMutation({
    mutationFn: () => sessionApi.restart(sessionId!),
    onMutate: () => {
      setIsRestarting(true)
      setIsQrExpired(false)
      setQrCode(null)
      setPairingCode(null)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
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
    onError: () => toast.error('Failed to delete session'),
  })

  const pairingCodeMutation = useMutation({
    mutationFn: (phoneNumber: string) => sessionApi.requestPairingCode(sessionId!, { phoneNumber }),
    onSuccess: (data) => {
      setPairingCode(data.code)
      toast.success('Pairing code generated')
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to get pairing code'),
  })

  const sendMessageMutation = useMutation({
    mutationFn: () => sessionApi.sendMessage(sessionId!, messageForm),
    onSuccess: () => {
      toast.success('Message sent!')
      setSendOpen(false)
      setMessageForm({ to: '', message: '' })
    },
    onError: () => toast.error('Failed to send message'),
  })

  const createWebhookMutation = useMutation({
    mutationFn: (data: typeof webhookForm) => sessionApi.createWebhook(sessionId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', sessionId] })
      toast.success('Webhook created')
      setWebhookOpen(false)
      setWebhookForm({ name: '', url: '', events: ['ALL'], secret: '' })
    },
    onError: () => toast.error('Failed to create webhook'),
  })

  const updateWebhookMutation = useMutation({
    mutationFn: (data: WebhookType) => sessionApi.updateWebhook(sessionId!, data.id, {
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
    onError: () => toast.error('Failed to update webhook'),
  })

  const deleteWebhookMutation = useMutation({
    mutationFn: (webhookId: string) => sessionApi.deleteWebhook(sessionId!, webhookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', sessionId] })
      toast.success('Webhook deleted')
    },
    onError: () => toast.error('Failed to delete webhook'),
  })

  const testWebhookMutation = useMutation({
    mutationFn: (webhookId: string) => sessionApi.testWebhook(sessionId!, webhookId),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Test successful (${data.duration}ms)`)
      } else {
        toast.error(`Test failed: ${data.error}`)
      }
    },
    onError: () => toast.error('Failed to test webhook'),
  })

  // ============================================
  // HANDLERS
  // ============================================

  const handleCopyId = async () => {
    await navigator.clipboard.writeText(sessionId!)
    setIdCopied(true)
    setTimeout(() => setIdCopied(false), 2000)
  }

  const handleCopyPairingCode = async () => {
    if (!pairingCode) return
    await navigator.clipboard.writeText(pairingCode.replace('-', ''))
    setPairingCodeCopied(true)
    setTimeout(() => setPairingCodeCopied(false), 2000)
  }

  const handleRequestPairingCode = () => {
    if (!pairingPhone.trim()) {
      toast.error('Please enter a phone number')
      return
    }
    const cleanPhone = pairingPhone.replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      toast.error('Please enter a valid phone number')
      return
    }
    pairingCodeMutation.mutate(cleanPhone)
  }

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

  const status = session.liveStatus || session.status
  const statusConfig = getSessionStatus(status)
  const StatusIcon = statusConfig.icon
  const isConnected = session.isOnline || status === 'CONNECTED' || status === 'WORKING'
  const showQRCard = ['QR_READY', 'SCAN_QR_CODE', 'INITIALIZING'].includes(status) && !isQrExpired
  const isSessionFailed = ['FAILED', 'QR_TIMEOUT'].includes(status) || isQrExpired
  const isSessionLoggedOut = status === 'LOGGED_OUT'

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-background to-muted/30">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/sessions')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              
              {/* Session Avatar */}
              <div className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center",
                isConnected ? "bg-green-100 dark:bg-green-900/30" : "bg-muted"
              )}>
                {session.profilePicUrl ? (
                  <img src={session.profilePicUrl} alt="" className="w-14 h-14 rounded-full object-cover" />
                ) : (
                  <Smartphone className={cn("h-7 w-7", isConnected ? "text-green-600" : "text-muted-foreground")} />
                )}
              </div>

              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold">{session.name}</h1>
                  <Badge variant={statusConfig.variant} className="gap-1.5">
                    <StatusIcon className={cn("h-3 w-3", (statusConfig as { animate?: boolean }).animate && "animate-spin")} />
                    {statusConfig.label}
                  </Badge>
                </div>
                {session.description && (
                  <p className="text-muted-foreground mt-1">{session.description}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  {session.phoneNumber && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {session.phoneNumber}
                    </span>
                  )}
                  {session.pushName && (
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      {session.pushName}
                    </span>
                  )}
                  <button
                    onClick={handleCopyId}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    {idCopied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                    <span className="font-mono text-xs">{sessionId?.slice(0, 8)}...</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {isConnected && (
                <Button variant="outline" onClick={() => setSendOpen(true)}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              )}
              <Button variant="outline" onClick={() => restartMutation.mutate()} disabled={restartMutation.isPending}>
                <RefreshCw className={cn("h-4 w-4 mr-2", restartMutation.isPending && "animate-spin")} />
                Restart
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isConnected && (
                    <DropdownMenuItem onClick={() => setLogoutOpen(true)}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={() => setDeleteOpen(true)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Session
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* QR/Auth Section - Show when not connected */}
        {(showQRCard || isRestarting || isSessionFailed || isSessionLoggedOut) && !isConnected && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Connect WhatsApp
              </CardTitle>
              <CardDescription>
                Scan the QR code or use a pairing code to link your WhatsApp account
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Failed/Expired State */}
              {(isSessionFailed || isSessionLoggedOut) && !isRestarting && (
                <div className="text-center py-8">
                  <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                    <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {isSessionLoggedOut ? 'Session Logged Out' : 'Session Expired'}
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    {isSessionLoggedOut 
                      ? 'This session has been logged out. Restart to reconnect.'
                      : 'The QR code expired or authentication failed. Restart to get a new QR code.'
                    }
                  </p>
                  <Button onClick={() => restartMutation.mutate()} disabled={restartMutation.isPending}>
                    <RefreshCw className={cn("h-4 w-4 mr-2", restartMutation.isPending && "animate-spin")} />
                    Restart Session
                  </Button>
                </div>
              )}

              {/* Loading/Initializing State */}
              {isRestarting && !qrCode && (
                <div className="text-center py-8">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Initializing session...</p>
                </div>
              )}

              {/* QR Code Display */}
              {(showQRCard || qrCode) && !isSessionFailed && !isSessionLoggedOut && (
                <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as 'qr' | 'phone')} className="w-full">
                  <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
                    <TabsTrigger value="qr">
                      <QrCode className="h-4 w-4 mr-2" />
                      QR Code
                    </TabsTrigger>
                    <TabsTrigger value="phone">
                      <Phone className="h-4 w-4 mr-2" />
                      Phone Number
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="qr" className="text-center">
                    {qrCode ? (
                      <div className="inline-block p-4 bg-white rounded-xl shadow-lg">
                        <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                      </div>
                    ) : (
                      <div className="inline-block p-4 bg-muted rounded-xl">
                        <div className="w-64 h-64 flex items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground mt-4">
                      Open WhatsApp on your phone → Settings → Linked Devices → Link a Device
                    </p>
                  </TabsContent>

                  <TabsContent value="phone" className="max-w-md mx-auto">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <Input
                          placeholder="e.g., 628123456789"
                          value={pairingPhone}
                          onChange={(e) => setPairingPhone(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter phone number with country code (without + or spaces)
                        </p>
                      </div>

                      {pairingCode ? (
                        <div className="p-4 bg-muted rounded-lg text-center">
                          <p className="text-sm text-muted-foreground mb-2">Enter this code on your phone:</p>
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-3xl font-mono font-bold tracking-widest">{pairingCode}</span>
                            <Button variant="ghost" size="icon" onClick={handleCopyPairingCode}>
                              {pairingCodeCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button 
                          className="w-full" 
                          onClick={handleRequestPairingCode}
                          disabled={pairingCodeMutation.isPending}
                        >
                          {pairingCodeMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Get Pairing Code
                        </Button>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        )}

        {/* Connected Info */}
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

        {/* Tabs for Webhooks & Settings */}
        <Tabs defaultValue="webhooks" className="space-y-6">
          <TabsList>
            <TabsTrigger value="webhooks" className="gap-2">
              <Webhook className="h-4 w-4" />
              Webhooks ({webhooks.length})
            </TabsTrigger>
            <TabsTrigger value="info" className="gap-2">
              <Info className="h-4 w-4" />
              Session Info
            </TabsTrigger>
          </TabsList>

          {/* Webhooks Tab */}
          <TabsContent value="webhooks" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Webhooks</h2>
                <p className="text-sm text-muted-foreground">Receive real-time event notifications</p>
              </div>
              <Button onClick={() => setWebhookOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Webhook
              </Button>
            </div>

            {webhooks.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Webhook className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No webhooks configured</h3>
                  <p className="text-muted-foreground text-center max-w-md mb-4">
                    Add webhooks to receive HTTP notifications when events occur.
                  </p>
                  <Button variant="outline" onClick={() => setWebhookOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Webhook
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {webhooks.map((webhook) => (
                  <Card key={webhook.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium truncate">{webhook.name}</h3>
                            <Badge variant={webhook.isActive ? 'success' : 'secondary'}>
                              {webhook.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate mb-2">{webhook.url}</p>
                          <div className="flex flex-wrap gap-1">
                            {webhook.events.slice(0, 3).map((event) => (
                              <Badge key={event} variant="outline" className="text-xs">
                                {event}
                              </Badge>
                            ))}
                            {webhook.events.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{webhook.events.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => testWebhookMutation.mutate(webhook.id)}
                            disabled={testWebhookMutation.isPending}
                          >
                            <TestTube2 className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setEditingWebhook(webhook)
                                setEditWebhookOpen(true)
                              }}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateWebhookMutation.mutate({ ...webhook, isActive: !webhook.isActive })}>
                                {webhook.isActive ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                                {webhook.isActive ? 'Disable' : 'Enable'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => deleteWebhookMutation.mutate(webhook.id)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Info Tab */}
          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle>Session Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-muted-foreground">Session ID</Label>
                    <p className="font-mono text-sm">{session.id}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Name</Label>
                    <p>{session.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Created</Label>
                    <p>{formatRelativeTime(session.createdAt)}</p>
                  </div>
                  {session.phoneNumber && (
                    <div>
                      <Label className="text-muted-foreground">Phone Number</Label>
                      <p>{session.phoneNumber}</p>
                    </div>
                  )}
                  {session.pushName && (
                    <div>
                      <Label className="text-muted-foreground">WhatsApp Name</Label>
                      <p>{session.pushName}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
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
              Are you sure you want to delete "{session.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
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
              This will disconnect WhatsApp and require re-scanning the QR code to reconnect.
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
            <DialogTitle>Send Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Recipient</Label>
              <Input
                placeholder="628123456789"
                value={messageForm.to}
                onChange={(e) => setMessageForm({ ...messageForm, to: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Type your message..."
                value={messageForm.message}
                onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendOpen(false)}>Cancel</Button>
            <Button onClick={() => sendMessageMutation.mutate()} disabled={sendMessageMutation.isPending}>
              {sendMessageMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Webhook Dialog */}
      <Dialog open={webhookOpen} onOpenChange={setWebhookOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Webhook</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
              <Label>Events</Label>
              <Select
                value={webhookForm.events[0]}
                onValueChange={(v) => setWebhookForm({ ...webhookForm, events: [v] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Events</SelectItem>
                  <SelectItem value="MESSAGE_RECEIVED">Message Received</SelectItem>
                  <SelectItem value="MESSAGE_SENT">Message Sent</SelectItem>
                  <SelectItem value="MESSAGE_ACK">Message ACK</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Secret (Optional)</Label>
              <Input
                type="password"
                placeholder="HMAC secret for signature"
                value={webhookForm.secret}
                onChange={(e) => setWebhookForm({ ...webhookForm, secret: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWebhookOpen(false)}>Cancel</Button>
            <Button onClick={() => createWebhookMutation.mutate(webhookForm)} disabled={createWebhookMutation.isPending}>
              {createWebhookMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Webhook Dialog */}
      <Dialog open={editWebhookOpen} onOpenChange={setEditWebhookOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Webhook</DialogTitle>
          </DialogHeader>
          {editingWebhook && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={editingWebhook.name}
                  onChange={(e) => setEditingWebhook({ ...editingWebhook, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>URL</Label>
                <Input
                  value={editingWebhook.url}
                  onChange={(e) => setEditingWebhook({ ...editingWebhook, url: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={editingWebhook.isActive}
                  onCheckedChange={(checked) => setEditingWebhook({ ...editingWebhook, isActive: checked })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditWebhookOpen(false)}>Cancel</Button>
            <Button onClick={() => editingWebhook && updateWebhookMutation.mutate(editingWebhook)} disabled={updateWebhookMutation.isPending}>
              {updateWebhookMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
