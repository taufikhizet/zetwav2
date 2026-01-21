import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'
import { ResponseDisplay } from '../../ResponseDisplay'

interface GetChannelTabProps {
  sessionId: string
}

export function GetChannelTab({ sessionId }: GetChannelTabProps) {
  const [channelId, setChannelId] = useState('')
  const [queryEnabled, setQueryEnabled] = useState(false)

  const { data: channel, isLoading, refetch, error } = useQuery({
    queryKey: ['channel', sessionId, channelId],
    queryFn: () => sessionApi.getChannel(sessionId, channelId),
    enabled: queryEnabled && !!channelId,
    retry: false
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (channelId) {
      setQueryEnabled(true)
      refetch()
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-medium mb-4">Get Channel Info</h3>
        
        <form onSubmit={handleSearch} className="flex gap-4 items-end mb-6">
          <div className="flex-1 space-y-2">
            <Label htmlFor="channelId">Channel ID or Invite Code</Label>
            <Input
              id="channelId"
              placeholder="123@newsletter or https://whatsapp.com/channel/..."
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={isLoading || !channelId}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            Get Info
          </Button>
        </form>

        {error && (
            <div className="p-4 mb-4 text-sm text-red-500 bg-red-50 rounded-lg border border-red-200">
                Error: {(error as Error).message}
            </div>
        )}

        {channel && <ResponseDisplay data={channel} />}
      </div>

      <ApiExample
        method="GET"
        url={`/api/sessions/${sessionId}/channels/{id}`}
        description="Get channel info by ID or Invite Code."
      />
    </div>
  )
}
