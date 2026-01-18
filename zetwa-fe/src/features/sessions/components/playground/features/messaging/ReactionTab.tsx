import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Smile, Star, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { sessionApi } from '@/features/sessions/api/session.api'

interface ReactionTabProps {
  sessionId: string
}

export function ReactionTab({ sessionId }: ReactionTabProps) {
  const [reactionMsgId, setReactionMsgId] = useState('')
  const [reactionEmoji, setReactionEmoji] = useState('❤️')
  const [starMsgId, setStarMsgId] = useState('')
  const [isStar, setIsStar] = useState(true)

  const sendReactionMutation = useMutation({
    mutationFn: () => sessionApi.sendReaction(sessionId, {
      messageId: reactionMsgId,
      reaction: reactionEmoji
    }),
    onSuccess: () => {
      toast.success('Reaction sent successfully')
      setReactionMsgId('')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send reaction')
    }
  })

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
    <div className="grid gap-6 md:grid-cols-2">
      {/* Reaction */}
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
         </div>
      </div>

      {/* Star */}
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
    </div>
  )
}
