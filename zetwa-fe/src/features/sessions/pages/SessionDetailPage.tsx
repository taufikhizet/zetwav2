/**
 * Session Detail Page - Comprehensive session management
 * Uses modular components from @/components/session
 */

import { useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Loader2,
  Send,
} from 'lucide-react'

import {
  SessionHeader,
  QRCodeSection,
  SessionSettingsTab,
  SessionInfoTab,
  WebhooksTab,
  SessionPlaygroundTab,
} from '../components'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { useSessionDetail } from '../hooks/useSessionDetail'
import { useSessionSocket } from '../hooks/useSessionSocket'
import type { SessionStatus, UpdateSessionInput } from '../types/session.types'
import type { CreateWebhookInput } from '../api/session.api'

export default function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [logoutConfirmation, setLogoutConfirmation] = useState('')
  
  const {
    session,
    webhooks,
    isLoading,
    deleteOpen, setDeleteOpen,
    logoutOpen, setLogoutOpen,
    sendOpen, setSendOpen,
    pairingCode, 
    // setPairingCode, // Unused
    messageForm, setMessageForm,
    restartMutation,
    logoutMutation,
    deleteMutation,
    updateMutation,
    pairingCodeMutation,
    sendMessageMutation,
    createWebhookMutation,
    updateWebhookMutation,
    deleteWebhookMutation,
    testWebhookMutation,
  } = useSessionDetail(sessionId)

  const {
    qrCode,
    // setIsRestarting, // Unused
  } = useSessionSocket(sessionId, session, restartMutation.isPending)

  // ============================================
  // LOADING STATE
  // ============================================

  if (isLoading || !session) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // ============================================
  // DERIVED STATE
  // ============================================

  const status = (session.liveStatus || session.status) as SessionStatus
  const isConnected = session.isOnline || status === 'CONNECTED' || status === 'WORKING'

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-8">
      {/* Header */}
      <SessionHeader
        session={session}
        onRestart={() => restartMutation.mutate()}
        onLogout={() => setLogoutOpen(true)}
        onDelete={() => setDeleteOpen(true)}
        onSendMessage={() => setSendOpen(true)}
        isRestartPending={restartMutation.isPending}
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Detailed Config & Webhooks */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="playground" className="w-full">
            <div className="flex items-center justify-between mb-6">
              <TabsList className="grid w-full max-w-xl grid-cols-3 p-1 bg-white dark:bg-secondary/20 rounded-xl">
                <TabsTrigger 
                  value="playground" 
                  className="rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
                >
                  Features
                </TabsTrigger>
                <TabsTrigger 
                  value="settings" 
                  className="rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
                >
                  Settings
                </TabsTrigger>
                <TabsTrigger 
                  value="webhooks" 
                  className="rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
                >
                  Webhooks
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="playground" className="mt-0 space-y-6">
              <SessionPlaygroundTab sessionId={sessionId!} isOnline={isConnected} />
            </TabsContent>

            <TabsContent value="settings" className="mt-0 space-y-6">
              <SessionSettingsTab 
                 session={session}
                 onUpdate={async (data: UpdateSessionInput) => { await updateMutation.mutateAsync(data) }}
                 isUpdating={updateMutation.isPending}
              />
            </TabsContent>

            <TabsContent value="webhooks" className="mt-0 space-y-4">
               <WebhooksTab 
                  webhooks={webhooks}
                  onCreateWebhook={async (data: CreateWebhookInput) => { await createWebhookMutation.mutateAsync(data) }}
                  onUpdateWebhook={async (id: string, data: Partial<CreateWebhookInput & { isActive: boolean }>) => { await updateWebhookMutation.mutateAsync({ webhookId: id, data }) }}
                  onDeleteWebhook={async (id: string) => { await deleteWebhookMutation.mutateAsync(id) }}
                  onTestWebhook={async (id: string) => await testWebhookMutation.mutateAsync(id)}
                  isCreating={createWebhookMutation.isPending}
                  isUpdating={updateWebhookMutation.isPending}
                  isDeleting={deleteWebhookMutation.isPending}
                  isTesting={testWebhookMutation.isPending}
               />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column: Status & Quick Info */}
        <div className="space-y-6">
          {/* QR/Auth Section - Always show when not connected */}
          {!isConnected && (
            <QRCodeSection
              sessionId={sessionId!}
              socketQR={qrCode}
              pairingCode={pairingCode}
              status={status}
              isRestarting={restartMutation.isPending}
              onRequestPairingCode={(phone: string) => pairingCodeMutation.mutate(phone)}
              onRestart={() => restartMutation.mutate()}
              isPairingPending={pairingCodeMutation.isPending}
              isRestartPending={restartMutation.isPending}
              isConnected={isConnected}
              onStart={() => restartMutation.mutate()}
              isStartPending={restartMutation.isPending}
            />
          )}

          {/* Session Info Summary */}
          <SessionInfoTab session={session} />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={(open) => {
        setDeleteOpen(open)
        if (!open) setDeleteConfirmation('')
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Session?</DialogTitle>
            <div className="text-sm text-muted-foreground space-y-3 mt-2">
              <p>
                This action is <span className="font-semibold text-destructive">irreversible</span>. Deleting this session will:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Permanently remove all session configuration and data.</li>
                <li>Stop all active webhooks associated with this session.</li>
                <li>Terminate the WhatsApp connection immediately.</li>
                <li>Require a full reconfiguration if you want to use this number again.</li>
              </ul>
            </div>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <Label>
              Type <span className="font-bold">{session.name}</span> to confirm
            </Label>
            <Input 
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder={session.name}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending || deleteConfirmation !== session.name}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Session'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logout Confirmation Dialog */}
      <Dialog open={logoutOpen} onOpenChange={(open) => {
        setLogoutOpen(open)
        if (!open) setLogoutConfirmation('')
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Logout Session?</DialogTitle>
            <div className="text-sm text-muted-foreground space-y-3 mt-2">
              <p>
                You are about to <span className="font-semibold text-orange-600">disconnect</span> this device from WhatsApp.
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>The current session will be terminated on WhatsApp Web.</li>
                <li>All message processing will stop immediately.</li>
                <li>Session configuration (webhooks, settings) will be preserved.</li>
                <li>You will need to scan a new QR code to reconnect.</li>
              </ul>
            </div>
          </DialogHeader>

          {session.phoneNumber && (
            <div className="py-4 space-y-3">
              <Label>
                Type phone number <span className="font-bold">{session.phoneNumber}</span> to confirm
              </Label>
              <Input 
                value={logoutConfirmation}
                onChange={(e) => setLogoutConfirmation(e.target.value)}
                placeholder={session.phoneNumber}
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setLogoutOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending || (session.phoneNumber ? logoutConfirmation !== session.phoneNumber : false)}
            >
              {logoutMutation.isPending ? 'Logging out...' : 'Logout WhatsApp'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Message Dialog */}
      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Message</DialogTitle>
            <DialogDescription>
              Send a text message to verify your connection.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="to">Phone Number</Label>
              <Input
                id="to"
                placeholder="e.g. 6281234567890"
                value={messageForm.to}
                onChange={(e) => setMessageForm({ ...messageForm, to: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Type your message here..."
                value={messageForm.message}
                onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => sendMessageMutation.mutate()}
              disabled={sendMessageMutation.isPending || !messageForm.to || !messageForm.message}
            >
              {sendMessageMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
