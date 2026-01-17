import { Link } from 'react-router-dom'
import {
  MoreVertical,
  Trash2,
  RefreshCw,
  LogOut,
  Eye,
  Smartphone,
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
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn, formatRelativeTime } from '@/lib/utils'
import type { Session } from '@/features/sessions/api/session.api'

// Modern status mapping with softer colors for KasirKita style
export const SESSION_STATUS = {
  STOPPED: { label: 'Stopped', color: 'bg-gray-100 text-gray-600', icon: Square },
  STARTING: { label: 'Starting', color: 'bg-yellow-100 text-yellow-700', icon: Loader2, animate: true },
  INITIALIZING: { label: 'Initializing', color: 'bg-blue-100 text-blue-700', icon: Loader2, animate: true },
  SCAN_QR: { label: 'Scan QR', color: 'bg-indigo-100 text-indigo-700', icon: QrCode, animate: true },
  SCAN_QR_CODE: { label: 'Scan QR', color: 'bg-indigo-100 text-indigo-700', icon: QrCode, animate: true },
  QR_READY: { label: 'QR Ready', color: 'bg-indigo-100 text-indigo-700', icon: QrCode, animate: true },
  AUTHENTICATING: { label: 'Connecting', color: 'bg-yellow-100 text-yellow-700', icon: Loader2, animate: true },
  WORKING: { label: 'Active', color: 'bg-emerald-100 text-emerald-700', icon: Wifi },
  CONNECTED: { label: 'Connected', color: 'bg-emerald-100 text-emerald-700', icon: Wifi },
  FAILED: { label: 'Failed', color: 'bg-red-100 text-red-700', icon: WifiOff },
  DISCONNECTED: { label: 'Disconnected', color: 'bg-orange-100 text-orange-700', icon: WifiOff },
  LOGGED_OUT: { label: 'Logged Out', color: 'bg-gray-100 text-gray-600', icon: LogOut },
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
  viewMode?: 'grid' | 'list'
}

export function SessionCard({
  session,
  onRestart,
  onLogout,
  onDelete,
  isRestartPending,
  isLogoutPending,
  viewMode = 'grid',
}: SessionCardProps) {
  const status = session.liveStatus || session.status
  const statusConfig = getSessionStatus(status)
  const StatusIcon = statusConfig.icon
  const isOnline = session.isOnline || status === 'CONNECTED' || status === 'WORKING'
  
  // Safe access for optional animate property
  const isAnimating = 'animate' in statusConfig && statusConfig.animate

  if (viewMode === 'list') {
    return (
      <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
        <div className="flex flex-col sm:flex-row items-center p-4 gap-4">
          {/* Icon & Basic Info */}
          <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
             <div className={cn(
                 "relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors",
                 isOnline ? "bg-emerald-50 text-emerald-600 shadow-md shadow-emerald-500/20" : "bg-gray-50/50 text-muted-foreground shadow-inner"
             )}>
                 {session.profilePicUrl ? (
                     <img 
                         src={session.profilePicUrl} 
                         alt={session.name} 
                         className="h-full w-full rounded-xl object-cover" 
                     />
                 ) : (
                     <Smartphone className="h-6 w-6" />
                 )}
                 {isOnline && (
                     <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                         <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                         <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white"></span>
                     </span>
                 )}
             </div>
             <div className="space-y-1 min-w-0">
                 <h3 className="font-bold text-base leading-none tracking-tight text-gray-900 truncate">{session.name}</h3>
                 <p className="text-xs text-muted-foreground truncate">{session.phoneNumber || 'No phone connected'}</p>
             </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
             <div className={cn("px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap", statusConfig.color)}>
                 <StatusIcon className={cn("h-3 w-3", isAnimating && "animate-spin")} />
                 {statusConfig.label}
             </div>
             {session.updatedAt && (
                 <div className="flex items-center text-xs text-gray-400 sm:hidden" title={new Date(session.updatedAt).toLocaleString()}>
                     <Clock className="mr-1 h-3 w-3" />
                     {formatRelativeTime(session.updatedAt)}
                 </div>
             )}
          </div>

          {/* Stats - Hidden on very small screens, visible on md+ */}
          <div className="hidden md:flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1.5" title="Webhooks">
              <Webhook className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{session._count?.webhooks || 0}</span>
            </div>
            <div className="flex items-center gap-1.5" title="Messages">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{session._count?.messages || 0}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 border-t sm:border-t-0 pt-2 sm:pt-0">
             <Button className="flex-1 sm:flex-none h-9 text-xs font-semibold shadow-sm" variant={isOnline ? "outline" : "default"} asChild>
                <Link to={`/dashboard/sessions/${session.id}`}>
                    {isOnline ? 'Manage' : 'Connect'}
                </Link>
             </Button>
             
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-gray-100 p-1">
                    <DropdownMenuItem onClick={() => onRestart(session.id)} disabled={isRestartPending} className="cursor-pointer rounded-lg px-2 py-1.5 text-xs">
                        <RefreshCw className={cn("mr-2 h-3.5 w-3.5", isRestartPending && "animate-spin")} /> 
                        Restart
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onLogout(session.id)} disabled={isLogoutPending} className="cursor-pointer rounded-lg px-2 py-1.5 text-xs">
                        <LogOut className="mr-2 h-3.5 w-3.5" /> 
                        Logout
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-1" />
                    <DropdownMenuItem 
                        onClick={() => onDelete(session)} 
                        className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer rounded-lg px-2 py-1.5 text-xs"
                    >
                        <Trash2 className="mr-2 h-3.5 w-3.5" /> 
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 p-6">
         <div className="flex items-center gap-4">
            <div className={cn(
                "relative flex h-14 w-14 items-center justify-center rounded-2xl transition-colors",
                isOnline ? "bg-emerald-50 text-emerald-600 shadow-md shadow-emerald-500/20" : "bg-gray-50/50 text-muted-foreground shadow-inner"
            )}>
                {session.profilePicUrl ? (
                    <img 
                        src={session.profilePicUrl} 
                        alt={session.name} 
                        className="h-full w-full rounded-2xl object-cover" 
                    />
                ) : (
                    <Smartphone className="h-7 w-7" />
                )}
                {isOnline && (
                    <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
                    </span>
                )}
            </div>
            <div className="space-y-1">
                <h3 className="font-bold text-lg leading-none tracking-tight text-gray-900">{session.name}</h3>
                <p className="text-sm text-muted-foreground">{session.phoneNumber || 'No phone connected'}</p>
            </div>
         </div>

         <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-2xl shadow-xl border-gray-100 p-2">
                <DropdownMenuItem asChild className="cursor-pointer rounded-xl px-3 py-2">
                    <Link to={`/dashboard/sessions/${session.id}`}>
                        <Eye className="mr-2 h-4 w-4" /> View Details
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem onClick={() => onRestart(session.id)} disabled={isRestartPending} className="cursor-pointer rounded-xl px-3 py-2">
                    <RefreshCw className={cn("mr-2 h-4 w-4", isRestartPending && "animate-spin")} /> 
                    Restart Session
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onLogout(session.id)} disabled={isLogoutPending} className="cursor-pointer rounded-xl px-3 py-2">
                    <LogOut className="mr-2 h-4 w-4" /> 
                    Logout Device
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem 
                    onClick={() => onDelete(session)} 
                    className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer rounded-xl px-3 py-2"
                >
                    <Trash2 className="mr-2 h-4 w-4" /> 
                    Delete Session
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="p-6 pt-2">
         <div className="flex items-center justify-between mb-6">
            <div className={cn("px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5", statusConfig.color)}>
                <StatusIcon className={cn("h-3.5 w-3.5", isAnimating && "animate-spin")} />
                {statusConfig.label}
            </div>
            {session.updatedAt && (
                <div className="flex items-center text-xs text-gray-400" title={new Date(session.updatedAt).toLocaleString()}>
                    <Clock className="mr-1.5 h-3.5 w-3.5" />
                    {formatRelativeTime(session.updatedAt)}
                </div>
            )}
         </div>

         <div className="grid grid-cols-2 gap-3">
             <div className="flex flex-col gap-1 p-3 rounded-2xl bg-gray-50/80 shadow-inner">
                 <span className="text-xs text-gray-500 font-medium">Webhooks</span>
                 <div className="flex items-center gap-2 text-gray-900 font-bold">
                    <Webhook className="h-4 w-4 text-primary" />
                    <span>{session._count?.webhooks || 0}</span>
                 </div>
             </div>
             <div className="flex flex-col gap-1 p-3 rounded-2xl bg-gray-50/80 shadow-inner">
                 <span className="text-xs text-gray-500 font-medium">Messages</span>
                 <div className="flex items-center gap-2 text-gray-900 font-bold">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <span>{session._count?.messages || 0}</span>
                 </div>
             </div>
         </div>
      </CardContent>

      <CardFooter className="p-6 pt-0">
          <Button className="w-full rounded-2xl h-11 font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all" variant={isOnline ? "outline" : "default"} asChild>
             <Link to={`/dashboard/sessions/${session.id}`}>
                 {isOnline ? 'Manage Session' : 'Connect Now'}
             </Link>
          </Button>
      </CardFooter>
    </Card>
  )
}
