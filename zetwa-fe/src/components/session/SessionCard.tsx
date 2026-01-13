/**
 * Session Card Component - Modern card display for a single session
 */

import { Link } from 'react-router-dom'
import {
  MoreVertical,
  Trash2,
  RefreshCw,
  LogOut,
  Eye,
  Smartphone,
  Phone,
  User,
  Webhook,
  MessageSquare,
  Clock,
  Wifi,
  WifiOff,
  QrCode,
  Loader2,
  Square,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn, formatRelativeTime } from '@/lib/utils'
import type { Session } from '@/api/session.api'

// WAHA-style status mapping
export const SESSION_STATUS = {
  STOPPED: { label: 'Stopped', color: 'bg-gray-400', icon: Square, variant: 'secondary' as const },
  STARTING: { label: 'Starting', color: 'bg-yellow-400', icon: Loader2, variant: 'warning' as const, animate: true },
  INITIALIZING: { label: 'Starting', color: 'bg-yellow-400', icon: Loader2, variant: 'warning' as const, animate: true },
  SCAN_QR_CODE: { label: 'Scan QR', color: 'bg-blue-400', icon: QrCode, variant: 'default' as const, animate: true },
  QR_READY: { label: 'Scan QR', color: 'bg-blue-400', icon: QrCode, variant: 'default' as const, animate: true },
  AUTHENTICATING: { label: 'Connecting', color: 'bg-yellow-400', icon: Loader2, variant: 'warning' as const, animate: true },
  WORKING: { label: 'Working', color: 'bg-green-500', icon: Wifi, variant: 'success' as const },
  CONNECTED: { label: 'Working', color: 'bg-green-500', icon: Wifi, variant: 'success' as const },
  FAILED: { label: 'Failed', color: 'bg-red-500', icon: WifiOff, variant: 'destructive' as const },
  DISCONNECTED: { label: 'Disconnected', color: 'bg-orange-500', icon: WifiOff, variant: 'warning' as const },
  LOGGED_OUT: { label: 'Logged Out', color: 'bg-gray-500', icon: LogOut, variant: 'secondary' as const },
} as const

export function getSessionStatus(status: string) {
  return SESSION_STATUS[status as keyof typeof SESSION_STATUS] || SESSION_STATUS.STOPPED
}

interface SessionCardProps {
  session: Session
  onRestart: (id: string) => void
  onLogout: (id: string) => void
  onDelete: (session: Session) => void
  isRestartPending?: boolean
  isLogoutPending?: boolean
}

export function SessionCard({
  session,
  onRestart,
  onLogout,
  onDelete,
  isRestartPending,
  isLogoutPending,
}: SessionCardProps) {
  const status = session.liveStatus || session.status
  const statusConfig = getSessionStatus(status)
  const StatusIcon = statusConfig.icon
  const isOnline = session.isOnline || status === 'CONNECTED' || status === 'WORKING'
  const needsAction = ['QR_READY', 'SCAN_QR_CODE', 'INITIALIZING'].includes(status)

  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-200 hover:shadow-lg",
      needsAction && "ring-2 ring-blue-400/50",
      isOnline && "ring-1 ring-green-500/30"
    )}>
      {/* Status indicator bar at top */}
      <div className={cn("h-1 w-full", statusConfig.color)} />

      <CardContent className="p-4">
        {/* Header: Name + Menu */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Avatar/Icon */}
            <div className={cn(
              "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
              isOnline ? "bg-green-100 dark:bg-green-900/30" : "bg-muted"
            )}>
              {session.profilePicUrl ? (
                <img
                  src={session.profilePicUrl}
                  alt={session.pushName || session.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <Smartphone className={cn(
                  "h-5 w-5",
                  isOnline ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                )} />
              )}
            </div>

            {/* Name & Description */}
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-base truncate">{session.name}</h3>
              {session.description && (
                <p className="text-xs text-muted-foreground truncate">{session.description}</p>
              )}
            </div>
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link to={`/dashboard/sessions/${session.id}`} className="flex items-center">
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRestart(session.id)} disabled={isRestartPending}>
                <RefreshCw className={cn("mr-2 h-4 w-4", isRestartPending && "animate-spin")} />
                {isRestartPending ? 'Restarting...' : 'Restart'}
              </DropdownMenuItem>
              {isOnline && (
                <DropdownMenuItem onClick={() => onLogout(session.id)} disabled={isLogoutPending}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {isLogoutPending ? 'Logging out...' : 'Logout'}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(session)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 mb-3">
          <Badge variant={statusConfig.variant} className="gap-1.5">
            <StatusIcon className={cn("h-3 w-3", (statusConfig as { animate?: boolean }).animate && "animate-spin")} />
            {statusConfig.label}
          </Badge>
          {needsAction && (
            <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
              Action Required
            </Badge>
          )}
        </div>

        {/* Info Grid */}
        <div className="space-y-2 text-sm">
          {/* Phone Number */}
          {session.phoneNumber && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                Phone
              </span>
              <span className="font-medium">{session.phoneNumber}</span>
            </div>
          )}

          {/* Push Name */}
          {session.pushName && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                Name
              </span>
              <span className="font-medium truncate max-w-[150px]">{session.pushName}</span>
            </div>
          )}

          {/* Webhooks Count */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Webhook className="h-3.5 w-3.5" />
              Webhooks
            </span>
            <span className="font-medium">{session._count?.webhooks || 0}</span>
          </div>

          {/* Messages Count */}
          {session._count?.messages !== undefined && session._count.messages > 0 && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <MessageSquare className="h-3.5 w-3.5" />
                Messages
              </span>
              <span className="font-medium">{session._count.messages}</span>
            </div>
          )}

          {/* Created */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Created
            </span>
            <span className="text-muted-foreground text-xs">
              {formatRelativeTime(session.createdAt)}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <Link to={`/dashboard/sessions/${session.id}`} className="block mt-4">
          <Button variant={needsAction ? "default" : "outline"} className="w-full" size="sm">
            {needsAction ? (
              <>
                <QrCode className="mr-2 h-4 w-4" />
                Connect WhatsApp
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Manage Session
              </>
            )}
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
