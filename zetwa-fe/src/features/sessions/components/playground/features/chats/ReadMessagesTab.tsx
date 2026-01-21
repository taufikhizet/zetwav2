import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { sessionApi } from '@/features/sessions/api/session.api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCheck } from 'lucide-react'
import { toast } from 'sonner'
import { ApiExample } from '../../ApiExample'

interface TabProps {
  sessionId: string
}

export function ReadMessagesTab({ sessionId }: TabProps) {
  const [chatId, setChatId] = useState('')

  const { mutate, isPending } = useMutation({
    mutationFn: (id: string) => sessionApi.readChatMessages(sessionId, id),
    onSuccess: () => {
      toast.success('Messages marked as read')
      setChatId('')
    },
    onError: (error: Error) => {
      toast.error('Error marking messages as read', { description: error.message })
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
          <CardTitle>Mark Messages Read</CardTitle>
          <CardDescription>Mark all messages in a chat as read.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="read-chat-id">Chat ID</Label>
              <Input
                id="read-chat-id"
                placeholder="1234567890@c.us"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCheck className="mr-2 h-4 w-4" />}
              Mark Read
            </Button>
          </form>
        </CardContent>
      </Card>

      <ApiExample
        method="POST"
        url={`/api/sessions/${sessionId}/chats/{chatId}/messages/read`}
        description="Mark messages read."
      />
    </div>
  )
}
