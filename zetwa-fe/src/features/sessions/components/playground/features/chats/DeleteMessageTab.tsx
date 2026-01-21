import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { sessionApi } from '@/features/sessions/api/session.api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ApiExample } from '../../ApiExample'

interface TabProps {
  sessionId: string
}

export function DeleteMessageTab({ sessionId }: TabProps) {
  const [chatId, setChatId] = useState('')
  const [messageId, setMessageId] = useState('')

  const { mutate, isPending } = useMutation({
    mutationFn: (data: {chatId: string, messageId: string}) => sessionApi.deleteChatMessage(sessionId, data.chatId, data.messageId),
    onSuccess: () => {
      toast.success('Message deleted successfully')
      setChatId('')
      setMessageId('')
    },
    onError: (error: Error) => {
      toast.error('Error deleting message', { description: error.message })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatId || !messageId) return
    mutate({ chatId, messageId })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Delete Message</CardTitle>
          <CardDescription>Delete a specific message.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="del-msg-chat-id">Chat ID</Label>
                <Input
                  id="del-msg-chat-id"
                  placeholder="1234567890@c.us"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="del-msg-id">Message ID</Label>
                <Input
                  id="del-msg-id"
                  placeholder="Message ID"
                  value={messageId}
                  onChange={(e) => setMessageId(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Delete Message
            </Button>
          </form>
        </CardContent>
      </Card>

      <ApiExample
        method="DELETE"
        url={`/api/sessions/${sessionId}/chats/{chatId}/messages/{messageId}`}
        description="Delete a message."
      />
    </div>
  )
}
