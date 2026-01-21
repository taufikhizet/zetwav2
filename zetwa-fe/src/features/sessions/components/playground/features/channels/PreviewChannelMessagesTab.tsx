import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'
import { ResponseDisplay } from '../../ResponseDisplay'

interface PreviewChannelMessagesTabProps {
  sessionId: string
}

export function PreviewChannelMessagesTab({ sessionId }: PreviewChannelMessagesTabProps) {
  const [channelId, setChannelId] = useState('')
  const [limit, setLimit] = useState(10)
  const [queryEnabled, setQueryEnabled] = useState(false)

  const { data: messages, isLoading, refetch, error } = useQuery({
    queryKey: ['channel-messages', sessionId, channelId, limit],
    queryFn: () => sessionApi.previewChannelMessages(sessionId, channelId, { limit }),
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
        <h3 className="text-lg font-medium mb-4">Preview Channel Messages</h3>
        
        <form onSubmit={handleSearch} className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
                <Label htmlFor="channelId">Channel ID or Invite Code</Label>
                <Input
                id="channelId"
                placeholder="123@newsletter or https://whatsapp.com/channel/..."
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="limit">Limit</Label>
                <Input
                id="limit"
                type="number"
                min={1}
                max={100}
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                />
            </div>
          </div>
          <Button type="submit" disabled={isLoading || !channelId}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            Preview Messages
          </Button>
        </form>

        {error && (
            <div className="p-4 mb-4 text-sm text-red-500 bg-red-50 rounded-lg border border-red-200">
                Error: {(error as Error).message}
            </div>
        )}

        {messages && <ResponseDisplay data={messages} />}
      </div>

      <ApiExample
        method="GET"
        url={`/api/sessions/${sessionId}/channels/{id}/messages/preview`}
        description="Preview messages from a channel."
      />
    </div>
  )
}
