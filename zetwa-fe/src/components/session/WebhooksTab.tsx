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
  Eye,
  EyeOff,
  TestTube2,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Key,
  Globe,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
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

import { WebhookDialog, type WebhookSubmitData } from '@/components/webhook'
import type { Webhook as WebhookType, CreateWebhookInput } from '@/api/session.api'
import {
  isAllEventsSelected as checkAllEventsSelected,
  type WebhookConfig,
} from '@/types/webhook.types'

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
          <h2 className="text-lg font-semibold">Webhooks</h2>
          <p className="text-sm text-muted-foreground">Receive real-time event notifications via HTTP POST</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Webhook
        </Button>
      </div>

      {/* Webhook List */}
      {webhooks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Webhook className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No webhooks configured</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              Add webhooks to receive HTTP notifications when events occur in this session.
            </p>
            <Button variant="outline" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Webhook
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {webhooks.map((webhook) => (
            <Card key={webhook.id} className={!webhook.isActive ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-medium truncate">{webhook.name}</h3>
                      <Badge variant={webhook.isActive ? 'success' : 'secondary'}>
                        {webhook.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      {testResults[webhook.id] && (
                        <Badge variant={testResults[webhook.id].success ? 'success' : 'destructive'} className="gap-1">
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
                    
                    <p className="text-sm text-muted-foreground truncate mb-2 flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />
                      {webhook.url}
                    </p>
                    
                    <div className="flex flex-wrap gap-1">
                      {checkAllEventsSelected(webhook.events) ? (
                        <Badge variant="outline" className="text-xs">All Events</Badge>
                      ) : (
                        <>
                          {webhook.events.slice(0, 4).map((event) => (
                            <Badge key={event} variant="outline" className="text-xs">
                              {event}
                            </Badge>
                          ))}
                          {webhook.events.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{webhook.events.length - 4} more
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                    
                    {/* Webhook stats */}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      {webhook.secret && (
                        <span className="flex items-center gap-1">
                          <Key className="h-3 w-3" />
                          HMAC enabled
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <RefreshCw className="h-3 w-3" />
                        {webhook.retries?.attempts ?? webhook.retryAttempts ?? 3} retries
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {Math.round((webhook.timeout || 30000) / 1000)}s timeout
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTest(webhook.id)}
                      disabled={isTesting}
                    >
                      {isTesting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <TestTube2 className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(webhook)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(webhook)}>
                          {webhook.isActive ? (
                            <>
                              <EyeOff className="mr-2 h-4 w-4" />
                              Disable
                            </>
                          ) : (
                            <>
                              <Eye className="mr-2 h-4 w-4" />
                              Enable
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => openDelete(webhook)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
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
