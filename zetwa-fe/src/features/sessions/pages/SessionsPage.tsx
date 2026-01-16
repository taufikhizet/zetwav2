/**
 * Sessions Page - Modern sessions list with KasirKita-style UI
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Plus,
  Smartphone,
  Loader2,
  Search,
  Filter,
  List,
  RefreshCw,
  Wifi,
  WifiOff,
  QrCode,
  LayoutGrid
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { sessionApi, type Session } from '@/features/sessions/api/session.api'
import { SessionCard } from '@/features/sessions/components'

type ViewMode = 'grid' | 'list'
type StatusFilter = 'all' | 'online' | 'offline' | 'needs-action'

export default function SessionsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [deleteSession, setDeleteSession] = useState<Session | null>(null)
  const [restartingId, setRestartingId] = useState<string | null>(null)
  const [loggingOutId, setLoggingOutId] = useState<string | null>(null)

  const { data: sessions = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['sessions'],
    queryFn: sessionApi.list,
    refetchInterval: 5000,
  })

  const deleteMutation = useMutation({
    mutationFn: (sessionId: string) => sessionApi.delete(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      toast.success('Session deleted successfully')
      setDeleteSession(null)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete session')
    },
  })

  const restartMutation = useMutation({
    mutationFn: (sessionId: string) => sessionApi.restart(sessionId),
    onMutate: (sessionId) => setRestartingId(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      toast.success('Session restarting...')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to restart session')
    },
    onSettled: () => setRestartingId(null),
  })

  const logoutMutation = useMutation({
    mutationFn: (sessionId: string) => sessionApi.logout(sessionId),
    onMutate: (sessionId) => setLoggingOutId(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      toast.success('Session logged out successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to logout session')
    },
    onSettled: () => setLoggingOutId(null),
  })

  // Filter sessions
  const filteredSessions = sessions.filter((session) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesName = session.name.toLowerCase().includes(query)
      const matchesPhone = session.phoneNumber?.toLowerCase().includes(query)
      const matchesPushName = session.pushName?.toLowerCase().includes(query)
      if (!matchesName && !matchesPhone && !matchesPushName) return false
    }

    // Status filter
    const status = session.liveStatus || session.status
    const isOnline = session.isOnline || status === 'CONNECTED' || status === 'WORKING'
    const needsAction = ['QR_READY', 'SCAN_QR_CODE', 'INITIALIZING'].includes(status)

    switch (statusFilter) {
      case 'online':
        return isOnline
      case 'offline':
        return !isOnline && !needsAction
      case 'needs-action':
        return needsAction
      default:
        return true
    }
  })

  // Stats
  const stats = {
    total: sessions.length,
    online: sessions.filter(s => s.isOnline || ['CONNECTED', 'WORKING'].includes(s.liveStatus || s.status)).length,
    needsAction: sessions.filter(s => ['QR_READY', 'SCAN_QR_CODE', 'INITIALIZING'].includes(s.liveStatus || s.status)).length,
    offline: sessions.filter(s => {
      const status = s.liveStatus || s.status
      return !s.isOnline && !['CONNECTED', 'WORKING', 'QR_READY', 'SCAN_QR_CODE', 'INITIALIZING'].includes(status)
    }).length,
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">


      {/* Stats Cards */}
      {sessions.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card className="cursor-pointer transition-all hover:shadow-md" onClick={() => setStatusFilter('all')}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10 text-primary shadow-md shadow-primary/20">
                <Smartphone className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs font-medium text-muted-foreground">Total Sessions</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer transition-all hover:shadow-md" onClick={() => setStatusFilter('online')}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600 shadow-md shadow-emerald-500/20">
                <Wifi className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{stats.online}</p>
                <p className="text-xs font-medium text-muted-foreground">Online</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer transition-all hover:shadow-md" onClick={() => setStatusFilter('needs-action')}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-100 text-blue-600 shadow-md shadow-blue-500/20">
                <QrCode className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.needsAction}</p>
                <p className="text-xs font-medium text-muted-foreground">Needs Action</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer transition-all hover:shadow-md" onClick={() => setStatusFilter('offline')}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-slate-100 text-slate-600 shadow-inner">
                <WifiOff className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-600">{stats.offline}</p>
                <p className="text-xs font-medium text-muted-foreground">Offline</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters & Actions */}
      {sessions.length > 0 && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sessions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 shadow-inner"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-[160px] shadow-inner">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({stats.total})</SelectItem>
                <SelectItem value="online">Online ({stats.online})</SelectItem>
                <SelectItem value="needs-action">Needs Action ({stats.needsAction})</SelectItem>
                <SelectItem value="offline">Offline ({stats.offline})</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={() => navigate('/dashboard/sessions/new')} size="sm" className="rounded-lg shadow-sm bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                New Session
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <div className="h-8 w-px bg-border mx-1" />
            <div className="flex items-center bg-gray-50/50 dark:bg-secondary/20 rounded-lg p-1 shadow-inner">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8 rounded-md shadow-none"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8 rounded-md shadow-none"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sessions Grid/List */}
      {sessions.length === 0 ? (
        <Card className="border-dashed border-2 bg-transparent shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="p-6 rounded-full bg-secondary mb-6 shadow-inner">
              <Smartphone className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No sessions yet</h2>
            <p className="text-muted-foreground text-center max-w-md mb-8">
              Create your first WhatsApp session to start sending and receiving messages via API.
            </p>
            <Button onClick={() => navigate('/dashboard/sessions/new')} size="lg" className="rounded-xl">
              <Plus className="mr-2 h-5 w-5" />
              Create Session
            </Button>
          </CardContent>
        </Card>
      ) : filteredSessions.length === 0 ? (
        <Card className="border-dashed border-2 bg-transparent shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">No sessions found</h2>
            <p className="text-muted-foreground text-center">
              Try adjusting your search or filter criteria.
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className={
          viewMode === 'grid'
            ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            : "grid gap-4"
        }>
          {filteredSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              viewMode={viewMode}
              onRestart={(id) => restartMutation.mutate(id)}
              onLogout={(id) => logoutMutation.mutate(id)}
              onDelete={(s) => setDeleteSession(s)}
              isRestartPending={restartingId === session.id}
              isLogoutPending={loggingOutId === session.id}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteSession} onOpenChange={() => setDeleteSession(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "<strong>{deleteSession?.name}</strong>"? 
              This action cannot be undone. All webhooks, messages, and data will be permanently deleted.
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
