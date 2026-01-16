/**
 * Session Info Tab - Read-only session information display
 */

import {
  Phone,
  User,
  Clock,
  Calendar,
  Wifi,
  Smartphone,
  Globe,
  Key,
  Hash,
  Database,
  Radio,
  Users,
  Tv,
  MessageSquare,
  Loader2,
  FileText,
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn, formatDate } from '@/lib/utils'

import type { Session } from '@/features/sessions/api/session.api'

interface SessionInfoTabProps {
  session: Session
}

export function SessionInfoTab({ session }: SessionInfoTabProps) {
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
      {/* Merged Info Card */}
      <Card className="border-none bg-white dark:bg-secondary/20 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Session Information
          </CardTitle>
          <CardDescription>
            Overview of session details, configuration, and statistics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Session Details Section */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
              <Smartphone className="h-4 w-4" /> Basic Details
            </h4>
            <div className="space-y-0 divide-y rounded-lg border bg-gray-50/50 dark:bg-muted/30 shadow-inner p-4">
              <InfoRow icon={Hash} label="Session ID" value={session.id} mono />
              <InfoRow icon={Smartphone} label="Session Name" value={session.name} />
              {session.description && (
                <InfoRow icon={FileText} label="Description" value={session.description} />
              )}
              <InfoRow icon={Calendar} label="Created" value={session.createdAt ? formatDate(session.createdAt) : null} />
            </div>
          </div>

          {/* WhatsApp Info Section */}
          {(session.phoneNumber || session.pushName) && (
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" /> WhatsApp Account
              </h4>
              <div className="space-y-0 divide-y rounded-lg border bg-background/50">
                {session.phoneNumber && (
                  <InfoRow icon={Phone} label="Phone Number" value={session.phoneNumber} />
                )}
                {session.pushName && (
                  <InfoRow icon={User} label="Display Name" value={session.pushName} />
                )}
                {session.connectedAt && (
                  <InfoRow icon={Clock} label="Connected At" value={formatDate(session.connectedAt)} />
                )}
              </div>
            </div>
          )}

          {/* Configuration Section */}
          {session.config && (
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
                <Globe className="h-4 w-4" /> Configuration
              </h4>
              <div className="space-y-0 divide-y rounded-lg border bg-gray-50/50 dark:bg-muted/30 shadow-inner p-4">
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
                  icon={Smartphone} 
                  label="Browser Name" 
                  value={session.config.client?.browserName || 'Default'}
                />
                <InfoRow 
                  icon={Key} 
                  label="Debug Mode" 
                  value={session.config.debug ? 'Enabled' : 'Disabled'}
                  badge={session.config.debug ? { label: 'On', variant: 'destructive' } : undefined}
                />
                {/* Ignore settings */}
                {session.config.ignore && (
                  <>
                    {session.config.ignore.status && (
                      <InfoRow 
                        icon={Radio} 
                        label="Ignore Status" 
                        value="Enabled"
                        badge={{ label: 'Filtered', variant: 'secondary' }}
                      />
                    )}
                    {session.config.ignore.groups && (
                      <InfoRow 
                        icon={Users} 
                        label="Ignore Groups" 
                        value="Enabled"
                        badge={{ label: 'Filtered', variant: 'secondary' }}
                      />
                    )}
                    {session.config.ignore.channels && (
                      <InfoRow 
                        icon={Tv} 
                        label="Ignore Channels" 
                        value="Enabled"
                        badge={{ label: 'Filtered', variant: 'secondary' }}
                      />
                    )}
                    {session.config.ignore.broadcast && (
                      <InfoRow 
                        icon={MessageSquare} 
                        label="Ignore Broadcast" 
                        value="Enabled"
                        badge={{ label: 'Filtered', variant: 'secondary' }}
                      />
                    )}
                  </>
                )}
                
                {/* NOWEB Engine Config */}
                {session.config.noweb && (
                  <>
                    <InfoRow 
                      icon={Database} 
                      label="Store Enabled" 
                      value={session.config.noweb.store?.enabled ? 'Yes' : 'No'}
                      badge={session.config.noweb.store?.enabled ? { label: 'On', variant: 'success' } : undefined}
                    />
                    <InfoRow 
                      icon={Loader2} 
                      label="Full Sync" 
                      value={session.config.noweb.store?.fullSync ? 'Yes' : 'No'}
                      badge={session.config.noweb.store?.fullSync ? { label: 'On', variant: 'success' } : undefined}
                    />
                    <InfoRow 
                      icon={Wifi} 
                      label="Mark Online" 
                      value={session.config.noweb.markOnline ? 'Yes' : 'No'}
                      badge={session.config.noweb.markOnline ? { label: 'On', variant: 'success' } : undefined}
                    />
                  </>
                )}
              </div>
            </div>
          )}

          {/* Statistics Section */}
          {session._count && (
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
                <Hash className="h-4 w-4" /> Statistics
              </h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-lg bg-gray-50/50 dark:bg-muted/30 shadow-inner border border-gray-100 dark:border-gray-800">
                  <p className="text-2xl font-bold">{session._count.webhooks || 0}</p>
                  <p className="text-xs text-muted-foreground">Webhooks</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50/50 dark:bg-muted/30 shadow-inner border border-gray-100 dark:border-gray-800">
                  <p className="text-2xl font-bold">{session._count.messages || 0}</p>
                  <p className="text-xs text-muted-foreground">Messages</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50/50 dark:bg-muted/30 shadow-inner border border-gray-100 dark:border-gray-800">
                  <p className="text-2xl font-bold">{session._count.chats || 0}</p>
                  <p className="text-xs text-muted-foreground">Chats</p>
                </div>
              </div>
            </div>
          )}

          {/* Metadata Section */}
          {session.config?.metadata && Object.keys(session.config.metadata).length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
                <FileText className="h-4 w-4" /> Custom Metadata
              </h4>
              <pre className="p-3 rounded-lg bg-muted text-sm font-mono overflow-x-auto shadow-inner">
                {JSON.stringify(session.config.metadata, null, 2)}
              </pre>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  )
}
