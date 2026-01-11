import { useState, useEffect } from 'react'
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
  MessageSquare,
  Loader2,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { sessionApi, type Webhook as WebhookType } from '@/api/session.api'
import { getStatusColor, getStatusText, formatDate, copyToClipboard } from '@/lib/utils'
import { connectSocket, subscribeToSession, unsubscribeFromSession, getSocket } from '@/lib/socket'

export default function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [qrCode, setQrCode] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [webhookOpen, setWebhookOpen] = useState(false)
  const [sendOpen, setSendOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  // Webhook form
  const [webhookForm, setWebhookForm] = useState({
    name: '',
    url: '',
    events: ['ALL'] as string[],
    secret: '',
  })

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

  // Socket connection for real-time updates
  useEffect(() => {
    if (!sessionId) return

    const socket = connectSocket()
    subscribeToSession(sessionId)

    socket.on('session:qr', (data: { sessionId: string; qr: string }) => {
      if (data.sessionId === sessionId) {
        setQrCode(data.qr)
      }
    })

    socket.on('session:ready', (data: { sessionId: string }) => {
      if (data.sessionId === sessionId) {
        setQrCode(null)
        queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
        toast.success('Session connected successfully!')
      }
    })

    socket.on('session:disconnected', (data: { sessionId: string }) => {
      if (data.sessionId === sessionId) {
        queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
        toast.warning('Session disconnected')
      }
    })

    return () => {
      unsubscribeFromSession(sessionId)
    }
  }, [sessionId, queryClient])

  // Fetch QR code on mount if needed
  useEffect(() => {
    if (session?.qrCode) {
      setQrCode(session.qrCode)
    }
  }, [session?.qrCode])

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
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
      toast.success('Session logged out')
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
  const showQR = status === 'QR_READY' && qrCode

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
          <Button variant="outline" onClick={() => restartMutation.mutate()} disabled={restartMutation.isPending}>
            <RefreshCw className={`mr-2 h-4 w-4 ${restartMutation.isPending ? 'animate-spin' : ''}`} />
            Restart
          </Button>
          {isConnected && (
            <Button variant="outline" onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending}>
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
          {/* QR Code Card */}
          {(showQR || status === 'INITIALIZING') && (
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
                {showQR ? (
                  <>
                    <div className="bg-white p-4 rounded-lg">
                      <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-4 text-center">
                      Open WhatsApp → Settings → Linked Devices → Link a Device
                    </p>
                  </>
                ) : (
                  <div className="flex flex-col items-center py-8">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">Initializing session...</p>
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
                        <p className="font-medium truncate">{webhook.name}</p>
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
            <DialogTitle>Delete Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{session.name}"? This will permanently delete all
              webhooks, messages, and session data.
            </DialogDescription>
          </DialogHeader>
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
              Delete
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
