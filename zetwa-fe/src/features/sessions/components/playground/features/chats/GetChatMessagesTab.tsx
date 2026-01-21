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

export function GetChatMessagesTab({ sessionId }: TabProps) {
  const [chatId, setChatId] = useState('')
  const [limit, setLimit] = useState(20)

  const { data, isLoading, refetch, error } = useQuery({
    queryKey: ['chat-messages', sessionId, chatId, limit],
    queryFn: () => sessionApi.getChatMessagesSpecific(sessionId, chatId, { limit }),
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
          <CardTitle>Get Chat Messages</CardTitle>
          <CardDescription>Get messages from a specific chat.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4 mb-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="msgs-chat-id">Chat ID</Label>
                <Input
                  id="msgs-chat-id"
                  placeholder="1234567890@c.us"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  required
                />
              </div>
              <div className="w-24">
                <Label htmlFor="msgs-limit">Limit</Label>
                <Input
                  id="msgs-limit"
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </form>

          {error && <div className="text-red-500 mb-4">Error: {(error as Error).message}</div>}

          <div className="space-y-2 max-h-[400px] overflow-y-auto border rounded-md p-2">
            {data?.map((msg: any) => (
              <div key={msg.id} className="p-2 border-b last:border-0 text-sm">
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{msg.from}</span>
                    <span>{new Date(msg.timestamp * 1000).toLocaleString()}</span>
                </div>
                <div className="mt-1">{msg.body}</div>
                <div className="text-xs text-muted-foreground mt-1">ID: {msg.id}</div>
              </div>
            ))}
            {data && data.length === 0 && <div className="text-center text-muted-foreground">No messages found.</div>}
            {!data && <div className="text-center text-muted-foreground">Enter Chat ID to fetch messages.</div>}
          </div>
        </CardContent>
      </Card>

      <ApiExample
        method="GET"
        url={`/api/sessions/${sessionId}/chats/{chatId}/messages`}
        description="Get chat messages."
      />
    </div>
  )
}
