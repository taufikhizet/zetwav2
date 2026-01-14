/**
 * Create API Key Dialog Component
 */

import { useState } from 'react'
import { Loader2, Copy, Check, AlertTriangle, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

import { ScopesSelector } from './ScopesSelector'
import type { ApiKey, CreateApiKeyFormState } from '../types'
import { DEFAULT_FORM_STATE } from '../types'
import { useCreateApiKey } from '../hooks'
import { copyToClipboard, getMinExpirationDate, validateKeyName } from '../utils'

interface CreateApiKeyDialogProps {
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CreateApiKeyDialog({ trigger, open: controlledOpen, onOpenChange: controlledOnOpenChange }: CreateApiKeyDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [form, setForm] = useState<CreateApiKeyFormState>(DEFAULT_FORM_STATE)
  const [newKey, setNewKey] = useState<ApiKey | null>(null)
  const [copied, setCopied] = useState(false)

  // Support both controlled and uncontrolled modes
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen

  const createMutation = useCreateApiKey({
    onSuccess: (data) => {
      setNewKey(data)
    },
  })

  const handleCreate = () => {
    const nameError = validateKeyName(form.name)
    if (nameError) return

    if (form.scopes.length === 0) return

    createMutation.mutate({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
      scopes: form.scopes,
    })
  }

  const handleCopyKey = async () => {
    if (!newKey?.key) return
    const success = await copyToClipboard(newKey.key, 'API key copied')
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleClose = () => {
    setOpen(false)
    // Reset after animation
    setTimeout(() => {
      setForm(DEFAULT_FORM_STATE)
      setNewKey(null)
      setCopied(false)
    }, 200)
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      handleClose()
    } else {
      setOpen(true)
    }
  }

  const nameError = form.name ? validateKeyName(form.name) : null

  // When using controlled mode with trigger, render trigger separately
  if (isControlled) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {newKey ? '🎉 API Key Created' : 'Create API Key'}
            </DialogTitle>
            <DialogDescription>
              {newKey
                ? 'Your API key has been created. Copy it now - you won\'t see it again!'
                : 'Create a new API key for external application access'}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto py-4 space-y-5">
            {newKey ? (
              /* Success State */
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl">
                  <Label className="text-green-700 dark:text-green-300 text-xs font-medium">
                    Your API Key
                  </Label>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="flex-1 font-mono text-sm bg-white dark:bg-gray-900 px-3 py-2.5 rounded-lg border break-all select-all">
                      {newKey.key}
                    </code>
                    <Button variant="outline" size="icon" onClick={handleCopyKey}>
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Store this key securely. You won't be able to view it again after closing this dialog.
                  </p>
                </div>
              </div>
            ) : (
              /* Form State */
              <>
                {/* Name Input */}
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="My API Key"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    className={nameError ? 'border-destructive' : ''}
                  />
                  {nameError && (
                    <p className="text-sm text-destructive">{nameError}</p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="What this key is used for..."
                    value={form.description}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                    rows={2}
                  />
                </div>

                {/* Expiration */}
                <div className="space-y-2">
                  <Label htmlFor="expiresAt">Expiration Date (optional)</Label>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    value={form.expiresAt}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, expiresAt: e.target.value }))
                    }
                    min={getMinExpirationDate()}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for a key that never expires
                  </p>
                </div>

                {/* Scopes */}
                <div className="space-y-2">
                  <Label>Permissions *</Label>
                  <ScopesSelector
                    selectedScopes={form.scopes}
                    onScopesChange={(scopes) => setForm((prev) => ({ ...prev, scopes }))}
                  />
                  {form.scopes.length === 0 && (
                    <p className="text-sm text-destructive">
                      Select at least one permission
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            {newKey ? (
              <Button onClick={handleClose}>Done</Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={createMutation.isPending || !form.name.trim() || form.scopes.length === 0}
                >
                  {createMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Key
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create API Key
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {newKey ? '🎉 API Key Created' : 'Create API Key'}
          </DialogTitle>
          <DialogDescription>
            {newKey
              ? 'Your API key has been created. Copy it now - you won\'t see it again!'
              : 'Create a new API key for external application access'}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto py-4 space-y-5">
          {newKey ? (
            /* Success State */
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl">
                <Label className="text-green-700 dark:text-green-300 text-xs font-medium">
                  Your API Key
                </Label>
                <div className="flex items-center gap-2 mt-2">
                  <code className="flex-1 font-mono text-sm bg-white dark:bg-gray-900 px-3 py-2.5 rounded-lg border break-all select-all">
                    {newKey.key}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyKey}
                    className="flex-shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-700 dark:text-amber-300">
                  <p className="font-medium">Store this key securely</p>
                  <p className="mt-1 text-amber-600 dark:text-amber-400">
                    This is the only time you'll see this key. If you lose it, you'll need to
                    regenerate a new one.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Create Form */
            <div className="space-y-5">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="My Application"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  maxLength={100}
                  className={nameError ? 'border-destructive' : ''}
                />
                {nameError ? (
                  <p className="text-xs text-destructive">{nameError}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    A descriptive name to identify this API key
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Used for production server integration..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  maxLength={500}
                  rows={2}
                  className="resize-none"
                />
              </div>

              {/* Expiration */}
              <div className="space-y-2">
                <Label htmlFor="expiresAt">Expiration</Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  min={getMinExpirationDate()}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for no expiration
                </p>
              </div>

              {/* Scopes */}
              <ScopesSelector
                selectedScopes={form.scopes}
                onScopesChange={(scopes) => setForm({ ...form, scopes })}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          {newKey ? (
            <Button onClick={handleClose} className="w-full sm:w-auto">
              Done
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={
                  createMutation.isPending ||
                  !form.name.trim() ||
                  form.name.trim().length < 3 ||
                  form.scopes.length === 0
                }
              >
                {createMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create API Key
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
