import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Smile, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'
import { ResponseDisplay } from '../../ResponseDisplay'

interface ReactionTabProps {
  sessionId: string
}

export function ReactionTab({ sessionId }: ReactionTabProps) {
  const [reactionMsgId, setReactionMsgId] = useState('')
  const [reactionEmoji, setReactionEmoji] = useState('❤️')
  const [response, setResponse] = useState<any>(null)

  const sendReactionMutation = useMutation({
    mutationFn: () => sessionApi.sendReaction(sessionId, {
      messageId: reactionMsgId,
      reaction: reactionEmoji
    }),
    onSuccess: (data) => {
      toast.success('Reaction sent successfully')
      setResponse(data)
      setReactionMsgId('')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send reaction')
    }
  })

  return (
    <div className="grid gap-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
         <h3 className="font-semibold mb-4 flex items-center gap-2"><Smile className="h-4 w-4" /> Send Reaction</h3>
         <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Message ID</Label>
              <Input value={reactionMsgId} onChange={(e) => setReactionMsgId(e.target.value)} placeholder="Message ID to react to" className="font-mono" />
            </div>
            <div className="grid gap-2">
              <Label>Emoji</Label>
              <Input value={reactionEmoji} onChange={(e) => setReactionEmoji(e.target.value)} placeholder="e.g. ❤️, 👍" />
            </div>
            <Button onClick={() => sendReactionMutation.mutate()} disabled={!reactionMsgId || !reactionEmoji || sendReactionMutation.isPending}>
              {sendReactionMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Send Reaction'}
            </Button>
            
            <ResponseDisplay data={response} />
         </div>
      </div>
      
      <ApiExample 
        method="POST" 
        url={`/api/sessions/${sessionId}/messages/reaction`}
        body={{
          messageId: reactionMsgId || "false_1234567890@c.us_3EB0...",
          reaction: reactionEmoji
        }}
        description="Send a reaction (emoji) to a specific message."
        parameters={[
          { name: "messageId", type: "string", required: true, description: "The ID of the message to react to" },
          { name: "reaction", type: "string", required: true, description: "The emoji to react with" }
        ]}
        responseExample={null}
        responseDescription="Returns 200 OK with no content."
      />
    </div>
  )
}
