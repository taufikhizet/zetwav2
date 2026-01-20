/**
 * Delete API Key Dialog Component
 */

import { Loader2, AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import type { ApiKey } from '../types'
import { useDeleteApiKey } from '../hooks'

interface DeleteApiKeyDialogProps {
  apiKey: ApiKey | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteApiKeyDialog({ apiKey, open, onOpenChange }: DeleteApiKeyDialogProps) {
  const deleteMutation = useDeleteApiKey({
    onSuccess: () => {
      onOpenChange(false)
    },
  })

  const handleDelete = () => {
    if (!apiKey) return
    deleteMutation.mutate(apiKey.id)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete API Key
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3" asChild>
            <div>
              <p>
                Are you sure you want to delete <strong>"{apiKey?.name}"</strong>?
              </p>
              <p className="text-destructive">
                This action cannot be undone. Any applications using this key will immediately
                lose access.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
