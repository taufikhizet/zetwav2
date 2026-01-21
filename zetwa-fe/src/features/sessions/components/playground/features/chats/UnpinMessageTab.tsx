import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { sessionApi } from '@/features/sessions/api/session.api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2, PinOff } from 'lucide-react'
import { toast } from 'sonner'
import { ApiExample } from '../../ApiExample'

interface TabProps {
  sessionId: string
}

export function UnpinMessageTab({ sessionId }: TabProps) {
  const [chatId, setChatId] = useState('')
  const [messageId, setMessageId] = useState('')

  const { mutate, isPending } = useMutation({
    mutationFn: (data: {chatId: string, messageId: string}) => sessionApi.unpinChatMessage(sessionId, data.chatId, data.messageId),
    onSuccess: () => {
      toast.success('Message unpinned successfully')
    },
    onError: (error: Error) => {
      toast.error('Error unpinning message', { description: error.message })
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
          <CardTitle>Unpin Message</CardTitle>
          <CardDescription>Unpin a specific message.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unpin-msg-chat-id">Chat ID</Label>
                <Input
                  id="unpin-msg-chat-id"
                  placeholder="1234567890@c.us"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unpin-msg-id">Message ID</Label>
                <Input
                  id="unpin-msg-id"
                  placeholder="Message ID"
                  value={messageId}
                  onChange={(e) => setMessageId(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PinOff className="mr-2 h-4 w-4" />}
              Unpin Message
            </Button>
          </form>
        </CardContent>
      </Card>

      <ApiExample
        method="POST"
        url={`/api/sessions/${sessionId}/chats/{chatId}/messages/{messageId}/unpin`}
        description="Unpin a message."
      />
    </div>
  )
}
