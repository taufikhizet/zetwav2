/**
 * Session Header Component - Header section with session info and actions
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
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
  const navigate = useNavigate()
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
    <div className="border-b bg-gradient-to-r from-background to-muted/30">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/sessions')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            {/* Session Avatar */}
            <div className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center",
              isConnected ? "bg-green-100 dark:bg-green-900/30" : "bg-muted"
            )}>
              {session.profilePicUrl ? (
                <img src={session.profilePicUrl} alt="" className="w-14 h-14 rounded-full object-cover" />
              ) : (
                <Smartphone className={cn("h-7 w-7", isConnected ? "text-green-600" : "text-muted-foreground")} />
              )}
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{session.name}</h1>
                <div className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1.5", statusConfig.color)}>
                  <StatusIcon className={cn("h-3 w-3", (statusConfig as { animate?: boolean }).animate && "animate-spin")} />
                  {statusConfig.label}
                </div>
              </div>
              {session.description && (
                <p className="text-muted-foreground mt-1">{session.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                {session.phoneNumber && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    {session.phoneNumber}
                  </span>
                )}
                {session.pushName && (
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {session.pushName}
                  </span>
                )}
                <button
                  onClick={handleCopyId}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  {idCopied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  <span className="font-mono text-xs">{session.id.slice(0, 8)}...</span>
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {isConnected && (
              <Button variant="outline" onClick={onSendMessage}>
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            )}
            <Button variant="outline" onClick={onRestart} disabled={isRestartPending}>
              <RefreshCw className={cn("h-4 w-4 mr-2", isRestartPending && "animate-spin")} />
              Restart
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
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
                <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Session
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  )
}
