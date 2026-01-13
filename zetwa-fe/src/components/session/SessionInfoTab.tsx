/**
 * Session Info Tab - Read-only session information display
 */

import {
  Phone,
  User,
  Clock,
  Calendar,
  Wifi,
  WifiOff,
  Smartphone,
  Globe,
  Key,
  Hash,
  Database,
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn, formatRelativeTime, formatDate } from '@/lib/utils'

import type { Session } from '@/api/session.api'
import { getSessionStatus } from './SessionCard'

interface SessionInfoTabProps {
  session: Session
}

export function SessionInfoTab({ session }: SessionInfoTabProps) {
  const status = session.liveStatus || session.status
  const statusConfig = getSessionStatus(status)
  const StatusIcon = statusConfig.icon
  const isConnected = session.isOnline || status === 'CONNECTED' || status === 'WORKING'

  const InfoRow = ({ icon: Icon, label, value, badge, mono }: {
    icon: typeof Phone
    label: string
    value: string | null | undefined
    badge?: { label: string; variant: 'success' | 'secondary' | 'destructive' }
    mono?: boolean
  }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
        <span className={cn("text-sm font-medium", mono && "font-mono")}>{value || '-'}</span>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card className={cn(
        isConnected
          ? "border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-950/10"
          : "border-gray-200 dark:border-gray-800"
      )}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="h-5 w-5 text-green-600" />
            ) : (
              <WifiOff className="h-5 w-5 text-muted-foreground" />
            )}
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant={statusConfig.variant} className="gap-1.5 text-sm py-1 px-3">
                <StatusIcon className={cn("h-4 w-4", (statusConfig as { animate?: boolean }).animate && "animate-spin")} />
                {statusConfig.label}
              </Badge>
            </div>
            {session.connectedAt && (
              <div className="text-right text-sm text-muted-foreground">
                <p>Connected since</p>
                <p className="font-medium">{formatRelativeTime(session.connectedAt)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Session Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Session Details
          </CardTitle>
          <CardDescription>
            Core session information and identifiers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-0 divide-y">
          <InfoRow icon={Hash} label="Session ID" value={session.id} mono />
          <InfoRow icon={Smartphone} label="Session Name" value={session.name} />
          <InfoRow icon={Calendar} label="Created" value={session.createdAt ? formatDate(session.createdAt) : null} />
        </CardContent>
      </Card>

      {/* WhatsApp Info */}
      {(session.phoneNumber || session.pushName) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              WhatsApp Account
            </CardTitle>
            <CardDescription>
              Connected WhatsApp account information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-0 divide-y">
            {session.phoneNumber && (
              <InfoRow icon={Phone} label="Phone Number" value={session.phoneNumber} />
            )}
            {session.pushName && (
              <InfoRow icon={User} label="Display Name" value={session.pushName} />
            )}
            {session.connectedAt && (
              <InfoRow icon={Clock} label="Connected At" value={formatDate(session.connectedAt)} />
            )}
          </CardContent>
        </Card>
      )}

      {/* Configuration Summary */}
      {session.config && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Configuration
            </CardTitle>
            <CardDescription>
              Current session configuration overview
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-0 divide-y">
            <InfoRow 
              icon={Globe} 
              label="Proxy" 
              value={session.config.proxy?.server || 'Not configured'}
              badge={session.config.proxy ? { label: 'Enabled', variant: 'success' } : undefined}
            />
            <InfoRow 
              icon={Smartphone} 
              label="Device Name" 
              value={session.config.client?.deviceName || 'Default'}
            />
            <InfoRow 
              icon={Key} 
              label="Debug Mode" 
              value={session.config.debug ? 'Enabled' : 'Disabled'}
              badge={session.config.debug ? { label: 'On', variant: 'destructive' } : undefined}
            />
          </CardContent>
        </Card>
      )}

      {/* Counts */}
      {session._count && (
        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-lg bg-muted/30">
                <p className="text-2xl font-bold">{session._count.webhooks || 0}</p>
                <p className="text-xs text-muted-foreground">Webhooks</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/30">
                <p className="text-2xl font-bold">{session._count.messages || 0}</p>
                <p className="text-xs text-muted-foreground">Messages</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/30">
                <p className="text-2xl font-bold">{session._count.chats || 0}</p>
                <p className="text-xs text-muted-foreground">Chats</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      {session.config?.metadata && Object.keys(session.config.metadata).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Custom Metadata</CardTitle>
            <CardDescription>
              Key-value pairs included in webhook payloads
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="p-3 rounded-lg bg-muted text-sm font-mono overflow-x-auto">
              {JSON.stringify(session.config.metadata, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
