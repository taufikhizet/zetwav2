import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Eye, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'
import { ResponseDisplay } from '../../ResponseDisplay'

interface MarkReadTabProps {
  sessionId: string
}

export function MarkReadTab({ sessionId }: MarkReadTabProps) {
  const [presenceChatId, setPresenceChatId] = useState('')
  const [response, setResponse] = useState<any>(null)

  const sendSeenMutation = useMutation({
    mutationFn: () => sessionApi.markChatRead(sessionId, presenceChatId, true),
    onSuccess: (data) => {
      toast.success('Chat marked as read')
      setResponse(data)
    },
    onError: (error: any) => toast.error(error.message || 'Failed to mark as read')
  })

  return (
    <div className="grid gap-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
         <h3 className="font-semibold mb-4 flex items-center gap-2"><Eye className="h-4 w-4" /> Mark as Read</h3>
         <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Chat ID / Phone Number</Label>
              <Input value={presenceChatId} onChange={(e) => setPresenceChatId(e.target.value)} placeholder="e.g. 6281234567890" className="font-mono" />
              <p className="text-[11px] text-muted-foreground">Phone number without + or spaces.</p>
            </div>
            
            <Button onClick={() => sendSeenMutation.mutate()} disabled={!presenceChatId || sendSeenMutation.isPending}>
              {sendSeenMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Mark as Read'}
            </Button>
            
            <ResponseDisplay data={response} />
         </div>
      </div>

      <ApiExample 
        method="POST" 
        url={`/api/sessions/${sessionId}/presence/seen/{chatId}`}
        description="Mark all messages in a chat as read (seen)."
        parameters={[
          { name: "chatId", type: "string", required: true, description: "The phone number or Chat ID" }
        ]}
        responseExample={null}
        responseDescription="Returns 200 OK with no content."
      />
    </div>
  )
}
