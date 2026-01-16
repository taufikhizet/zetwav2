import { Link } from 'react-router-dom'
import { Smartphone, Plus, Clock, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn, getStatusColor, getStatusText, formatRelativeTime } from '@/lib/utils'

interface Session {
  id: string
  name: string
  phoneNumber?: string | null
  status: string
  liveStatus?: string | null
  isOnline?: boolean
  lastSeen?: string | null
  updatedAt?: string
}

interface RecentSessionsCardProps {
  sessions: Session[]
  maxItems?: number
  className?: string
}

export function RecentSessionsCard({
  sessions,
  maxItems = 5,
  className,
}: RecentSessionsCardProps) {
  const displaySessions = sessions.slice(0, maxItems)

  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-base">Recent Sessions</CardTitle>
          <CardDescription>Your WhatsApp connections</CardDescription>
        </div>
        {sessions.length > 0 && (
          <Link to="/dashboard/sessions">
            <Button variant="ghost" size="sm" className="gap-1">
              View all
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Smartphone className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">No sessions yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first WhatsApp session to get started
            </p>
            <Link to="/dashboard/sessions/new">
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Create Session
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {displaySessions.map((session) => {
              const status = session.liveStatus || session.status
              const statusColor = getStatusColor(status)

              return (
                <Link
                  key={session.id}
                  to={`/dashboard/sessions/${session.id}`}
                  className="group flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Smartphone className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className={cn(
                        'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background',
                        statusColor
                      )} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{session.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="truncate">
                          {session.phoneNumber || 'Not connected'}
                        </span>
                        {session.lastSeen && (
                          <>
                            <span className="shrink-0">•</span>
                            <span className="flex items-center gap-1 shrink-0">
                              <Clock className="h-3 w-3" />
                              {formatRelativeTime(session.lastSeen)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={session.isOnline ? 'success' : 'secondary'}
                    className="shrink-0 ml-2"
                  >
                    {getStatusText(status)}
                  </Badge>
                </Link>
              )
            })}

            {sessions.length > maxItems && (
              <div className="text-center pt-2">
                <Link to="/dashboard/sessions">
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    +{sessions.length - maxItems} more sessions
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
