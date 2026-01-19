import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Forward, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'

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
    <div className="space-y-6">
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

    <ApiExample 
      method="POST" 
      url={`/api/sessions/${sessionId}/messages/forward`}
      body={{
        messageId: forwardMessageId || "false_1234567890@c.us_3EB0...",
        to: forwardTo || "6281234567890"
      }}
      description="Forward a message to another chat."
      parameters={[
        { name: "messageId", type: "string", required: true, description: "The ID of the message to forward" },
        { name: "to", type: "string", required: true, description: "Recipient's phone number or chat ID" }
      ]}
    />
  </div>
  )
}
