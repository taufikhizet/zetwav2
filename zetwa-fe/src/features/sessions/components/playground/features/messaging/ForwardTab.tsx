import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Forward, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sessionApi } from '@/features/sessions/api/session.api'

interface ForwardTabProps {
  sessionId: string
}

export function ForwardTab({ sessionId }: ForwardTabProps) {
  const [forwardTo, setForwardTo] = useState('')
  const [forwardMessageId, setForwardMessageId] = useState('')

  const forwardMessageMutation = useMutation({
    mutationFn: () => sessionApi.forwardMessage(sessionId, { messageId: forwardMessageId, to: forwardTo }),
    onSuccess: () => {
      toast.success('Message forwarded successfully')
      setForwardMessageId('')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to forward message')
    }
  })

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
       <div className="grid gap-6">
          <div className="grid gap-2">
            <Label>Message ID</Label>
            <Input 
              placeholder="ID of message to forward" 
              value={forwardMessageId}
              onChange={(e) => setForwardMessageId(e.target.value)}
              className="font-mono"
            />
          </div>
          
          <div className="grid gap-2">
            <Label>Forward To</Label>
            <Input 
              placeholder="e.g. 6281234567890" 
              value={forwardTo}
              onChange={(e) => setForwardTo(e.target.value)}
              className="font-mono"
            />
          </div>

          <Button 
            className="w-full" 
            onClick={() => forwardMessageMutation.mutate()}
            disabled={!forwardMessageId || !forwardTo || forwardMessageMutation.isPending}
          >
            {forwardMessageMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Forward className="mr-2 h-4 w-4" />
            )}
            Forward Message
          </Button>
       </div>
    </div>
  )
}
