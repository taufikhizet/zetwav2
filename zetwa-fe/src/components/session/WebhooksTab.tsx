/**
 * Webhooks Tab Component - Comprehensive webhook management with CRUD operations
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
  ListChecks,
  Globe,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'

import type { Webhook as WebhookType, CreateWebhookInput } from '@/api/session.api'
import {
  WEBHOOK_EVENTS_BY_CATEGORY,
  EVENT_CATEGORIES,
  type RetryPolicy,
  type CustomHeader,
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

// Empty form state
const emptyWebhookForm = {
  name: '',
  url: '',
  events: ['*'] as string[],
  secret: '',
  timeout: 30000,
  retryCount: 3,
  retries: {
    attempts: 3,
    delaySeconds: 2,
    policy: 'linear' as RetryPolicy,
  },
  customHeaders: [] as CustomHeader[],
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
  
  // Form state
  const [form, setForm] = useState(emptyWebhookForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingWebhook, setDeletingWebhook] = useState<WebhookType | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  // Test results
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; statusCode?: number; duration: number; error?: string }>>({})

  // Open create dialog
  const openCreate = () => {
    setForm(emptyWebhookForm)
    setShowAdvanced(false)
    setCreateOpen(true)
  }

  // Open edit dialog
  const openEdit = (webhook: WebhookType) => {
    setForm({
      name: webhook.name,
      url: webhook.url,
      events: webhook.events,
      secret: webhook.secret || '',
      timeout: webhook.timeout || 30000,
      retryCount: webhook.retryCount || 3,
      retries: {
        attempts: webhook.retryCount || 3,
        delaySeconds: 2,
        policy: 'linear',
      },
      customHeaders: [],
    })
    setEditingId(webhook.id)
    setShowAdvanced(false)
    setEditOpen(true)
  }

  // Open delete dialog
  const openDelete = (webhook: WebhookType) => {
    setDeletingWebhook(webhook)
    setDeleteOpen(true)
  }

  // Handle create
  const handleCreate = async () => {
    if (!form.name.trim() || !form.url.trim()) return
    await onCreateWebhook({
      name: form.name.trim(),
      url: form.url.trim(),
      events: form.events,
      secret: form.secret || undefined,
      timeout: form.timeout,
      retryCount: form.retries.attempts,
    })
    setCreateOpen(false)
    setForm(emptyWebhookForm)
  }

  // Handle update
  const handleUpdate = async () => {
    if (!editingId || !form.name.trim() || !form.url.trim()) return
    await onUpdateWebhook(editingId, {
      name: form.name.trim(),
      url: form.url.trim(),
      events: form.events,
      secret: form.secret || undefined,
      timeout: form.timeout,
      retryCount: form.retries.attempts,
    })
    setEditOpen(false)
    setEditingId(null)
    setForm(emptyWebhookForm)
  }

  // Handle delete
  const handleDelete = async () => {
    if (!deletingWebhook) return
    await onDeleteWebhook(deletingWebhook.id)
    setDeleteOpen(false)
    setDeletingWebhook(null)
  }

  // Handle toggle active
  const handleToggleActive = async (webhook: WebhookType) => {
    await onUpdateWebhook(webhook.id, { isActive: !webhook.isActive })
  }

  // Handle test
  const handleTest = async (webhookId: string) => {
    const result = await onTestWebhook(webhookId)
    setTestResults(prev => ({ ...prev, [webhookId]: result }))
  }

  // Toggle event
  const toggleEvent = (event: string) => {
    const events = form.events || []
    if (events.includes(event)) {
      setForm({ ...form, events: events.filter((e) => e !== event) })
    } else {
      if (event === '*') {
        setForm({ ...form, events: ['*'] })
      } else {
        setForm({ ...form, events: [...events.filter((e) => e !== '*'), event] })
      }
    }
  }

  const isAllEventsSelected = form.events?.includes('*')

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
                      {webhook.events.includes('*') ? (
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
                        {webhook.retryCount} retries
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {(webhook.timeout / 1000).toFixed(0)}s timeout
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

      {/* Create/Edit Dialog */}
      <Dialog open={createOpen || editOpen} onOpenChange={(open) => {
        if (!open) {
          setCreateOpen(false)
          setEditOpen(false)
          setEditingId(null)
          setForm(emptyWebhookForm)
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editOpen ? 'Edit Webhook' : 'Create Webhook'}</DialogTitle>
            <DialogDescription>
              {editOpen ? 'Update webhook configuration' : 'Add a new webhook to receive event notifications'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Name <Badge variant="destructive" className="text-[10px] ml-1">Required</Badge></Label>
                <Input
                  placeholder="My Webhook"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>URL <Badge variant="destructive" className="text-[10px] ml-1">Required</Badge></Label>
                <Input
                  placeholder="https://your-server.com/webhook"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                />
              </div>
            </div>

            {/* Events */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <ListChecks className="h-4 w-4" />
                Events
                <Badge variant="secondary" className="text-xs">
                  {isAllEventsSelected ? 'All' : `${form.events.length} selected`}
                </Badge>
              </Label>
              
              {/* All events toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg border bg-primary/5">
                <div>
                  <span className="font-medium">Subscribe to all events</span>
                  <Badge variant="outline" className="text-[10px] ml-2">Recommended</Badge>
                </div>
                <Switch
                  checked={isAllEventsSelected}
                  onCheckedChange={(checked) => setForm({ ...form, events: checked ? ['*'] : [] })}
                />
              </div>
              
              {/* Event categories */}
              {!isAllEventsSelected && (
                <div className="grid gap-2 max-h-48 overflow-y-auto pr-2">
                  {EVENT_CATEGORIES.filter(cat => cat !== 'Special').map((category) => (
                    <div key={category} className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{category}</p>
                      <div className="grid grid-cols-2 gap-1">
                        {WEBHOOK_EVENTS_BY_CATEGORY[category]?.map((event) => (
                          <button
                            key={event.value}
                            type="button"
                            onClick={() => toggleEvent(event.value)}
                            className={`text-left p-2 rounded-md border text-xs transition-colors ${
                              form.events?.includes(event.value)
                                ? 'bg-primary/10 border-primary text-primary'
                                : 'hover:bg-muted/50'
                            }`}
                          >
                            {event.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Advanced Options */}
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="ghost" size="sm" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    Advanced Options
                    <Badge variant="outline" className="text-[10px]">Optional</Badge>
                  </span>
                  {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                {/* HMAC Secret */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    HMAC Secret
                  </Label>
                  <Input
                    type="password"
                    placeholder="Secret key for signature verification"
                    value={form.secret}
                    onChange={(e) => setForm({ ...form, secret: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Used to sign payloads. Verify via X-Webhook-Signature header.
                  </p>
                </div>

                <Separator />

                {/* Retry Config */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Retry Configuration
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Attempts</Label>
                      <Input
                        type="number"
                        min={0}
                        max={15}
                        value={form.retries.attempts}
                        onChange={(e) => setForm({
                          ...form,
                          retries: { ...form.retries, attempts: parseInt(e.target.value) || 0 }
                        })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Delay (sec)</Label>
                      <Input
                        type="number"
                        min={1}
                        max={60}
                        value={form.retries.delaySeconds}
                        onChange={(e) => setForm({
                          ...form,
                          retries: { ...form.retries, delaySeconds: parseInt(e.target.value) || 2 }
                        })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Policy</Label>
                      <Select
                        value={form.retries.policy}
                        onValueChange={(v) => setForm({
                          ...form,
                          retries: { ...form.retries, policy: v as RetryPolicy }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="linear">Linear</SelectItem>
                          <SelectItem value="exponential">Exponential</SelectItem>
                          <SelectItem value="constant">Constant</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Timeout */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Request Timeout (ms)
                  </Label>
                  <Input
                    type="number"
                    min={1000}
                    max={60000}
                    value={form.timeout}
                    onChange={(e) => setForm({ ...form, timeout: parseInt(e.target.value) || 30000 })}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setCreateOpen(false)
              setEditOpen(false)
            }}>
              Cancel
            </Button>
            <Button
              onClick={editOpen ? handleUpdate : handleCreate}
              disabled={isCreating || isUpdating || !form.name.trim() || !form.url.trim()}
            >
              {(isCreating || isUpdating) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editOpen ? 'Save Changes' : 'Create Webhook'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Webhook</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingWebhook?.name}"? This action cannot be undone.
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
