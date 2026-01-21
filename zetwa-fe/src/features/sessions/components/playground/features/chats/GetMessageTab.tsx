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

export function GetMessageTab({ sessionId }: TabProps) {
  const [chatId, setChatId] = useState('')
  const [messageId, setMessageId] = useState('')

  const { data, isLoading, refetch, error } = useQuery({
    queryKey: ['chat-message', sessionId, chatId, messageId],
    queryFn: () => sessionApi.getChatMessage(sessionId, chatId, messageId),
    enabled: false,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatId || !messageId) return
    refetch()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Get Message</CardTitle>
          <CardDescription>Get a specific message by ID.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="get-msg-chat-id">Chat ID</Label>
                <Input
                  id="get-msg-chat-id"
                  placeholder="1234567890@c.us"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="get-msg-id">Message ID</Label>
                <Input
                  id="get-msg-id"
                  placeholder="Message ID"
                  value={messageId}
                  onChange={(e) => setMessageId(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Get Message
            </Button>
          </form>

          {error && <div className="text-red-500 mt-4">Error: {(error as Error).message}</div>}

          {data && (
            <div className="mt-4 p-4 border rounded-md space-y-2">
              <div className="font-medium">Message Data:</div>
              <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-60">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      <ApiExample
        method="GET"
        url={`/api/sessions/${sessionId}/chats/{chatId}/messages/{messageId}`}
        description="Get a message by ID."
      />
    </div>
  )
}
