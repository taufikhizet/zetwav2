import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Plus,
  Smartphone,
  MoreVertical,
  Trash2,
  RefreshCw,
  LogOut,
  Eye,
  Loader2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sessionApi, type Session } from '@/api/session.api'
import { getStatusColor, getStatusText, formatRelativeTime } from '@/lib/utils'

export default function SessionsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteSession, setDeleteSession] = useState<Session | null>(null)
  const [newSessionName, setNewSessionName] = useState('')
  const [newSessionDescription, setNewSessionDescription] = useState('')

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: sessionApi.list,
    refetchInterval: 5000, // Refresh every 5 seconds
  })

  const createMutation = useMutation({
    mutationFn: sessionApi.create,
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      toast.success('Session created successfully')
      setCreateOpen(false)
      setNewSessionName('')
      setNewSessionDescription('')
      navigate(`/dashboard/sessions/${session.id}`)
    },
    onError: (error: Error & { response?: { data?: { error?: { message?: string } } } }) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create session')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (sessionId: string) => sessionApi.delete(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      toast.success('Session deleted successfully')
      setDeleteSession(null)
    },
    onError: (error: Error & { response?: { data?: { error?: { message?: string } } } }) => {
      toast.error(error.response?.data?.error?.message || 'Failed to delete session')
    },
  })

  const restartMutation = useMutation({
    mutationFn: (sessionId: string) => sessionApi.restart(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      toast.success('Session restarting...')
    },
    onError: (error: Error & { response?: { data?: { error?: { message?: string } } } }) => {
      toast.error(error.response?.data?.error?.message || 'Failed to restart session')
    },
  })

  const logoutMutation = useMutation({
    mutationFn: (sessionId: string) => sessionApi.logout(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      toast.success('Session logged out successfully')
    },
    onError: (error: Error & { response?: { data?: { error?: { message?: string } } } }) => {
      toast.error(error.response?.data?.error?.message || 'Failed to logout session')
    },
  })

  const handleCreate = () => {
    if (!newSessionName.trim()) {
      toast.error('Session name is required')
      return
    }
    createMutation.mutate({
      name: newSessionName.trim(),
      description: newSessionDescription.trim() || undefined,
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sessions</h1>
          <p className="text-muted-foreground mt-1">
            Manage your WhatsApp sessions
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Session
        </Button>
      </div>

      {/* Sessions grid */}
      {sessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Smartphone className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No sessions yet</h2>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              Create your first WhatsApp session to start sending and receiving messages via API.
            </p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Session
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => (
            <Card key={session.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(session.liveStatus || session.status)} ${
                      ['QR_READY', 'INITIALIZING', 'AUTHENTICATING'].includes(session.liveStatus || session.status) 
                        ? 'animate-pulse' 
                        : ''
                    }`} />
                    <div>
                      <CardTitle className="text-lg">{session.name}</CardTitle>
                      {session.description && (
                        <CardDescription className="text-xs mt-0.5">
                          {session.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/dashboard/sessions/${session.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => restartMutation.mutate(session.id)}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Restart
                      </DropdownMenuItem>
                      {session.isOnline && (
                        <DropdownMenuItem onClick={() => logoutMutation.mutate(session.id)}>
                          <LogOut className="mr-2 h-4 w-4" />
                          Logout
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleteSession(session)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={session.isOnline ? 'success' : 'secondary'}>
                      {getStatusText(session.liveStatus || session.status)}
                    </Badge>
                  </div>
                  {session.phoneNumber && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Phone</span>
                      <span className="font-medium">{session.phoneNumber}</span>
                    </div>
                  )}
                  {session.pushName && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-medium">{session.pushName}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Webhooks</span>
                    <span className="font-medium">{session._count?.webhooks || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Created</span>
                    <span className="text-muted-foreground">
                      {formatRelativeTime(session.createdAt)}
                    </span>
                  </div>
                </div>

                <Link to={`/dashboard/sessions/${session.id}`}>
                  <Button variant="outline" className="w-full mt-4">
                    Manage Session
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Session</DialogTitle>
            <DialogDescription>
              Create a new WhatsApp session. You'll need to scan a QR code to connect.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Session Name</Label>
              <Input
                id="name"
                placeholder="my-session"
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Only letters, numbers, underscores, and hyphens allowed.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                placeholder="Main business WhatsApp"
                value={newSessionDescription}
                onChange={(e) => setNewSessionDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteSession} onOpenChange={() => setDeleteSession(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteSession?.name}"? This action cannot be undone.
              All webhooks and message history will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteSession(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteSession && deleteMutation.mutate(deleteSession.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
