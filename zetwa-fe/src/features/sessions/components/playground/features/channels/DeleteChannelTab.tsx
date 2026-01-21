import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'
import { toast } from 'sonner'

interface DeleteChannelTabProps {
  sessionId: string
}

export function DeleteChannelTab({ sessionId }: DeleteChannelTabProps) {
  const [channelId, setChannelId] = useState('')

  const { mutate, isPending } = useMutation({
    mutationFn: (id: string) => sessionApi.deleteChannel(sessionId, id),
    onSuccess: () => {
      toast.success('Channel deleted successfully')
      setChannelId('')
    },
    onError: (error: Error) => {
      toast.error('Error deleting channel', { description: error.message })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!channelId) return
    if (confirm('Are you sure you want to delete this channel?')) {
        mutate(channelId)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-medium mb-4">Delete Channel</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="channelId">Channel ID</Label>
            <Input
              id="channelId"
              placeholder="123@newsletter"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              required
            />
          </div>

          <Button type="submit" variant="destructive" disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Delete Channel
          </Button>
        </form>
      </div>

      <ApiExample
        method="DELETE"
        url={`/api/sessions/${sessionId}/channels/{id}`}
        description="Delete a channel."
      />
    </div>
  )
}
