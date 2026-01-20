
import { useState, useEffect } from 'react'
import { Calendar, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import type { ApiKey } from '../types'
import { useUpdateApiKey } from '../hooks'
import { getMinExpirationDate } from '../utils'

interface EditExpirationDialogProps {
  apiKey: ApiKey | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditExpirationDialog({
  apiKey,
  open,
  onOpenChange,
}: EditExpirationDialogProps) {
  const [expiresAt, setExpiresAt] = useState('')

  // Initialize state when dialog opens
  useEffect(() => {
    if (apiKey && open) {
      if (apiKey.expiresAt) {
        // Format for datetime-local input: YYYY-MM-DDThh:mm
        const date = new Date(apiKey.expiresAt)
        // Adjust for timezone offset to show correct local time in input
        const offset = date.getTimezoneOffset() * 60000
        const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16)
        setExpiresAt(localISOTime)
      } else {
        setExpiresAt('')
      }
    }
  }, [apiKey, open])

  const updateMutation = useUpdateApiKey({
    onSuccess: () => {
      onOpenChange(false)
    },
  })

  const handleSave = () => {
    if (!apiKey) return

    updateMutation.mutate({
      id: apiKey.id,
      data: {
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Edit Expiration
          </DialogTitle>
          <DialogDescription asChild>
            <p>Update the expiration date for <strong>{apiKey?.name}</strong>.</p>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-expiresAt">Expiration Date</Label>
            <Input
              id="edit-expiresAt"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={getMinExpirationDate()}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty for a key that never expires
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
