/**
 * Session Header Component - Header section with session info and actions
 */

import { useState } from 'react'
import {
  RefreshCw,
  LogOut,
  Trash2,
  Send,
  MoreVertical,
  Phone,
  User,
  Copy,
  Check,
  Smartphone,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

import type { Session } from '@/features/sessions/api/session.api'
import { getSessionStatus } from './SessionCard'

interface SessionHeaderProps {
  session: Session
  onRestart: () => void
  onLogout: () => void
  onDelete: () => void
  onSendMessage: () => void
  isRestartPending?: boolean
}

export function SessionHeader({
  session,
  onRestart,
  onLogout,
  onDelete,
  onSendMessage,
  isRestartPending,
}: SessionHeaderProps) {
  const [idCopied, setIdCopied] = useState(false)

  const status = session.liveStatus || session.status
  const statusConfig = getSessionStatus(status)
  const StatusIcon = statusConfig.icon
  const isConnected = session.isOnline || status === 'CONNECTED' || status === 'WORKING'

  const handleCopyId = async () => {
    await navigator.clipboard.writeText(session.id)
    setIdCopied(true)
    setTimeout(() => setIdCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="flex items-start gap-4">
        {/* Session Avatar */}
        <div className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm transition-all duration-300",
          isConnected 
            ? "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-100 dark:border-green-900/50 shadow-[0_0_15px_rgba(34,197,94,0.15)]" 
            : "bg-muted/50 border-border/50"
        )}>
          {session.profilePicUrl ? (
            <img src={session.profilePicUrl} alt="" className="w-16 h-16 rounded-2xl object-cover" />
          ) : (
            <Smartphone className={cn("h-8 w-8 transition-colors duration-300", isConnected ? "text-green-600 dark:text-green-400" : "text-muted-foreground")} />
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{session.name}</h1>
            <div className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1.5 border shadow-sm", statusConfig.color)}>
              <StatusIcon className={cn("h-3 w-3", (statusConfig as { animate?: boolean }).animate && "animate-spin")} />
              {statusConfig.label}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {session.phoneNumber && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                {session.phoneNumber}
              </span>
            )}
            {session.pushName && (
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {session.pushName}
              </span>
            )}
            <button
              onClick={handleCopyId}
              className="flex items-center gap-1.5 hover:text-foreground transition-colors group"
              title="Click to copy ID"
            >
              <div className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded border group-hover:border-primary/50 transition-colors">
                {session.id}
              </div>
              {idCopied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100" />}
            </button>
          </div>
          
          {session.description && (
            <p className="text-sm text-muted-foreground pt-1">{session.description}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 self-start mt-4 md:mt-0">
        {isConnected && (
          <Button variant="outline" size="sm" onClick={onSendMessage} className="h-9">
            <Send className="h-4 w-4 mr-2" />
            Message
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={onRestart} disabled={isRestartPending} className="h-9">
          <RefreshCw className={cn("h-4 w-4 mr-2", isRestartPending && "animate-spin")} />
          Restart
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isConnected && (
              <DropdownMenuItem onClick={onLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Session
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
