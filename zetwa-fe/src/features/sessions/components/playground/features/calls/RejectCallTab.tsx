import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Loader2, PhoneOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'
import { toast } from 'sonner'

interface RejectCallTabProps {
  sessionId: string
}

export function RejectCallTab({ sessionId }: RejectCallTabProps) {
  const [callId, setCallId] = useState('')

  const { mutate, isPending } = useMutation({
    mutationFn: (id: string) => sessionApi.rejectCall(sessionId, id),
    onSuccess: () => {
      toast.success('Call rejected successfully')
      setCallId('')
    },
    onError: (error: Error) => {
      toast.error('Error rejecting call', { description: error.message })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!callId) return
    mutate(callId)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-medium mb-4">Reject Incoming Call</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="callId">Call ID</Label>
            <Input
              id="callId"
              placeholder="Enter Call ID to reject"
              value={callId}
              onChange={(e) => setCallId(e.target.value)}
              required
            />
          </div>

          <Button type="submit" variant="destructive" disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <PhoneOff className="mr-2 h-4 w-4" />
            )}
            Reject Call
          </Button>
        </form>
      </div>

      <ApiExample
        method="POST"
        url={`/api/sessions/${sessionId}/calls/reject`}
        body={{
          callId: "ABCDEFGABCDEFGABCDEFGABCDEFG"
        }}
        description="Reject an incoming call."
      />
    </div>
  )
}
