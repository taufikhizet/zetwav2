import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Activity, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'
import { ResponseDisplay } from '../../ResponseDisplay'

interface StopTypingTabProps {
  sessionId: string
}

export function StopTypingTab({ sessionId }: StopTypingTabProps) {
  const [presenceChatId, setPresenceChatId] = useState('')
  const [response, setResponse] = useState<any>(null)

  const stopTypingMutation = useMutation({
    mutationFn: () => sessionApi.stopTyping(sessionId, presenceChatId),
    onSuccess: (data) => {
      toast.success('Typing indicator stopped')
      setResponse(data)
    },
    onError: (error: any) => toast.error(error.message || 'Failed to stop typing')
  })

  return (
    <div className="grid gap-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
         <h3 className="font-semibold mb-4 flex items-center gap-2"><Activity className="h-4 w-4" /> Stop Typing</h3>
         <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Chat ID / Phone Number</Label>
              <Input value={presenceChatId} onChange={(e) => setPresenceChatId(e.target.value)} placeholder="e.g. 6281234567890" className="font-mono" />
              <p className="text-[11px] text-muted-foreground">Phone number without + or spaces.</p>
            </div>
            
            <Button variant="outline" onClick={() => stopTypingMutation.mutate()} disabled={!presenceChatId || stopTypingMutation.isPending}>
              {stopTypingMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Stop Typing'}
            </Button>
            
            <ResponseDisplay data={response} />
         </div>
      </div>

      <ApiExample 
          method="DELETE" 
          url={`/api/sessions/${sessionId}/presence/typing/{chatId}`}
          description="Stop typing indicator."
          parameters={[
          { name: "chatId", type: "string", required: true, description: "The phone number or Chat ID" }
          ]}
          responseExample={null}
          responseDescription="Returns 200 OK with no content."
      />
    </div>
  )
}
