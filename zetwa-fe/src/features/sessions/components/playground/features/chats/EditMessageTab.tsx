import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { sessionApi } from '@/features/sessions/api/session.api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { ApiExample } from '../../ApiExample'

interface TabProps {
  sessionId: string
}

export function EditMessageTab({ sessionId }: TabProps) {
  const [chatId, setChatId] = useState('')
  const [messageId, setMessageId] = useState('')
  const [content, setContent] = useState('')

  const { mutate, isPending } = useMutation({
    mutationFn: (data: {chatId: string, messageId: string, content: string}) => sessionApi.editChatMessage(sessionId, data.chatId, data.messageId, data.content),
    onSuccess: () => {
      toast.success('Message edited successfully')
      setContent('')
    },
    onError: (error: Error) => {
      toast.error('Error editing message', { description: error.message })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatId || !messageId || !content) return
    mutate({ chatId, messageId, content })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Message</CardTitle>
          <CardDescription>Edit a specific message.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-msg-chat-id">Chat ID</Label>
                <Input
                  id="edit-msg-chat-id"
                  placeholder="1234567890@c.us"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-msg-id">Message ID</Label>
                <Input
                  id="edit-msg-id"
                  placeholder="Message ID"
                  value={messageId}
                  onChange={(e) => setMessageId(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-content">New Content</Label>
              <Input
                id="edit-content"
                placeholder="New message text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Pencil className="mr-2 h-4 w-4" />}
              Edit Message
            </Button>
          </form>
        </CardContent>
      </Card>

      <ApiExample
        method="PUT"
        url={`/api/sessions/${sessionId}/chats/{chatId}/messages/{messageId}`}
        description="Edit a message."
      />
    </div>
  )
}
