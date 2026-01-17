
import { useState } from 'react'
import { Plus, Trash2, Webhook, Pencil, Globe, Shield } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { WebhookDialog, type WebhookSubmitData } from './WebhookDialog'
import type { InlineWebhookConfig, WebhookConfig } from '@/features/webhooks/types/webhook.types'

interface WebhookListProps {
  /** List of webhook configurations */
  webhooks: InlineWebhookConfig[]
  /** Callback when webhooks change */
  onChange: (webhooks: InlineWebhookConfig[]) => void
  /** Whether the form is disabled */
  disabled?: boolean
  /** Maximum number of webhooks allowed */
  maxWebhooks?: number
}

export function WebhookList({
  webhooks,
  onChange,
  disabled = false,
  maxWebhooks = 10,
}: WebhookListProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  // Add a new webhook
  const handleAdd = (data: WebhookSubmitData) => {
    const newWebhook: InlineWebhookConfig = {
      name: data.name, // Store name in the config
      url: data.url,
      events: data.events,
      hmac: data.secret ? { key: data.secret } : undefined,
      retries: data.retries,
      customHeaders: data.customHeaders,
      timeout: data.timeout,
    }
    
    onChange([...webhooks, newWebhook])
    setDialogOpen(false)
  }

  // Update a webhook
  const handleUpdate = (data: WebhookSubmitData) => {
    if (editingIndex === null) return

    const updatedWebhook: InlineWebhookConfig = {
      name: data.name,
      url: data.url,
      events: data.events,
      hmac: data.secret ? { key: data.secret } : undefined,
      retries: data.retries,
      customHeaders: data.customHeaders,
      timeout: data.timeout,
    }

    const newWebhooks = [...webhooks]
    newWebhooks[editingIndex] = updatedWebhook
    onChange(newWebhooks)
    setDialogOpen(false)
    setEditingIndex(null)
  }

  // Remove a webhook
  const handleRemove = (index: number) => {
    const newWebhooks = webhooks.filter((_, i) => i !== index)
    onChange(newWebhooks)
  }

  // Open edit dialog
  const openEdit = (index: number) => {
    setEditingIndex(index)
    setDialogOpen(true)
  }

  // Open create dialog
  const openCreate = () => {
    setEditingIndex(null)
    setDialogOpen(true)
  }

  // Convert InlineWebhookConfig to WebhookConfig for Dialog
  const getWebhookConfigForDialog = (webhook: InlineWebhookConfig): WebhookConfig => {
    return {
      id: 'temp-id', // Dummy ID for dialog
      name: webhook.name || '',
      url: webhook.url,
      events: webhook.events,
      isActive: true,
      timeout: webhook.timeout ?? 30, // Default 30s if undefined
      createdAt: new Date().toISOString(),
      hmac: webhook.hmac,
      retries: webhook.retries,
      customHeaders: webhook.customHeaders,
      _count: { logs: 0 },
    }
  }

  return (
    <div className="space-y-4">
      {webhooks.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/20">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Webhook className="h-6 w-6" />
            </div>
          </div>
          <h3 className="text-lg font-medium mb-1">No webhooks configured</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            Add webhooks to receive real-time notifications when events occur in your WhatsApp session.
          </p>
          <Button
            type="button"
            onClick={openCreate}
            disabled={disabled}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Webhook
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map((webhook, index) => (
            <Card key={index} className="overflow-hidden border-l-4 border-l-primary">
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold truncate">
                      {webhook.name || new URL(webhook.url).hostname}
                    </h4>
                    {webhook.hmac?.key && (
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5 gap-0.5">
                        <Shield className="h-3 w-3" />
                        Secured
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Globe className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{webhook.url}</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(webhook.events || []).slice(0, 3).map((event) => (
                      <Badge key={event} variant="secondary" className="text-xs">
                        {event === '*' ? 'All Events' : event}
                      </Badge>
                    ))}
                    {(webhook.events || []).length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{(webhook.events || []).length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                   <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(index)}
                      disabled={disabled}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleRemove(index)}
                      disabled={disabled}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {webhooks.length < maxWebhooks && (
            <Button
              type="button"
              variant="outline"
              className="w-full border-dashed"
              onClick={openCreate}
              disabled={disabled}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Webhook
            </Button>
          )}
        </div>
      )}

      <WebhookDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={editingIndex !== null ? 'edit' : 'create'}
        webhook={editingIndex !== null ? getWebhookConfigForDialog(webhooks[editingIndex]) : undefined}
        onSubmit={editingIndex !== null ? handleUpdate : handleAdd}
        isPending={false}
      />
    </div>
  )
}
