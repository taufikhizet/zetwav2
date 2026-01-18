import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Activity, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sessionApi } from '@/features/sessions/api/session.api'

interface PresenceTabProps {
  sessionId: string
}

export function PresenceTab({ sessionId }: PresenceTabProps) {
  const [presenceChatId, setPresenceChatId] = useState('')

  const sendTypingMutation = useMutation({
    mutationFn: () => sessionApi.sendTyping(sessionId, presenceChatId),
    onSuccess: () => toast.success('Typing indicator sent'),
    onError: (error: any) => toast.error(error.message || 'Failed to send typing')
  })

  const stopTypingMutation = useMutation({
    mutationFn: () => sessionApi.stopTyping(sessionId, presenceChatId),
    onSuccess: () => toast.success('Typing indicator stopped'),
    onError: (error: any) => toast.error(error.message || 'Failed to stop typing')
  })

  const sendSeenMutation = useMutation({
    mutationFn: () => sessionApi.markChatRead(sessionId, presenceChatId, true),
    onSuccess: () => toast.success('Chat marked as read'),
    onError: (error: any) => toast.error(error.message || 'Failed to mark as read')
  })

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
         <div className="grid gap-6">
            <div className="grid gap-2">
              <Label>Chat ID / Phone Number</Label>
              <Input value={presenceChatId} onChange={(e) => setPresenceChatId(e.target.value)} placeholder="e.g. 6281234567890" className="font-mono" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" onClick={() => sendTypingMutation.mutate()} disabled={!presenceChatId || sendTypingMutation.isPending}>
                <Activity className="mr-2 h-4 w-4" /> Start Typing
              </Button>
              <Button variant="outline" onClick={() => stopTypingMutation.mutate()} disabled={!presenceChatId || stopTypingMutation.isPending}>
                <Activity className="mr-2 h-4 w-4" /> Stop Typing
              </Button>
              <Button variant="outline" onClick={() => sendSeenMutation.mutate()} disabled={!presenceChatId || sendSeenMutation.isPending}>
                <Eye className="mr-2 h-4 w-4" /> Mark as Read
              </Button>
            </div>
         </div>
      </div>
    </div>
  )
}
