/**
 * Webhooks Tab Component - Comprehensive webhook management with CRUD operations
 * Refactored to use WebhookDialog for consistent UX and proper field help
 */

import { useState } from 'react'
import {
  Loader2,
  Webhook,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  TestTube2,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Key,
  Globe,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { WebhookDialog, type WebhookSubmitData } from '@/features/webhooks/components/WebhookDialog'
import type { Webhook as WebhookType, CreateWebhookInput } from '@/features/sessions/api/session.api'
import {
  isAllEventsSelected as checkAllEventsSelected,
  type WebhookConfig,
} from '@/features/webhooks/types/webhook.types'

interface WebhooksTabProps {
  webhooks: WebhookType[]
  onCreateWebhook: (data: CreateWebhookInput) => Promise<void>
  onUpdateWebhook: (webhookId: string, data: Partial<CreateWebhookInput & { isActive: boolean }>) => Promise<void>
  onDeleteWebhook: (webhookId: string) => Promise<void>
  onTestWebhook: (webhookId: string) => Promise<{ success: boolean; statusCode?: number; duration: number; error?: string }>
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  isTesting: boolean
}

/**
 * Convert API Webhook type to WebhookConfig for dialog
 * Note: API stores timeout in milliseconds, UI uses seconds
 */
function webhookToConfig(webhook: WebhookType): WebhookConfig {
  return {
    id: webhook.id,
    name: webhook.name,
    url: webhook.url,
    events: webhook.events,
    isActive: webhook.isActive,
    // Convert timeout from ms (API) to seconds (UI)
    timeout: Math.round((webhook.timeout || 30000) / 1000),
    createdAt: webhook.createdAt,
    hmac: webhook.secret ? { key: webhook.secret } : undefined,
    retries: {
      attempts: webhook.retries?.attempts ?? webhook.retryAttempts ?? 3,
      delaySeconds: webhook.retries?.delaySeconds ?? webhook.retryDelay ?? 2,
      policy: (webhook.retries?.policy ?? webhook.retryPolicy ?? 'linear') as 'linear' | 'exponential' | 'constant',
    },
    customHeaders: webhook.customHeaders || [],
    _count: webhook._count,
  }
}

export function WebhooksTab({
  webhooks,
  onCreateWebhook,
  onUpdateWebhook,
  onDeleteWebhook,
  onTestWebhook,
  isCreating,
  isUpdating,
  isDeleting,
  isTesting,
}: WebhooksTabProps) {
  // Dialog states
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  
  // Selected webhook for edit/delete
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookType | null>(null)
  
  // Test results
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; statusCode?: number; duration: number; error?: string }>>({})

  // Open create dialog
  const openCreate = () => {
    setCreateOpen(true)
  }

  // Open edit dialog
  const openEdit = (webhook: WebhookType) => {
    setSelectedWebhook(webhook)
    setEditOpen(true)
  }

  // Open delete dialog
  const openDelete = (webhook: WebhookType) => {
    setSelectedWebhook(webhook)
    setDeleteOpen(true)
  }

  // Handle create webhook
  const handleCreate = async (data: WebhookSubmitData) => {
    // Convert timeout from seconds (UI) to milliseconds (API)
    const timeoutMs = data.timeout ? data.timeout * 1000 : 30000
    
    await onCreateWebhook({
      name: data.name,
      url: data.url,
      events: data.events,
      secret: data.secret,
      timeout: timeoutMs,
      retries: data.retries,
      customHeaders: data.customHeaders,
    })
    setCreateOpen(false)
  }

  // Handle update webhook
  const handleUpdate = async (data: WebhookSubmitData) => {
    if (!data.id) return
    
    // Convert timeout from seconds (UI) to milliseconds (API) if provided
    const timeoutMs = data.timeout ? data.timeout * 1000 : undefined
    
    await onUpdateWebhook(data.id, {
      name: data.name,
      url: data.url,
      events: data.events,
      secret: data.secret,
      isActive: data.isActive,
      timeout: timeoutMs,
      retries: data.retries,
      customHeaders: data.customHeaders,
    })
    setEditOpen(false)
    setSelectedWebhook(null)
  }

  // Handle delete webhook
  const handleDelete = async () => {
    if (!selectedWebhook) return
    await onDeleteWebhook(selectedWebhook.id)
    setDeleteOpen(false)
    setSelectedWebhook(null)
  }

  // Handle toggle active
  const handleToggleActive = async (webhook: WebhookType) => {
    await onUpdateWebhook(webhook.id, { isActive: !webhook.isActive })
  }

  // Handle test webhook
  const handleTest = async (webhookId: string) => {
    const result = await onTestWebhook(webhookId)
    setTestResults(prev => ({ ...prev, [webhookId]: result }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Webhooks</h2>
          <p className="text-sm text-muted-foreground">Manage your HTTP callbacks and event subscriptions</p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Webhook
        </Button>
      </div>

      {/* Webhook List */}
      {webhooks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Webhook className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">No webhooks configured</h3>
            <p className="text-muted-foreground max-w-sm mb-6 text-sm">
              Add webhooks to receive real-time HTTP notifications when specific events occur in this session.
            </p>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Webhook
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {webhooks.map((webhook) => (
            <Card key={webhook.id} className={`transition-all hover:shadow-md ${!webhook.isActive ? 'bg-muted/30' : ''}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1 min-w-0 space-y-3">
                    {/* Header: Name & Test Status */}
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-base truncate">{webhook.name}</h3>
                      {testResults[webhook.id] && (
                        <Badge variant={testResults[webhook.id].success ? 'outline' : 'destructive'} className={`h-5 px-2 text-[10px] gap-1 ${testResults[webhook.id].success ? 'text-green-600 border-green-600 bg-green-50' : ''}`}>
                          {testResults[webhook.id].success ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          {testResults[webhook.id].success 
                            ? `${testResults[webhook.id].duration}ms` 
                            : 'Failed'}
                        </Badge>
                      )}
                    </div>
                    
                    {/* URL Display */}
                    <div className="flex items-center text-sm font-mono bg-gray-50/50 dark:bg-secondary/20 px-2.5 py-1.5 rounded-md w-fit max-w-full shadow-inner">
                      <Globe className="h-3.5 w-3.5 mr-2 text-muted-foreground flex-shrink-0" />
                      <span className="truncate text-foreground/80">{webhook.url}</span>
                    </div>
                    
                    {/* Events & Stats Row */}
                    <div className="flex flex-wrap items-center gap-y-3 gap-x-6 pt-1">
                      <div className="flex flex-wrap gap-1.5">
                        {checkAllEventsSelected(webhook.events) ? (
                          <Badge variant="secondary" className="text-xs font-normal">All Events</Badge>
                        ) : (
                          <>
                            {webhook.events.slice(0, 3).map((event) => (
                              <Badge key={event} variant="secondary" className="text-xs font-normal">
                                {event}
                              </Badge>
                            ))}
                            {webhook.events.length > 3 && (
                              <Badge variant="secondary" className="text-xs font-normal">
                                +{webhook.events.length - 3} more
                              </Badge>
                            )}
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground ml-auto sm:ml-0">
                        {webhook.secret && (
                          <div className="flex items-center gap-1.5" title="HMAC Signature Enabled">
                            <Key className="h-3.5 w-3.5" />
                            <span>Signed</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5" title="Retry Policy">
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>{webhook.retries?.attempts ?? webhook.retryAttempts ?? 3}x</span>
                        </div>
                        <div className="flex items-center gap-1.5" title="Request Timeout">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{Math.round((webhook.timeout || 30000) / 1000)}s</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-3 self-start mt-1">
                    <Switch
                      checked={webhook.isActive}
                      onCheckedChange={() => handleToggleActive(webhook)}
                      disabled={isUpdating}
                    />
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => handleTest(webhook.id)} disabled={isTesting}>
                          {isTesting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <TestTube2 className="mr-2 h-4 w-4" />
                          )}
                          Test Delivery
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(webhook)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit Configuration
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => openDelete(webhook)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Webhook
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <WebhookDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        isPending={isCreating}
        onSubmit={handleCreate}
      />

      {/* Edit Dialog */}
      <WebhookDialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open)
          if (!open) setSelectedWebhook(null)
        }}
        mode="edit"
        webhook={selectedWebhook ? webhookToConfig(selectedWebhook) : null}
        isPending={isUpdating}
        onSubmit={handleUpdate}
      />

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Webhook</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedWebhook?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
