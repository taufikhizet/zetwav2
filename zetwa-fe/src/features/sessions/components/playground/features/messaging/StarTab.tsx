import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Star, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'

interface StarTabProps {
  sessionId: string
}

export function StarTab({ sessionId }: StarTabProps) {
  const [starMsgId, setStarMsgId] = useState('')
  const [isStar, setIsStar] = useState(true)

  const starMessageMutation = useMutation({
    mutationFn: () => sessionApi.starMessage(sessionId, starMsgId, isStar),
    onSuccess: () => {
      toast.success(`Message ${isStar ? 'starred' : 'unstarred'} successfully`)
      setStarMsgId('')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to star/unstar message')
    }
  })

  return (
    <div className="grid gap-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
         <h3 className="font-semibold mb-4 flex items-center gap-2"><Star className="h-4 w-4" /> Star Message</h3>
         <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Message ID</Label>
              <Input value={starMsgId} onChange={(e) => setStarMsgId(e.target.value)} placeholder="Message ID to star" className="font-mono" />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="is-star" checked={isStar} onCheckedChange={setIsStar} />
              <Label htmlFor="is-star">Star Message</Label>
            </div>
            <Button onClick={() => starMessageMutation.mutate()} disabled={!starMsgId || starMessageMutation.isPending}>
              {starMessageMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isStar ? 'Star Message' : 'Unstar Message')}
            </Button>
         </div>
      </div>
      
      <ApiExample 
        method="POST" 
        url={`/api/sessions/${sessionId}/messages/star`}
        body={{
          messageId: starMsgId || "false_1234567890@c.us_3EB0...",
          star: isStar
        }}
        description="Star or unstar a specific message."
        parameters={[
          { name: "messageId", type: "string", required: true, description: "The ID of the message to star/unstar" },
          { name: "star", type: "boolean", required: true, description: "True to star, false to unstar" }
        ]}
      />
    </div>
  )
}
