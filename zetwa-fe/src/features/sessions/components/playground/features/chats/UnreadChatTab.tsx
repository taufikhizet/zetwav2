import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { sessionApi } from '@/features/sessions/api/session.api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2, MailQuestion } from 'lucide-react'
import { toast } from 'sonner'
import { ApiExample } from '../../ApiExample'

interface TabProps {
  sessionId: string
}

export function UnreadChatTab({ sessionId }: TabProps) {
  const [chatId, setChatId] = useState('')

  const { mutate, isPending } = useMutation({
    mutationFn: (id: string) => sessionApi.unreadChat(sessionId, id),
    onSuccess: () => {
      toast.success('Chat marked as unread')
      setChatId('')
    },
    onError: (error: Error) => {
      toast.error('Error marking chat as unread', { description: error.message })
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
          <CardTitle>Mark Chat Unread</CardTitle>
          <CardDescription>Mark a chat as unread.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="unread-chat-id">Chat ID</Label>
              <Input
                id="unread-chat-id"
                placeholder="1234567890@c.us"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MailQuestion className="mr-2 h-4 w-4" />}
              Mark Unread
            </Button>
          </form>
        </CardContent>
      </Card>

      <ApiExample
        method="POST"
        url={`/api/sessions/${sessionId}/chats/{chatId}/unread`}
        description="Mark a chat as unread."
      />
    </div>
  )
}
