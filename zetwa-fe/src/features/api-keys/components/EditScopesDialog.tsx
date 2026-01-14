/**
 * Edit Scopes Dialog Component
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

import { ScopesSelector } from './ScopesSelector'
import type { ApiKey } from '../types'
import { useUpdateApiKeyScopes } from '../hooks'

interface EditScopesDialogProps {
  apiKey: ApiKey | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditScopesDialog({ apiKey, open, onOpenChange }: EditScopesDialogProps) {
  const [scopes, setScopes] = useState<string[]>([])

  const updateScopesMutation = useUpdateApiKeyScopes({
    onSuccess: () => {
      onOpenChange(false)
    },
  })

  useEffect(() => {
    if (apiKey) {
      setScopes([...apiKey.scopes])
    }
  }, [apiKey])

  const handleSave = () => {
    if (!apiKey || scopes.length === 0) return
    updateScopesMutation.mutate({ id: apiKey.id, scopes })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Scopes</DialogTitle>
          <DialogDescription>
            Update permissions for "{apiKey?.name}"
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto py-4">
          <ScopesSelector
            selectedScopes={scopes}
            onScopesChange={setScopes}
            disabled={updateScopesMutation.isPending}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateScopesMutation.isPending || scopes.length === 0}
          >
            {updateScopesMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Scopes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
