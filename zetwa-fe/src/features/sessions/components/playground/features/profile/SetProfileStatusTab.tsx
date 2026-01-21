
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'
import { ResponseDisplay } from '../../ResponseDisplay'

interface SetProfileStatusTabProps {
  sessionId: string
}

export function SetProfileStatusTab({ sessionId }: SetProfileStatusTabProps) {
  const [status, setStatus] = useState('')
  const [response, setResponse] = useState<any>(null)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (newStatus: string) => sessionApi.setProfileStatus(sessionId, newStatus),
    onSuccess: () => {
      toast.success('Profile status updated')
      setResponse({ success: true, message: 'Profile status updated successfully' })
      queryClient.invalidateQueries({ queryKey: ['profile', sessionId] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update profile status')
    }
  })

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>New Status (About)</Label>
            <Input 
              placeholder="Enter new status (about info)" 
              value={status} 
              onChange={(e) => setStatus(e.target.value)} 
              maxLength={139}
            />
            <p className="text-xs text-muted-foreground">Max 139 characters</p>
          </div>
          
          <Button 
            onClick={() => mutation.mutate(status)} 
            disabled={!status || mutation.isPending}
          >
            {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
            Set Status
          </Button>
          
          <ResponseDisplay data={response} />
        </div>
      </div>

      <ApiExample 
        method="PUT" 
        url={`/api/sessions/${sessionId}/profile/status`}
        body={{ status: "Available" }}
        description="Set the profile status (About info)."
        parameters={[{ name: "status", type: "string", required: true, description: "New status text" }]}
        responseExample={{ success: true, message: "Profile status updated successfully" }}
      />
    </div>
  )
}
