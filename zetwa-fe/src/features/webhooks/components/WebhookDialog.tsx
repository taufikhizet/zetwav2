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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldHelp } from '@/components/ui/field-help'
import { WEBHOOK_HELP } from '@/lib/field-help-content'
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
  // Webhook name (not part of InlineWebhookConfig)
  const [name, setName] = useState('')
  
  // Webhook config (using InlineWebhookConfig structure)
  const [config, setConfig] = useState<InlineWebhookConfig>(emptyWebhookConfig)
  
  // Is active toggle for edit mode
  const [isActive, setIsActive] = useState(true)

  // Reset form when dialog opens or webhook changes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && webhook) {
        setName(webhook.name || '')
        setConfig({
          url: webhook.url,
          events: webhook.events || [],
          hmac: webhook.hmac,
          retries: webhook.retries,
          customHeaders: webhook.customHeaders,
          timeout: webhook.timeout, // Already in seconds from webhookToConfig
        })
        setIsActive(webhook.isActive)
      } else {
        setName('')
        setConfig({ ...emptyWebhookConfig })
        setIsActive(true)
      }
    }
  }, [open, mode, webhook])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) return
    if (!config.url) return
    
    onSubmit({
      ...(mode === 'edit' && webhook ? { id: webhook.id } : {}),
      name: name.trim(),
      url: config.url,
      events: config.events,
      secret: config.hmac?.key,
      isActive,
      timeout: config.timeout,
      retries: config.retries,
      customHeaders: config.customHeaders,
    })
  }

  const isValid = name.trim() && config.url && config.events?.length > 0

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
        
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Webhook Name */}
          <div className="space-y-2">
            <Label htmlFor="webhook-name" className="flex items-center gap-1">
              Name
              <FieldHelp content={WEBHOOK_HELP.webhookName} />
            </Label>
            <Input
              id="webhook-name"
              placeholder="e.g., My Notification Service"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              A friendly name to identify this webhook
            </p>
          </div>

          {/* Webhook Form (URL, Events, Advanced) */}
          <WebhookForm
            value={config}
            onChange={setConfig}
            disabled={isPending}
            showAdvancedByDefault={mode === 'edit'}
          />

          {/* Active toggle for edit mode */}
          {mode === 'edit' && (
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <div>
                <Label htmlFor="webhook-active" className="cursor-pointer flex items-center gap-1">
                  Active
                  <FieldHelp content={WEBHOOK_HELP.webhookIsActive} />
                </Label>
                <p className="text-xs text-muted-foreground">
                  Disable to pause webhook notifications
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="webhook-active"
                  className="sr-only peer"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={isPending}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>
          )}
        </form>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !isValid}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {mode === 'create' ? 'Creating...' : 'Saving...'}
              </>
            ) : (
              mode === 'create' ? 'Create Webhook' : 'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
