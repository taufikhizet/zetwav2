/**
 * Regenerate API Key Dialog Component
 */

import { useState, useEffect } from 'react'
import { Loader2, RefreshCw, Copy, Check, AlertTriangle, Eye, EyeOff, KeyRound } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card, CardContent } from '@/components/ui/card'

import type { ApiKey } from '../types'
import { useRegenerateApiKey } from '../hooks'
import { copyToClipboard } from '../utils'

interface RegenerateApiKeyDialogProps {
  apiKey: ApiKey | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RegenerateApiKeyDialog({
  apiKey,
  open,
  onOpenChange,
}: RegenerateApiKeyDialogProps) {
  const [newKey, setNewKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showKey, setShowKey] = useState(false)

  const regenerateMutation = useRegenerateApiKey({
    onSuccess: (data) => {
      if (data.key) {
        setNewKey(data.key)
      }
    },
  })

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      // Delay reset to allow closing animation
      const timer = setTimeout(() => {
        setNewKey(null)
        setCopied(false)
        setShowKey(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [open])

  const handleRegenerate = () => {
    if (!apiKey) return
    regenerateMutation.mutate(apiKey.id)
  }

  const handleCopy = async () => {
    if (!newKey) return
    const success = await copyToClipboard(newKey)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const maskKey = (key: string) => {
    return key.substring(0, 8) + '•'.repeat(24) + key.substring(key.length - 6)
  }

  // Show confirmation dialog first, then success state after regeneration
  if (newKey) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-green-600">
              <KeyRound className="h-5 w-5" />
              Key Regenerated Successfully
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your new API key has been generated. Make sure to copy it now - you won't be able
              to see it again.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Card className="bg-muted/50 border-dashed">
            <CardContent className="pt-4 pb-4">
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  New API Key
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm bg-background px-3 py-2 rounded-md border break-all">
                    {showKey ? newKey : maskKey(newKey)}
                  </code>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowKey(!showKey)}
                    className="flex-1"
                  >
                    {showKey ? (
                      <>
                        <EyeOff className="mr-2 h-4 w-4" />
                        Hide
                      </>
                    ) : (
                      <>
                        <Eye className="mr-2 h-4 w-4" />
                        Show
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCopy} className="flex-1">
                    {copied ? (
                      <>
                        <Check className="mr-2 h-4 w-4 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Key
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <AlertDialogFooter>
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-amber-500" />
            Regenerate API Key
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3" asChild>
            <div>
              <p>
                Are you sure you want to regenerate the key for <strong>"{apiKey?.name}"</strong>?
              </p>
              <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-md">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  The current key will be invalidated immediately. Any applications using this key
                  will need to be updated with the new key.
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleRegenerate} disabled={regenerateMutation.isPending}>
            {regenerateMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Regenerate Key
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
