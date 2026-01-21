import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { sessionApi } from '@/features/sessions/api/session.api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2, Archive } from 'lucide-react'
import { toast } from 'sonner'
import { ApiExample } from '../../ApiExample'

interface TabProps {
  sessionId: string
}

export function ArchiveChatTab({ sessionId }: TabProps) {
  const [chatId, setChatId] = useState('')

  const { mutate, isPending } = useMutation({
    mutationFn: (id: string) => sessionApi.archiveChat(sessionId, id, true),
    onSuccess: () => {
      toast.success('Chat archived successfully')
      setChatId('')
    },
    onError: (error: Error) => {
      toast.error('Error archiving chat', { description: error.message })
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
          <CardTitle>Archive Chat</CardTitle>
          <CardDescription>Archive a chat conversation.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="archive-chat-id">Chat ID</Label>
              <Input
                id="archive-chat-id"
                placeholder="1234567890@c.us"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Archive className="mr-2 h-4 w-4" />}
              Archive Chat
            </Button>
          </form>
        </CardContent>
      </Card>

      <ApiExample
        method="POST"
        url={`/api/sessions/${sessionId}/chats/{chatId}/archive`}
        description="Archive a chat."
      />
    </div>
  )
}
