/**
 * QR Code Section Component - QR code display and pairing code for session authentication
 */

import { useState } from 'react'
import {
  Loader2,
  RefreshCw,
  QrCode,
  Phone,
  Copy,
  Check,
  AlertTriangle,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface QRCodeSectionProps {
  qrCode: string | null
  isQrExpired: boolean
  isRestarting: boolean
  isSessionFailed: boolean
  isSessionLoggedOut: boolean
  onRestart: () => void
  isRestartPending: boolean
  // Pairing code
  onRequestPairingCode: (phone: string) => void
  pairingCode: string | null
  isPairingPending: boolean
}

export function QRCodeSection({
  qrCode,
  isQrExpired: _isQrExpired,
  isRestarting,
  isSessionFailed,
  isSessionLoggedOut,
  onRestart,
  isRestartPending,
  onRequestPairingCode,
  pairingCode,
  isPairingPending,
}: QRCodeSectionProps) {
  void _isQrExpired // Used in interface but logic handled by parent
  const [authMethod, setAuthMethod] = useState<'qr' | 'phone'>('qr')
  const [pairingPhone, setPairingPhone] = useState('')
  const [pairingCodeCopied, setPairingCodeCopied] = useState(false)

  const handleCopyPairingCode = async () => {
    if (!pairingCode) return
    await navigator.clipboard.writeText(pairingCode.replace('-', ''))
    setPairingCodeCopied(true)
    setTimeout(() => setPairingCodeCopied(false), 2000)
  }

  const handleRequestPairingCode = () => {
    const cleanPhone = pairingPhone.replace(/\D/g, '')
    if (cleanPhone.length >= 10) {
      onRequestPairingCode(cleanPhone)
    }
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Connect WhatsApp
        </CardTitle>
        <CardDescription>
          Scan the QR code or use a pairing code to link your WhatsApp account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Failed/Expired State */}
        {(isSessionFailed || isSessionLoggedOut) && !isRestarting && (
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {isSessionLoggedOut ? 'Session Logged Out' : 'Session Expired'}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {isSessionLoggedOut 
                ? 'This session has been logged out. Restart to reconnect.'
                : 'The QR code expired or authentication failed. Restart to get a new QR code.'
              }
            </p>
            <Button onClick={onRestart} disabled={isRestartPending}>
              <RefreshCw className={cn("h-4 w-4 mr-2", isRestartPending && "animate-spin")} />
              Restart Session
            </Button>
          </div>
        )}

        {/* Loading/Initializing State */}
        {isRestarting && !qrCode && (
          <div className="text-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Initializing session...</p>
          </div>
        )}

        {/* QR Code Display */}
        {!isSessionFailed && !isSessionLoggedOut && (qrCode || !isRestarting) && (
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
              {qrCode ? (
                <div className="inline-block p-4 bg-white rounded-xl shadow-lg">
                  <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                </div>
              ) : (
                <div className="inline-block p-4 bg-muted rounded-xl">
                  <div className="w-64 h-64 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-4">
                Open WhatsApp on your phone → Settings → Linked Devices → Link a Device
              </p>
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
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
