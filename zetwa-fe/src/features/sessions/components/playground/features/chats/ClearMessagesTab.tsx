import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { sessionApi } from '@/features/sessions/api/session.api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2, Eraser } from 'lucide-react'
import { toast } from 'sonner'
import { ApiExample } from '../../ApiExample'

interface TabProps {
  sessionId: string
}

export function ClearMessagesTab({ sessionId }: TabProps) {
  const [chatId, setChatId] = useState('')

  const { mutate, isPending } = useMutation({
    mutationFn: (id: string) => sessionApi.clearChatMessages(sessionId, id),
    onSuccess: () => {
      toast.success('Messages cleared successfully')
      setChatId('')
    },
    onError: (error: Error) => {
      toast.error('Error clearing messages', { description: error.message })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatId) return
    mutate(chatId)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Clear Chat Messages</CardTitle>
          <CardDescription>Clear all messages in a chat.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clear-chat-id">Chat ID</Label>
              <Input
                id="clear-chat-id"
                placeholder="1234567890@c.us"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                required
              />
            </div>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eraser className="mr-2 h-4 w-4" />}
              Clear Messages
            </Button>
          </form>
        </CardContent>
      </Card>

      <ApiExample
        method="DELETE"
        url={`/api/sessions/${sessionId}/chats/{chatId}/messages`}
        description="Clear chat messages."
      />
    </div>
  )
}
