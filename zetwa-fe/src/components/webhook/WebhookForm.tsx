/**
 * Webhook Form Component - Comprehensive webhook configuration form
 * Supports both inline (session creation) and standalone (edit/create) modes
 */

import { useState } from 'react'
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Globe,
  Key,
  RefreshCw,
  ListChecks,
  AlertCircle,
  Clock,
  Tag,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import { PasswordInput } from '@/components/ui/password-input'
import { FieldHelp } from '@/components/ui/field-help'
import { WEBHOOK_HELP } from '@/lib/field-help-content'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {
  type InlineWebhookConfig,
  type CustomHeader,
  type RetryPolicy,
  WEBHOOK_EVENTS_BY_CATEGORY,
  EVENT_CATEGORIES,
} from '@/types/webhook.types'

interface WebhookFormProps {
  /** Current webhook configuration */
  value: InlineWebhookConfig
  /** Callback when value changes */
  onChange: (value: InlineWebhookConfig) => void
  /** Whether the form is disabled */
  disabled?: boolean
  /** Show advanced options by default */
  showAdvancedByDefault?: boolean
  /** Compact mode for inline forms */
  compact?: boolean
  /** Error message */
  error?: string
}

export function WebhookForm({
  value,
  onChange,
  disabled = false,
  showAdvancedByDefault = false,
  compact = false,
  error,
}: WebhookFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(showAdvancedByDefault)

  // Update a field
  const updateField = <K extends keyof InlineWebhookConfig>(
    field: K,
    fieldValue: InlineWebhookConfig[K]
  ) => {
    onChange({ ...value, [field]: fieldValue })
  }

  // Toggle event selection
  const toggleEvent = (event: string) => {
    const events = value.events || []
    if (events.includes(event)) {
      updateField('events', events.filter((e) => e !== event))
    } else {
      // If selecting '*', clear other events
      if (event === '*') {
        updateField('events', ['*'])
      } else {
        // Remove '*' if selecting specific event
        updateField('events', [...events.filter((e) => e !== '*'), event])
      }
    }
  }

  // Add custom header
  const addCustomHeader = () => {
    const headers = value.customHeaders || []
    updateField('customHeaders', [...headers, { name: '', value: '' }])
  }

  // Update custom header
  const updateCustomHeader = (index: number, field: keyof CustomHeader, headerValue: string) => {
    const headers = [...(value.customHeaders || [])]
    headers[index] = { ...headers[index], [field]: headerValue }
    updateField('customHeaders', headers)
  }

  // Remove custom header
  const removeCustomHeader = (index: number) => {
    const headers = [...(value.customHeaders || [])]
    headers.splice(index, 1)
    updateField('customHeaders', headers.length > 0 ? headers : undefined)
  }

  const selectedEventsCount = value.events?.length || 0
  const isAllSelected = value.events?.includes('*')

  return (
    <div className={`space-y-4 ${compact ? '' : 'p-4 border rounded-lg bg-muted/20'}`}>
      {/* Webhook Name */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Tag className="h-4 w-4" />
          Webhook Name
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Optional</Badge>
          <FieldHelp content={WEBHOOK_HELP.webhookName} />
        </Label>
        <Input
          placeholder="e.g., My Backend Server"
          value={value.name || ''}
          onChange={(e) => updateField('name', e.target.value || undefined)}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          A friendly name to identify this webhook. Auto-generated from URL if not provided.
        </p>
      </div>

      {/* Webhook URL */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Webhook URL
          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Required</Badge>
          <FieldHelp content={WEBHOOK_HELP.webhookUrl} />
        </Label>
        <Input
          placeholder="https://your-server.com/webhook"
          value={value.url || ''}
          onChange={(e) => updateField('url', e.target.value)}
          disabled={disabled}
          className={error ? 'border-red-500' : ''}
        />
        {error && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {error}
          </p>
        )}
      </div>

      {/* Event Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            Events
            <FieldHelp content={WEBHOOK_HELP.webhookEvents} />
          </Label>
          <Badge variant="secondary" className="text-xs">
            {isAllSelected ? 'All Events' : `${selectedEventsCount} selected`}
          </Badge>
        </div>

        {/* Quick select all */}
        <div className="flex items-center justify-between p-2 rounded-md bg-primary/5 border">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Subscribe to all events</span>
            <Badge variant="outline" className="text-[10px]">Recommended</Badge>
          </div>
          <Switch
            checked={isAllSelected}
            onCheckedChange={(checked) => {
              if (checked) {
                updateField('events', ['*'])
              } else {
                updateField('events', [])
              }
            }}
            disabled={disabled}
          />
        </div>

        {/* Event categories */}
        {!isAllSelected && (
          <div className="grid gap-2 max-h-64 overflow-y-auto pr-2">
            {EVENT_CATEGORIES.filter(cat => cat !== 'Special').map((category) => (
              <div key={category} className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {category}
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {WEBHOOK_EVENTS_BY_CATEGORY[category]?.map((event) => (
                    <button
                      key={event.value}
                      type="button"
                      onClick={() => toggleEvent(event.value)}
                      disabled={disabled}
                      className={`text-left p-2 rounded-md border text-xs transition-colors ${
                        value.events?.includes(event.value)
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <span className="font-medium">{event.label}</span>
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
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-between"
          >
            <span className="flex items-center gap-2">
              Advanced Options
              <Badge variant="outline" className="text-[10px]">Optional</Badge>
            </span>
            {showAdvanced ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-4 pt-4">
          {/* HMAC Secret */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              HMAC Secret
              <FieldHelp content={WEBHOOK_HELP.hmacSecret} />
            </Label>
            <PasswordInput
              placeholder="Your secret key for signature verification"
              value={value.hmac?.key || ''}
              onChange={(e) =>
                updateField('hmac', e.target.value ? { key: e.target.value } : undefined)
              }
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">
              Used to sign webhook payloads. You can verify the signature using the X-Webhook-Signature header.
            </p>
          </div>

          <Separator />

          {/* Retry Configuration */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry Configuration
            </Label>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1">
                  Attempts
                  <FieldHelp content={WEBHOOK_HELP.retryAttempts} />
                </Label>
                <Input
                  type="number"
                  min={0}
                  max={15}
                  placeholder="3"
                  value={value.retries?.attempts || ''}
                  onChange={(e) =>
                    updateField('retries', {
                      ...value.retries,
                      attempts: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  disabled={disabled}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1">
                  Delay (sec)
                  <FieldHelp content={WEBHOOK_HELP.retryDelay} />
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={60}
                  placeholder="2"
                  value={value.retries?.delaySeconds || ''}
                  onChange={(e) =>
                    updateField('retries', {
                      ...value.retries,
                      delaySeconds: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  disabled={disabled}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1">
                  Policy
                  <FieldHelp content={WEBHOOK_HELP.retryPolicy} />
                </Label>
                <Select
                  value={value.retries?.policy || ''}
                  onValueChange={(v) =>
                    updateField('retries', {
                      ...value.retries,
                      policy: v as RetryPolicy,
                    })
                  }
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
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

          {/* Request Timeout */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Request Timeout
              <FieldHelp content={WEBHOOK_HELP.webhookTimeout} />
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={120}
                placeholder="30"
                value={value.timeout || ''}
                onChange={(e) =>
                  updateField('timeout', e.target.value ? parseInt(e.target.value) : undefined)
                }
                disabled={disabled}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">seconds</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Maximum time to wait for a response from the webhook endpoint (default: 30 seconds)
            </p>
          </div>

          <Separator />

          {/* Custom Headers */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1">
                Custom Headers
                <FieldHelp content={WEBHOOK_HELP.customHeaders} />
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCustomHeader}
                disabled={disabled}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Header
              </Button>
            </div>

            {value.customHeaders && value.customHeaders.length > 0 ? (
              <div className="space-y-2">
                {value.customHeaders.map((header, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Header name"
                      value={header.name}
                      onChange={(e) => updateCustomHeader(index, 'name', e.target.value)}
                      disabled={disabled}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Header value"
                      value={header.value}
                      onChange={(e) => updateCustomHeader(index, 'value', e.target.value)}
                      disabled={disabled}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCustomHeader(index)}
                      disabled={disabled}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No custom headers configured. Add headers to include in webhook requests.
              </p>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

// Default empty webhook config
export const emptyWebhookConfig: InlineWebhookConfig = {
  url: '',
  events: ['*'],
}
