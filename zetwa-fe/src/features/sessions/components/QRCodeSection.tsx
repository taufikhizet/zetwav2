/**
 * QR Code Section Component - Clean QR/Auth display with proper state handling
 * 
 * Session Status Handling:
 * - STOPPED: Session not running - show start button
 * - STARTING/INITIALIZING: Loading state while session starts
 * - QR_READY/SCAN_QR/SCAN_QR_CODE: Display QR code for scanning
 * - AUTHENTICATING/AUTHENTICATED: User scanned, waiting for WhatsApp confirmation
 * - CONNECTED: Session active (this component shouldn't show)
 * - DISCONNECTED/LOGGED_OUT/FAILED: Show reconnect option
 * 
 * QR Code Sources (priority order):
 * 1. Socket real-time QR (fastest, most reliable)
 * 2. API fetch (fallback if socket not connected)
 * 3. Session data QR (initial load from DB)
 * 
 * Design Decisions:
 * - NO auto-refresh indicator/timer (misleading - we can't control WhatsApp's timing)
 * - NO "Refresh now" button (doesn't actually get new QR from WhatsApp)
 * - Only poll API if socket QR not available (reduce server load)
 * - Clean, professional UI without unnecessary complexity
 */

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Loader2,
  RefreshCw,
  QrCode,
  Phone,
  Copy,
  Check,
  Play,
  WifiOff,
  LogOut,
  XCircle,
  Smartphone,
  AlertTriangle,
  Info,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { sessionApi } from '@/features/sessions/api/session.api'

// Only poll if no socket QR available - reduce server load
const QR_POLL_INTERVAL = 10000 // 10 seconds - not too aggressive

type SessionStatus = 
  | 'STOPPED' 
  | 'STARTING' 
  | 'INITIALIZING' 
  | 'QR_READY' 
  | 'SCAN_QR'
  | 'SCAN_QR_CODE'
  | 'AUTHENTICATED'
  | 'AUTHENTICATING' 
  | 'CONNECTED' 
  | 'WORKING'
  | 'DISCONNECTED' 
  | 'LOGGED_OUT' 
  | 'FAILED'
  | 'QR_TIMEOUT'

interface QRCodeSectionProps {
  /** Session ID for API calls */
  sessionId: string
  /** Current session status */
  status: SessionStatus
  /** QR code from socket (realtime) - takes priority */
  socketQR: string | null
  /** QR code from session data (initial load) */
  sessionQR?: string | null
  /** Whether session is connected */
  isConnected: boolean
  /** Whether currently restarting */
  isRestarting: boolean
  /** Restart session handler */
  onRestart: () => void
  /** Is restart pending */
  isRestartPending: boolean
  /** Request pairing code handler */
  onRequestPairingCode: (phone: string) => void
  /** Current pairing code */
  pairingCode: string | null
  /** Is pairing request pending */
  isPairingPending: boolean
  /** Start session handler (for STOPPED state) */
  onStart?: () => void
  /** Is start pending */
  isStartPending?: boolean
}

export function QRCodeSection({
  sessionId,
  status,
  socketQR,
  sessionQR,
  isConnected,
  onRestart,
  isRestartPending,
  onRequestPairingCode,
  pairingCode,
  isPairingPending,
  onStart,
  isStartPending,
}: QRCodeSectionProps) {
  const [authMethod, setAuthMethod] = useState<'qr' | 'phone'>('qr')
  const [pairingPhone, setPairingPhone] = useState('')
  const [pairingCodeCopied, setPairingCodeCopied] = useState(false)

  // Status helpers
  const isAuthenticating = ['AUTHENTICATED', 'AUTHENTICATING'].includes(status)
  const isWaitingForQR = ['QR_READY', 'SCAN_QR', 'SCAN_QR_CODE', 'INITIALIZING', 'STARTING'].includes(status)
  
  // Only poll API if:
  // 1. Not connected
  // 2. Not authenticating (prevent race condition)
  // 3. Waiting for QR
  // 4. No socket QR available (socket is preferred)
  const shouldPollAPI = !isConnected && !isAuthenticating && isWaitingForQR && !socketQR

  // API QR fetch using smart endpoint - only as fallback when socket QR not available
  const { data: apiQR, isLoading: isLoadingQR } = useQuery({
    queryKey: ['session-qr', sessionId],
    queryFn: () => sessionApi.getAuthQR(sessionId, { 
      format: 'image',
      // Don't auto-restart or wait from frontend - let user control
    }),
    enabled: shouldPollAPI,
    refetchInterval: shouldPollAPI ? QR_POLL_INTERVAL : false,
    staleTime: QR_POLL_INTERVAL - 1000,
    refetchOnWindowFocus: false, // Don't refetch on tab switch
    retry: 2,
  })

  // QR priority: Socket > API > Session data
  // Socket is real-time, API is polling fallback, session is initial load
  const qrCode = socketQR || apiQR?.qrCode || apiQR?.value || sessionQR || null
  
  // If API returns action='restart', session needs to be restarted to get new QR
  const needsRestart = apiQR?.action === 'restart'
  const apiMessage = apiQR?.message

  // Loading state - only show when actively waiting for QR
  const isLoadingQRCode = isWaitingForQR && !qrCode && (isLoadingQR || !socketQR)

  const handleCopyPairingCode = useCallback(async () => {
    if (!pairingCode) return
    await navigator.clipboard.writeText(pairingCode.replace('-', ''))
    setPairingCodeCopied(true)
    setTimeout(() => setPairingCodeCopied(false), 2000)
  }, [pairingCode])

  const handleRequestPairingCode = useCallback(() => {
    const cleanPhone = pairingPhone.replace(/\D/g, '')
    if (cleanPhone.length >= 10) {
      onRequestPairingCode(cleanPhone)
    }
  }, [pairingPhone, onRequestPairingCode])

  // Don't render if connected
  if (isConnected) return null

  // Get UI configuration based on status
  const getStateConfig = () => {
    // If API explicitly says restart is needed, override to show restart UI
    if (needsRestart && apiMessage) {
      return {
        icon: <XCircle className="h-8 w-8" />,
        iconBg: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
        title: 'Session Needs Restart',
        description: apiMessage,
        showQR: false,
        action: (
          <Button onClick={onRestart} disabled={isRestartPending}>
            {isRestartPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <RefreshCw className={cn("h-4 w-4 mr-2", isRestartPending && "animate-spin")} />
            Get New QR Code
          </Button>
        ),
      }
    }
    
    switch (status) {
      case 'STOPPED':
        return {
          icon: <Play className="h-8 w-8" />,
          iconBg: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
          title: 'Session Stopped',
          description: 'Start the session to connect WhatsApp',
          showQR: false,
          action: onStart && (
            <Button onClick={onStart} disabled={isStartPending}>
              {isStartPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Play className="h-4 w-4 mr-2" />
              Start Session
            </Button>
          ),
        }
      
      case 'STARTING':
      case 'INITIALIZING':
        return {
          icon: <Loader2 className="h-8 w-8 animate-spin" />,
          iconBg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
          title: 'Starting Session',
          description: 'Initializing WhatsApp connection...',
          showQR: true,
          action: null,
        }
      
      case 'QR_READY':
      case 'SCAN_QR':
      case 'SCAN_QR_CODE':
        return {
          icon: <QrCode className="h-8 w-8" />,
          iconBg: 'bg-primary/10 text-primary',
          title: 'Scan QR Code',
          description: 'Open WhatsApp on your phone to link this device',
          showQR: true,
          action: null,
        }
      
      case 'AUTHENTICATING':
      case 'AUTHENTICATED':
        return {
          icon: <Smartphone className="h-8 w-8 animate-pulse" />,
          iconBg: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
          title: 'Authenticating',
          description: 'Confirming connection with WhatsApp...',
          showQR: false,
          action: null,
        }
      
      case 'DISCONNECTED':
        return {
          icon: <WifiOff className="h-8 w-8" />,
          iconBg: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
          title: 'Disconnected',
          description: apiMessage || 'Connection lost. Restart to reconnect.',
          showQR: false,
          action: (
            <Button onClick={onRestart} disabled={isRestartPending}>
              {isRestartPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <RefreshCw className={cn("h-4 w-4 mr-2", isRestartPending && "animate-spin")} />
              Reconnect
            </Button>
          ),
        }
      
      case 'LOGGED_OUT':
        return {
          icon: <LogOut className="h-8 w-8" />,
          iconBg: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
          title: 'Logged Out',
          description: apiMessage || 'This session was logged out from WhatsApp',
          showQR: false,
          action: (
            <Button onClick={onRestart} disabled={isRestartPending}>
              {isRestartPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <RefreshCw className={cn("h-4 w-4 mr-2", isRestartPending && "animate-spin")} />
              Restart Session
            </Button>
          ),
        }
      
      case 'FAILED':
      case 'QR_TIMEOUT':
        return {
          icon: <XCircle className="h-8 w-8" />,
          iconBg: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
          title: status === 'QR_TIMEOUT' ? 'QR Code Expired' : 'Session Failed',
          description: apiMessage || (status === 'QR_TIMEOUT' 
            ? 'QR code was not scanned in time.' 
            : 'Something went wrong. Please try again.'),
          showQR: false,
          action: (
            <Button onClick={onRestart} disabled={isRestartPending}>
              {isRestartPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <RefreshCw className={cn("h-4 w-4 mr-2", isRestartPending && "animate-spin")} />
              Get New QR Code
            </Button>
          ),
        }
      
      default:
        return {
          icon: <AlertTriangle className="h-8 w-8" />,
          iconBg: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
          title: 'Unknown State',
          description: apiMessage || `Session status: ${status}`,
          showQR: false,
          action: (
            <Button onClick={onRestart} disabled={isRestartPending}>
              {isRestartPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <RefreshCw className={cn("h-4 w-4 mr-2", isRestartPending && "animate-spin")} />
              Restart Session
            </Button>
          ),
        }
    }
  }

  const config = getStateConfig()

  return (
    <Card className="overflow-hidden border-2 border-primary/10">
      <div className="grid md:grid-cols-2 gap-0">
        {/* Left Side: Status & Actions */}
        <div className="p-8 flex flex-col justify-center bg-muted/30">
          <div className="flex items-start gap-4 mb-6">
            <div className={cn("p-3 rounded-xl flex items-center justify-center shrink-0", config.iconBg)}>
              {config.icon}
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">{config.title}</h3>
              <p className="text-muted-foreground">{config.description}</p>
            </div>
          </div>
          
          <div className="mt-auto">
            {config.action}
          </div>
        </div>

        {/* Right Side: Auth Methods (QR/Phone) */}
        {config.showQR && (
          <div className="border-t md:border-t-0 md:border-l bg-background p-6">
            <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as 'qr' | 'phone')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="qr">
                  <QrCode className="h-4 w-4 mr-2" />
                  Scan QR
                </TabsTrigger>
                <TabsTrigger value="phone">
                  <Phone className="h-4 w-4 mr-2" />
                  Pairing Code
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="qr" className="mt-0">
                <div className="flex flex-col items-center justify-center min-h-[300px]">
                  {isLoadingQRCode ? (
                    <div className="flex flex-col items-center gap-4 text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <p>Waiting for QR code...</p>
                    </div>
                  ) : qrCode ? (
                    <div className="relative group">
                      <div className="bg-white p-4 rounded-xl border-2 border-slate-100 shadow-sm">
                         <img 
                           src={qrCode} 
                           alt="WhatsApp QR Code" 
                           className="w-64 h-64 object-contain" 
                         />
                      </div>
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl backdrop-blur-sm">
                         <p className="text-white font-medium">Scan with WhatsApp</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground p-8">
                      <QrCode className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>QR code not available</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="phone" className="mt-0">
                <div className="flex flex-col justify-center min-h-[300px] space-y-6">
                  {!pairingCode ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input 
                          id="phone" 
                          placeholder="e.g. 6281234567890" 
                          value={pairingPhone}
                          onChange={(e) => setPairingPhone(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter number with country code (no + or spaces)
                        </p>
                      </div>
                      <Button 
                        className="w-full" 
                        onClick={handleRequestPairingCode}
                        disabled={isPairingPending || pairingPhone.length < 10}
                      >
                        {isPairingPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Requesting...
                          </>
                        ) : (
                          <>
                            <Smartphone className="mr-2 h-4 w-4" />
                            Get Pairing Code
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6 text-center">
                      <div className="bg-muted/50 p-6 rounded-xl border-2 border-dashed">
                        <p className="text-sm text-muted-foreground mb-2">Enter this code on your phone:</p>
                        <div className="text-3xl font-mono font-bold tracking-wider text-primary">
                          {pairingCode}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={handleCopyPairingCode}
                        >
                          {pairingCodeCopied ? (
                            <>
                              <Check className="mr-2 h-4 w-4" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="mr-2 h-4 w-4" />
                              Copy Code
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="flex-1"
                          onClick={() => setPairingPhone('')} // Reset flow to try again
                        >
                          Try Another Number
                        </Button>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex gap-3 text-left">
                        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                          Open WhatsApp on your phone &gt; Linked Devices &gt; Link a Device &gt; Link with phone number instead
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </Card>
  )
}
