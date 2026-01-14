/**
 * Webhook List Component - Manage multiple webhooks during session creation
 */

import { Plus, Trash2, Webhook, ChevronDown, ChevronUp, GripVertical } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

import { WebhookForm, emptyWebhookConfig } from './WebhookForm'
import type { InlineWebhookConfig } from '@/types/webhook.types'

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
  const [expandedIndex, setExpandedIndex] = useState<number | null>(webhooks.length > 0 ? 0 : null)

  // Add a new webhook
  const addWebhook = () => {
    if (webhooks.length >= maxWebhooks) return
    const newWebhooks = [...webhooks, { ...emptyWebhookConfig }]
    onChange(newWebhooks)
    setExpandedIndex(newWebhooks.length - 1)
  }

  // Update a webhook
  const updateWebhook = (index: number, webhook: InlineWebhookConfig) => {
    const newWebhooks = [...webhooks]
    newWebhooks[index] = webhook
    onChange(newWebhooks)
  }

  // Remove a webhook
  const removeWebhook = (index: number) => {
    const newWebhooks = webhooks.filter((_, i) => i !== index)
    onChange(newWebhooks)
    if (expandedIndex === index) {
      setExpandedIndex(newWebhooks.length > 0 ? 0 : null)
    } else if (expandedIndex !== null && expandedIndex > index) {
      setExpandedIndex(expandedIndex - 1)
    }
  }

  // Get a display name for the webhook
  const getWebhookDisplayName = (webhook: InlineWebhookConfig, index: number): string => {
    // Use explicit name if provided
    if (webhook.name && webhook.name.trim()) {
      return webhook.name
    }
    // Fall back to hostname from URL
    if (webhook.url) {
      try {
        const url = new URL(webhook.url)
        return url.hostname
      } catch {
        return webhook.url.slice(0, 30)
      }
    }
    return `Webhook ${index + 1}`
  }

  // Get event summary
  const getEventSummary = (webhook: InlineWebhookConfig): string => {
    if (!webhook.events || webhook.events.length === 0) return 'No events'
    if (webhook.events.includes('*')) return 'All events'
    return `${webhook.events.length} event${webhook.events.length > 1 ? 's' : ''}`
  }

  if (webhooks.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed rounded-lg">
        <Webhook className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <h3 className="font-medium mb-1">No webhooks configured</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Add webhooks to receive real-time notifications when events occur
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={addWebhook}
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Webhook
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {webhooks.map((webhook, index) => (
        <Collapsible
          key={index}
          open={expandedIndex === index}
          onOpenChange={(open) => setExpandedIndex(open ? index : null)}
        >
          <div className="border rounded-lg overflow-hidden">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <div className="flex items-center gap-2">
                    <Webhook className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">
                      {getWebhookDisplayName(webhook, index)}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    {getEventSummary(webhook)}
                  </Badge>
                  {!webhook.url && (
                    <Badge variant="destructive" className="text-[10px]">
                      URL required
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeWebhook(index)
                    }}
                    disabled={disabled}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                  {expandedIndex === index ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="p-3 border-t">
                <WebhookForm
                  value={webhook}
                  onChange={(newValue) => updateWebhook(index, newValue)}
                  disabled={disabled}
                  compact
                />
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      ))}

      {webhooks.length < maxWebhooks && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={addWebhook}
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Another Webhook
        </Button>
      )}

      {webhooks.length >= maxWebhooks && (
        <p className="text-xs text-center text-muted-foreground">
          Maximum {maxWebhooks} webhooks allowed per session
        </p>
      )}
    </div>
  )
}
