import { CheckCircle2, AlertTriangle, XCircle, Activity, Server, Database, Wifi } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface SystemHealthProps {
  apiStatus: 'healthy' | 'degraded' | 'down'
  whatsappConnections: {
    active: number
    total: number
  }
  messageQueue?: {
    pending: number
    processed: number
  }
  uptime?: string
  className?: string
}

const statusConfig = {
  healthy: {
    icon: CheckCircle2,
    label: 'All Systems Operational',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  degraded: {
    icon: AlertTriangle,
    label: 'Partial Degradation',
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-50 dark:bg-yellow-950/50',
    border: 'border-yellow-200 dark:border-yellow-800',
  },
  down: {
    icon: XCircle,
    label: 'System Issues Detected',
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/50',
    border: 'border-red-200 dark:border-red-800',
  },
}

export function SystemHealthCard({
  apiStatus,
  whatsappConnections,
  messageQueue,
  uptime,
  className,
}: SystemHealthProps) {
  const config = statusConfig[apiStatus]
  const StatusIcon = config.icon
  const connectionPercentage = whatsappConnections.total > 0
    ? (whatsappConnections.active / whatsappConnections.total) * 100
    : 0

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">System Health</CardTitle>
            <CardDescription>Real-time system status</CardDescription>
          </div>
          <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium', config.bg, config.border, 'border')}>
            <StatusIcon className={cn('h-4 w-4', config.color)} />
            <span className={config.color}>{config.label}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* API Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Server className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <div className="text-sm font-medium">API Server</div>
              <div className="text-xs text-muted-foreground">Response time &lt; 100ms</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn('w-2 h-2 rounded-full', apiStatus === 'healthy' ? 'bg-emerald-500' : apiStatus === 'degraded' ? 'bg-yellow-500' : 'bg-red-500')} />
            <span className="text-sm capitalize">{apiStatus}</span>
          </div>
        </div>

        {/* WhatsApp Connections */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Wifi className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-sm font-medium">WhatsApp Sessions</div>
            </div>
            <span className="text-sm text-muted-foreground">
              {whatsappConnections.active} / {whatsappConnections.total} active
            </span>
          </div>
          <Progress value={connectionPercentage} className="h-2" />
        </div>

        {/* Message Queue */}
        {messageQueue && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <div className="text-sm font-medium">Message Queue</div>
                <div className="text-xs text-muted-foreground">{messageQueue.pending} pending</div>
              </div>
            </div>
            <span className="text-sm text-muted-foreground">
              {messageQueue.processed.toLocaleString()} processed
            </span>
          </div>
        )}

        {/* Uptime */}
        {uptime && (
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Database className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-sm font-medium">System Uptime</div>
            </div>
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{uptime}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
