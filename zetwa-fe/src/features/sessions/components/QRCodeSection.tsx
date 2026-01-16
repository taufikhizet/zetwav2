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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
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
  isRestarting,
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
  const qrCode = socketQR || apiQR?.qr || sessionQR || null
  
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
              <RefreshCw className="h-4 w-4 mr-2" />
              Restart Session
            </Button>
          ),
        }
    }
  }

  // Restarting state
  if (isRestarting) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Connect WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Restarting Session</h3>
            <p className="text-muted-foreground">
              Please wait while we initialize the session...
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const stateConfig = getStateConfig()

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Connect WhatsApp
            </CardTitle>
            <CardDescription className="mt-1.5">
              {stateConfig.showQR 
                ? 'Scan the QR code or use a pairing code to link your WhatsApp account'
                : stateConfig.description
              }
            </CardDescription>
          </div>
          <Badge variant={stateConfig.showQR ? 'default' : 'secondary'} className="shrink-0">
            {status.replace(/_/g, ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Non-QR States */}
        {!stateConfig.showQR && (
          <div className="text-center py-8">
            <div className={cn("mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4", stateConfig.iconBg)}>
              {stateConfig.icon}
            </div>
            <h3 className="text-lg font-semibold mb-2">{stateConfig.title}</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {stateConfig.description}
            </p>
            {stateConfig.action}
          </div>
        )}

        {/* QR Code Display */}
        {stateConfig.showQR && (
          <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as 'qr' | 'phone')} className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
              <TabsTrigger value="qr">
                <QrCode className="h-4 w-4 mr-2" />
                QR Code
              </TabsTrigger>
              <TabsTrigger value="phone">
                <Phone className="h-4 w-4 mr-2" />
                Phone Number
              </TabsTrigger>
            </TabsList>

            <TabsContent value="qr" className="text-center">
              {/* QR Code Image */}
              <div className="inline-block p-4 bg-white rounded-xl shadow-lg">
                {qrCode ? (
                  <img 
                    src={qrCode} 
                    alt="Scan this QR code with WhatsApp" 
                    className="w-64 h-64"
                  />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center bg-muted rounded-lg">
                    {isLoadingQRCode ? (
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Loading QR code...</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <QrCode className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Waiting for QR code...</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Instructions */}
              <div className="mt-6 space-y-2 max-w-md mx-auto">
                <p className="text-sm text-muted-foreground font-medium flex items-center justify-center gap-1">
                  <Info className="h-4 w-4" />
                  How to scan:
                </p>
                <ol className="text-sm text-muted-foreground text-left list-decimal list-inside space-y-1 bg-muted/50 p-3 rounded-lg">
                  <li>Open WhatsApp on your phone</li>
                  <li>Go to <strong>Settings</strong> → <strong>Linked Devices</strong></li>
                  <li>Tap <strong>Link a Device</strong></li>
                  <li>Point your phone at this QR code</li>
                </ol>
              </div>
            </TabsContent>

            <TabsContent value="phone" className="max-w-md mx-auto">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    placeholder="e.g., 628123456789"
                    value={pairingPhone}
                    onChange={(e) => setPairingPhone(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter phone number with country code (without + or spaces)
                  </p>
                </div>

                {pairingCode ? (
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-sm text-muted-foreground mb-2">Enter this code on your phone:</p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-3xl font-mono font-bold tracking-widest">{pairingCode}</span>
                      <Button variant="ghost" size="icon" onClick={handleCopyPairingCode}>
                        {pairingCodeCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Open WhatsApp → Settings → Linked Devices → Link a Device → Link with phone number
                    </p>
                  </div>
                ) : (
                  <Button 
                    className="w-full" 
                    onClick={handleRequestPairingCode}
                    disabled={isPairingPending || pairingPhone.replace(/\D/g, '').length < 10}
                  >
                    {isPairingPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Get Pairing Code
                  </Button>
                )}

                <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
                  <p className="font-medium text-blue-700 dark:text-blue-300 mb-1">
                    💡 When to use pairing code?
                  </p>
                  <ul className="text-blue-600 dark:text-blue-400 text-xs space-y-1">
                    <li>• When QR code scanning is difficult</li>
                    <li>• When using WhatsApp on a different device</li>
                    <li>• For automated/headless setups</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
