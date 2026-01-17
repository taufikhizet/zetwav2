/**
 * Webhook Dialog Component - For creating and editing webhooks
 */

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { WebhookForm, emptyWebhookConfig } from './WebhookForm'
import type { InlineWebhookConfig, WebhookConfig } from '@/features/webhooks/types/webhook.types'

interface WebhookDialogProps {
  /** Whether dialog is open */
  open: boolean
  /** Callback to close dialog */
  onOpenChange: (open: boolean) => void
  /** Mode: create or edit */
  mode: 'create' | 'edit'
  /** Initial webhook data for edit mode */
  webhook?: WebhookConfig | null
  /** Whether the operation is pending */
  isPending?: boolean
  /** Callback when form is submitted */
  onSubmit: (data: WebhookSubmitData) => void
}

export interface WebhookSubmitData {
  id?: string
  name: string
  url: string
  events: string[]
  secret?: string
  isActive?: boolean
  /** Timeout in seconds */
  timeout?: number
  retries?: {
    delaySeconds?: number
    attempts?: number
    policy?: 'linear' | 'exponential' | 'constant'
  }
  customHeaders?: { name: string; value: string }[]
}

export function WebhookDialog({
  open,
  onOpenChange,
  mode,
  webhook,
  isPending = false,
  onSubmit,
}: WebhookDialogProps) {
  // Webhook config (using InlineWebhookConfig structure)
  // config.name stores the webhook name
  const [config, setConfig] = useState<InlineWebhookConfig>(emptyWebhookConfig)
  
  // Is active toggle for edit mode
  const [isActive, setIsActive] = useState(true)

  // Reset form when dialog opens or webhook changes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && webhook) {
        setConfig({
          name: webhook.name || '',
          url: webhook.url,
          events: webhook.events || [],
          hmac: webhook.hmac,
          retries: webhook.retries,
          customHeaders: webhook.customHeaders,
          timeout: webhook.timeout, // Already in seconds from webhookToConfig
        })
        setIsActive(webhook.isActive)
      } else {
        setConfig({ ...emptyWebhookConfig, name: '' })
        setIsActive(true)
      }
    }
  }, [open, mode, webhook])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // name is now part of config, but might be undefined in type, so we default to empty string
    const webhookName = config.name || ''
    
    // Allow empty name (backend will generate one if needed), but if provided, use it
    // Or if we want to enforce name:
    // if (!webhookName.trim()) return
    
    if (!config.url) return
    
    onSubmit({
      ...(mode === 'edit' && webhook ? { id: webhook.id } : {}),
      name: webhookName.trim(), 
      url: config.url,
      events: config.events,
      secret: config.hmac?.key,
      isActive,
      timeout: config.timeout,
      retries: config.retries,
      customHeaders: config.customHeaders,
    })
  }

  // Check validity - Name is now optional or handled by config
  const isValid = config.url && config.events?.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Webhook' : 'Edit Webhook'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Set up a new webhook to receive event notifications'
              : 'Update webhook configuration and event subscriptions'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-4 bg-muted/30 -mx-6 px-6">
          <WebhookForm
            value={config}
            onChange={setConfig}
            disabled={isPending}
            showAdvancedByDefault={mode === 'edit'}
            error={!config.url && mode === 'create' ? 'URL is required' : undefined}
          />

          {mode === 'edit' && (
            <div className="flex items-center justify-between p-6 rounded-xl bg-card border shadow-sm">
              <div className="space-y-0.5">
                <Label className="text-base">Active Status</Label>
                <p className="text-sm text-muted-foreground">
                  {isActive ? 'Webhook is active and receiving events' : 'Webhook is paused'}
                </p>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
                disabled={isPending}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !isValid}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Create Webhook' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
