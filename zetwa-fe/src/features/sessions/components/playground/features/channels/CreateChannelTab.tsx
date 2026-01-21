import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'
import { ResponseDisplay } from '../../ResponseDisplay'
import { toast } from 'sonner'

interface CreateChannelTabProps {
  sessionId: string
}

export function CreateChannelTab({ sessionId }: CreateChannelTabProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [picture, setPicture] = useState('')

  const { mutate, isPending, data } = useMutation({
    mutationFn: (data: { name: string; description?: string; picture?: string }) => 
      sessionApi.createChannel(sessionId, data),
    onSuccess: () => {
      toast.success('Channel created successfully')
    },
    onError: (error: Error) => {
      toast.error('Error creating channel', { description: error.message })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return
    mutate({ name, description, picture })
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-medium mb-4">Create Channel</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Channel Name</Label>
            <Input
              id="name"
              placeholder="My Channel"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Channel description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="picture">Picture URL (Optional)</Label>
            <Input
              id="picture"
              placeholder="https://example.com/image.jpg"
              value={picture}
              onChange={(e) => setPicture(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Create Channel
          </Button>
        </form>

        {data && (
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-2">Response</h4>
            <ResponseDisplay data={data} />
          </div>
        )}
      </div>

      <ApiExample
        method="POST"
        url={`/api/sessions/${sessionId}/channels`}
        body={{
          name: "My Channel",
          description: "Channel description",
          picture: "https://example.com/image.jpg"
        }}
        description="Create a new channel."
      />
    </div>
  )
}
