import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { sessionApi } from '@/features/sessions/api/session.api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2, Search } from 'lucide-react'
import { ApiExample } from '../../ApiExample'

interface TabProps {
  sessionId: string
}

export function GetChatPresenceTab({ sessionId }: TabProps) {
  const [chatId, setChatId] = useState('')

  const { data, isLoading, refetch, error } = useQuery({
    queryKey: ['chat-presence', sessionId, chatId],
    queryFn: () => sessionApi.getPresence(sessionId, chatId),
    enabled: false,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatId) return
    refetch()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Get Chat Presence</CardTitle>
          <CardDescription>
            Get presence for a specific chat ID. If not subscribed, it subscribes automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="presence-chat-id">Chat ID</Label>
              <div className="flex gap-2">
                <Input
                  id="presence-chat-id"
                  placeholder="1234567890@c.us"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  required
                />
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </form>

          {error && <div className="text-red-500 mt-4">Error: {(error as Error).message}</div>}

          {data && (
            <div className="mt-4 p-4 border rounded-md space-y-2">
              <div className="font-medium">Presence Data:</div>
              <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      <ApiExample
        method="GET"
        url={`/api/sessions/${sessionId}/presence/{chatId}`}
        description="Get presence for a chat."
      />
    </div>
  )
}
