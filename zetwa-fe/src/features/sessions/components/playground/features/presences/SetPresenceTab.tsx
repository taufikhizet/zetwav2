import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { sessionApi } from '@/features/sessions/api/session.api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Activity } from 'lucide-react'
import { toast } from 'sonner'
import { ApiExample } from '../../ApiExample'

interface TabProps {
  sessionId: string
}

export function SetPresenceTab({ sessionId }: TabProps) {
  const [presence, setPresence] = useState('available')

  const { mutate, isPending } = useMutation({
    mutationFn: (presenceState: string) => sessionApi.setPresence(sessionId, { presence: presenceState }),
    onSuccess: () => {
      toast.success(`Presence set to ${presence}`)
    },
    onError: (error: Error) => {
      toast.error('Error setting presence', { description: error.message })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutate(presence)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Set Presence</CardTitle>
          <CardDescription>Set the session's global presence status.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={presence} onValueChange={setPresence}>
                <SelectTrigger>
                  <SelectValue placeholder="Select presence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available (Online)</SelectItem>
                  <SelectItem value="unavailable">Unavailable (Offline)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Activity className="mr-2 h-4 w-4" />}
              Set Presence
            </Button>
          </form>
        </CardContent>
      </Card>

      <ApiExample
        method="POST"
        url={`/api/sessions/${sessionId}/presence`}
        body={{ presence: "available" }}
        description="Set session presence."
      />
    </div>
  )
}
