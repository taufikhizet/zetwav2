
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

interface SetProfileNameTabProps {
  sessionId: string
}

export function SetProfileNameTab({ sessionId }: SetProfileNameTabProps) {
  const [name, setName] = useState('')
  const [response, setResponse] = useState<any>(null)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (newName: string) => sessionApi.setProfileName(sessionId, newName),
    onSuccess: () => {
      toast.success('Profile name updated')
      setResponse({ success: true, message: 'Profile name updated successfully' })
      queryClient.invalidateQueries({ queryKey: ['profile', sessionId] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update profile name')
    }
  })

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>New Name</Label>
            <Input 
              placeholder="Enter new display name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              maxLength={25}
            />
            <p className="text-xs text-muted-foreground">Max 25 characters</p>
          </div>
          
          <Button 
            onClick={() => mutation.mutate(name)} 
            disabled={!name || mutation.isPending}
          >
            {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
            Set Name
          </Button>
          
          <ResponseDisplay data={response} />
        </div>
      </div>

      <ApiExample 
        method="PUT" 
        url={`/api/sessions/${sessionId}/profile/name`}
        body={{ name: "New Name" }}
        description="Set the profile display name."
        parameters={[{ name: "name", type: "string", required: true, description: "New display name (max 25 chars)" }]}
        responseExample={{ success: true, message: "Profile name updated successfully" }}
      />
    </div>
  )
}
