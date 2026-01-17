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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
  const [isRestartDialogOpen, setIsRestartDialogOpen] = useState(false)

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
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between bg-card p-6 rounded-2xl shadow-sm">
      <div className="flex items-start gap-5">
        {/* Session Avatar */}
        <div className={cn(
          "w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-inner transition-all duration-300",
          isConnected 
            ? "bg-green-50 dark:bg-green-950/20" 
            : "bg-gray-50/50 dark:bg-secondary/20"
        )}>
          {session.profilePicUrl ? (
            <img src={session.profilePicUrl} alt="" className="w-14 h-14 rounded-xl object-cover" />
          ) : (
            <Smartphone className={cn("h-7 w-7 transition-colors duration-300", isConnected ? "text-green-600 dark:text-green-400" : "text-muted-foreground")} />
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-foreground">{session.name}</h1>
            <div className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1.5 border", statusConfig.color)}>
              <StatusIcon className={cn("h-3 w-3", (statusConfig as { animate?: boolean }).animate && "animate-spin")} />
              {statusConfig.label}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            {session.phoneNumber && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 opacity-70" />
                {session.phoneNumber}
              </span>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xs opacity-50">ID:</span>
              <button
                onClick={handleCopyId}
                className="flex items-center gap-1.5 hover:text-foreground transition-colors group"
                title="Click to copy ID"
              >
                <div className="font-mono text-[11px] bg-gray-50/50 dark:bg-secondary/20 px-1.5 py-0.5 rounded shadow-inner transition-all">
                  {session.id}
                </div>
                {idCopied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 opacity-30 group-hover:opacity-100" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 self-start mt-4 md:mt-0">
        {isConnected && (
          <Button variant="outline" size="sm" onClick={onSendMessage} className="h-9 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 border-emerald-200 shadow-sm">
            <Send className="h-4 w-4 mr-2" />
            Message
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => setIsRestartDialogOpen(true)} disabled={isRestartPending} className="h-9 bg-orange-50 text-orange-600 hover:bg-orange-100 hover:text-orange-700 border-orange-200 shadow-sm">
          <RefreshCw className={cn("h-4 w-4 mr-2", isRestartPending && "animate-spin")} />
          Restart
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:bg-gray-100 dark:hover:bg-secondary/20">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {isConnected && (
              <DropdownMenuItem onClick={onLogout}>
                <LogOut className="mr-2 h-4 w-4 text-muted-foreground" />
                Logout Session
              </DropdownMenuItem>
            )}
            {isConnected && <DropdownMenuSeparator />}
            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={onDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Session
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={isRestartDialogOpen} onOpenChange={setIsRestartDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restart Session?</AlertDialogTitle>
            <div className="text-sm text-muted-foreground space-y-3 mt-2">
              <p>
                This action will <span className="font-semibold text-destructive">terminate the current connection</span> and start a fresh WhatsApp instance.
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Existing connection will be closed immediately.</li>
                <li>System will attempt to reconnect automatically using saved session.</li>
                <li>If reconnection fails, you may need to scan a new QR code.</li>
                <li>Process typically takes 10-30 seconds.</li>
              </ul>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onRestart} className="bg-orange-600 hover:bg-orange-700">Restart Session</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
