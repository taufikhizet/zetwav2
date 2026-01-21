import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Loader2, Bell, BellOff, Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'
import { toast } from 'sonner'

interface FollowUnfollowTabProps {
  sessionId: string
}

export function FollowUnfollowTab({ sessionId }: FollowUnfollowTabProps) {
  const [channelId, setChannelId] = useState('')

  const useActionMutation = (
    action: 'follow' | 'unfollow' | 'mute' | 'unmute', 
    apiFunc: (sid: string, cid: string) => Promise<void>
  ) => {
    return useMutation({
      mutationFn: () => apiFunc(sessionId, channelId),
      onSuccess: () => {
        toast.success(`Channel ${action}ed successfully`)
      },
      onError: (error: Error) => {
        toast.error(`Error ${action}ing channel`, { description: error.message })
      },
    })
  }

  const followMutation = useActionMutation('follow', sessionApi.followChannel)
  const unfollowMutation = useActionMutation('unfollow', sessionApi.unfollowChannel)
  const muteMutation = useActionMutation('mute', sessionApi.muteChannel)
  const unmuteMutation = useActionMutation('unmute', sessionApi.unmuteChannel)

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-medium mb-4">Channel Actions</h3>
        
        <div className="space-y-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="channelId">Channel ID</Label>
            <Input
              id="channelId"
              placeholder="123@newsletter"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button 
                onClick={() => followMutation.mutate()} 
                disabled={!channelId || followMutation.isPending}
                className="w-full"
            >
                {followMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bell className="mr-2 h-4 w-4" />}
                Follow
            </Button>
            <Button 
                onClick={() => unfollowMutation.mutate()} 
                disabled={!channelId || unfollowMutation.isPending}
                variant="outline"
                className="w-full"
            >
                {unfollowMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BellOff className="mr-2 h-4 w-4" />}
                Unfollow
            </Button>
            <Button 
                onClick={() => muteMutation.mutate()} 
                disabled={!channelId || muteMutation.isPending}
                variant="secondary"
                className="w-full"
            >
                {muteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <VolumeX className="mr-2 h-4 w-4" />}
                Mute
            </Button>
            <Button 
                onClick={() => unmuteMutation.mutate()} 
                disabled={!channelId || unmuteMutation.isPending}
                variant="outline"
                className="w-full"
            >
                {unmuteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Volume2 className="mr-2 h-4 w-4" />}
                Unmute
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ApiExample
            method="POST"
            url={`/api/sessions/${sessionId}/channels/{id}/follow`}
            description="Follow a channel."
        />
        <ApiExample
            method="POST"
            url={`/api/sessions/${sessionId}/channels/{id}/unfollow`}
            description="Unfollow a channel."
        />
        <ApiExample
            method="POST"
            url={`/api/sessions/${sessionId}/channels/{id}/mute`}
            description="Mute a channel."
        />
        <ApiExample
            method="POST"
            url={`/api/sessions/${sessionId}/channels/{id}/unmute`}
            description="Unmute a channel."
        />
      </div>
    </div>
  )
}
