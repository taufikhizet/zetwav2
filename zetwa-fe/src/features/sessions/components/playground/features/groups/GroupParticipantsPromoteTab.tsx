import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Shield, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'
import { ResponseDisplay } from '../../ResponseDisplay'

interface GroupParticipantsPromoteTabProps {
  sessionId: string
}

export function GroupParticipantsPromoteTab({ sessionId }: GroupParticipantsPromoteTabProps) {
  const [groupId, setGroupId] = useState('')
  const [participants, setParticipants] = useState('')
  const [response, setResponse] = useState<any>(null)

  const promoteMutation = useMutation({
    mutationFn: () => sessionApi.promoteToAdmin(sessionId, groupId, participants.split(',').map(p => p.trim())),
    onSuccess: (data) => {
      toast.success('Participants promoted')
      setResponse(data)
    },
    onError: (error: any) => toast.error(error.message || 'Failed to promote participants')
  })

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
         <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Group ID</Label>
              <Input 
                placeholder="12036302... @g.us" 
                value={groupId} 
                onChange={(e) => setGroupId(e.target.value)} 
                className="font-mono"
              />
            </div>
            
            <div className="grid gap-2">
                <Label>Participants (comma separated IDs)</Label>
                <Textarea 
                    placeholder="628123...@c.us, 628987...@c.us" 
                    value={participants} 
                    onChange={(e) => setParticipants(e.target.value)} 
                    className="font-mono text-xs"
                />
                
                <Button size="sm" variant="secondary" onClick={() => promoteMutation.mutate()} disabled={!groupId || !participants || promoteMutation.isPending}>
                    {promoteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Shield className="mr-2 h-4 w-4"/>}
                    Promote to Admin
                </Button>
            </div>
            
            <ResponseDisplay data={response} />
         </div>
      </div>

      <ApiExample 
          method="POST" 
          url={`/api/sessions/${sessionId}/groups/{id}/admin/promote`}
          body={{ participants: ["628123...@c.us"] }}
          description="Promote participants to admin users."
          parameters={[{ name: "id", type: "string", required: true, description: "Group ID" }]}
          responseExample={null}
          responseDescription="Returns 200 OK with no content."
      />
    </div>
  )
}
