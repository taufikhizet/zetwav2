import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Activity, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'

interface StartTypingTabProps {
  sessionId: string
}

export function StartTypingTab({ sessionId }: StartTypingTabProps) {
  const [presenceChatId, setPresenceChatId] = useState('')

  const sendTypingMutation = useMutation({
    mutationFn: () => sessionApi.sendTyping(sessionId, presenceChatId),
    onSuccess: () => toast.success('Typing indicator sent'),
    onError: (error: any) => toast.error(error.message || 'Failed to send typing')
  })

  return (
    <div className="grid gap-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
         <h3 className="font-semibold mb-4 flex items-center gap-2"><Activity className="h-4 w-4" /> Start Typing</h3>
         <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Chat ID / Phone Number</Label>
              <Input value={presenceChatId} onChange={(e) => setPresenceChatId(e.target.value)} placeholder="e.g. 6281234567890" className="font-mono" />
              <p className="text-[11px] text-muted-foreground">Phone number without + or spaces.</p>
            </div>
            
            <Button onClick={() => sendTypingMutation.mutate()} disabled={!presenceChatId || sendTypingMutation.isPending}>
              {sendTypingMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Start Typing'}
            </Button>
         </div>
      </div>

      <ApiExample 
          method="POST" 
          url={`/api/sessions/${sessionId}/presence/typing/{chatId}`}
          description="Send typing indicator (start typing)."
          parameters={[
          { name: "chatId", type: "string", required: true, description: "The phone number or Chat ID" }
          ]}
      />
    </div>
  )
}
