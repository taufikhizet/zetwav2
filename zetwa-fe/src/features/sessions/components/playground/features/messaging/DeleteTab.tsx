import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Trash2, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'

interface DeleteTabProps {
  sessionId: string
}

export function DeleteTab({ sessionId }: DeleteTabProps) {
  const [deleteMessageId, setDeleteMessageId] = useState('')
  const [deleteForEveryone, setDeleteForEveryone] = useState(true)

  const deleteMessageMutation = useMutation({
    mutationFn: () => sessionApi.deleteMessage(sessionId, deleteMessageId, deleteForEveryone),
    onSuccess: () => {
      toast.success('Message deleted successfully')
      setDeleteMessageId('')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete message')
    }
  })

  return (
    <div className="space-y-6">
    <div className="rounded-xl border bg-card p-6 shadow-sm">
       <div className="grid gap-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              Deleting a message for everyone (Revoke) only works within a limited time window after sending.
            </AlertDescription>
          </Alert>

          <div className="grid gap-2">
            <Label>Message ID</Label>
            <Input 
              placeholder="ID of message to delete" 
              value={deleteMessageId}
              onChange={(e) => setDeleteMessageId(e.target.value)}
              className="font-mono"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="forEveryone" 
              checked={deleteForEveryone}
              onCheckedChange={(checked) => setDeleteForEveryone(checked as boolean)}
            />
            <Label htmlFor="forEveryone" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Delete for everyone (revoke)
            </Label>
          </div>

          <Button 
            className="w-full" 
            variant="destructive"
            onClick={() => deleteMessageMutation.mutate()}
            disabled={!deleteMessageId || deleteMessageMutation.isPending}
          >
            {deleteMessageMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Delete Message
          </Button>
       </div>
    </div>

    <ApiExample 
      method="DELETE" 
      url={`/api/sessions/${sessionId}/messages/{messageId}`}
      description="Delete a message."
      parameters={[
        { name: "messageId", type: "string", required: true, description: "The ID of the message to delete" },
        { name: "forEveryone", type: "boolean", required: false, description: "Whether to delete for everyone (revoke) or just for me (default: true)" }
      ]}
    />
  </div>
  )
}
