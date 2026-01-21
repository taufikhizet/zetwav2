import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { sessionApi } from '@/features/sessions/api/session.api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2, Pin } from 'lucide-react'
import { toast } from 'sonner'
import { ApiExample } from '../../ApiExample'

interface TabProps {
  sessionId: string
}

export function PinMessageTab({ sessionId }: TabProps) {
  const [chatId, setChatId] = useState('')
  const [messageId, setMessageId] = useState('')
  const [duration, setDuration] = useState('0') // 0 for infinite/default

  const { mutate, isPending } = useMutation({
    mutationFn: (data: {chatId: string, messageId: string, duration: number}) => sessionApi.pinChatMessage(sessionId, data.chatId, data.messageId, data.duration),
    onSuccess: () => {
      toast.success('Message pinned successfully')
    },
    onError: (error: Error) => {
      toast.error('Error pinning message', { description: error.message })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatId || !messageId) return
    mutate({ chatId, messageId, duration: Number(duration) })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pin Message</CardTitle>
          <CardDescription>Pin a specific message.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pin-msg-chat-id">Chat ID</Label>
                <Input
                  id="pin-msg-chat-id"
                  placeholder="1234567890@c.us"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pin-msg-id">Message ID</Label>
                <Input
                  id="pin-msg-id"
                  placeholder="Message ID"
                  value={messageId}
                  onChange={(e) => setMessageId(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pin-duration">Duration (seconds, 0 for default)</Label>
              <Input
                id="pin-duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Pin className="mr-2 h-4 w-4" />}
              Pin Message
            </Button>
          </form>
        </CardContent>
      </Card>

      <ApiExample
        method="POST"
        url={`/api/sessions/${sessionId}/chats/{chatId}/messages/{messageId}/pin`}
        description="Pin a message."
      />
    </div>
  )
}
