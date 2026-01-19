import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Users, UserPlus, UserMinus, Shield, ShieldOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'
import { ResponseDisplay } from '../../ResponseDisplay'

interface GroupParticipantsTabProps {
  sessionId: string
}

export function GroupParticipantsTab({ sessionId }: GroupParticipantsTabProps) {
  const [groupId, setGroupId] = useState('')
  const [participants, setParticipants] = useState('')
  const [participantsList, setParticipantsList] = useState<any[]>([])
  const [response, setResponse] = useState<any>(null)

  const getParticipantsMutation = useMutation({
    mutationFn: () => sessionApi.getParticipants(sessionId, groupId),
    onSuccess: (data) => {
      setParticipantsList(data)
      setResponse(data)
      toast.success('Participants retrieved')
    },
    onError: (error: any) => toast.error(error.message || 'Failed to get participants')
  })

  const addMutation = useMutation({
    mutationFn: () => sessionApi.addParticipants(sessionId, groupId, participants.split(',').map(p => p.trim())),
    onSuccess: (data) => {
      toast.success('Participants added')
      setResponse(data)
    },
    onError: (error: any) => toast.error(error.message || 'Failed to add participants')
  })

  const removeMutation = useMutation({
    mutationFn: () => sessionApi.removeParticipants(sessionId, groupId, participants.split(',').map(p => p.trim())),
    onSuccess: (data) => {
      toast.success('Participants removed')
      setResponse(data)
    },
    onError: (error: any) => toast.error(error.message || 'Failed to remove participants')
  })

  const promoteMutation = useMutation({
    mutationFn: () => sessionApi.promoteToAdmin(sessionId, groupId, participants.split(',').map(p => p.trim())),
    onSuccess: (data) => {
      toast.success('Participants promoted')
      setResponse(data)
    },
    onError: (error: any) => toast.error(error.message || 'Failed to promote participants')
  })

  const demoteMutation = useMutation({
    mutationFn: () => sessionApi.demoteToAdmin(sessionId, groupId, participants.split(',').map(p => p.trim())),
    onSuccess: (data) => {
      toast.success('Participants demoted')
      setResponse(data)
    },
    onError: (error: any) => toast.error(error.message || 'Failed to demote participants')
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

            <Button variant="outline" onClick={() => getParticipantsMutation.mutate()} disabled={!groupId}>
                {getParticipantsMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Users className="mr-2 h-4 w-4"/>}
                Get Participants
            </Button>

            {participantsList.length > 0 && (
                <div className="border rounded-md p-2 max-h-[150px] overflow-y-auto text-xs">
                    {participantsList.map((p: any, i) => (
                        <div key={i} className="flex justify-between py-1 border-b last:border-0">
                            <span>{p.id._serialized || p.id}</span>
                            <span>{p.isAdmin ? 'Admin' : 'User'}</span>
                        </div>
                    ))}
                </div>
            )}
            
            <div className="grid gap-2 border-t pt-4">
                <Label>Participants (comma separated IDs)</Label>
                <Textarea 
                    placeholder="628123...@c.us, 628987...@c.us" 
                    value={participants} 
                    onChange={(e) => setParticipants(e.target.value)} 
                    className="font-mono text-xs"
                />
                
                <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" onClick={() => addMutation.mutate()} disabled={!groupId || !participants}>
                        <UserPlus className="mr-2 h-4 w-4"/> Add
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => removeMutation.mutate()} disabled={!groupId || !participants}>
                        <UserMinus className="mr-2 h-4 w-4"/> Remove
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => promoteMutation.mutate()} disabled={!groupId || !participants}>
                        <Shield className="mr-2 h-4 w-4"/> Promote
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => demoteMutation.mutate()} disabled={!groupId || !participants}>
                        <ShieldOff className="mr-2 h-4 w-4"/> Demote
                    </Button>
                </div>
            </div>
            
            <ResponseDisplay data={response} />
         </div>
      </div>

      <div className="space-y-4">
        <ApiExample 
            method="GET" 
            url={`/api/sessions/${sessionId}/groups/{id}/participants`}
            description="Get participants."
            responseExample={[
                {
                  "id": { "_serialized": "628123...@c.us" },
                  "isAdmin": true,
                  "isSuperAdmin": false
                }
            ]}
            responseDescription="Returns a list of participants."
        />
        <ApiExample 
            method="POST" 
            url={`/api/sessions/${sessionId}/groups/{id}/participants/add`}
            body={{ participants: ["628123...@c.us"] }}
            description="Add participants."
            responseExample={{
                "success": true,
                "message": "Participants added"
            }}
            responseDescription="Returns confirmation."
        />
        <ApiExample 
            method="POST" 
            url={`/api/sessions/${sessionId}/groups/{id}/participants/remove`}
            body={{ participants: ["628123...@c.us"] }}
            description="Remove participants."
            responseExample={{
                "success": true,
                "message": "Participants removed"
            }}
            responseDescription="Returns confirmation."
        />
        <ApiExample 
            method="POST" 
            url={`/api/sessions/${sessionId}/groups/{id}/admin/promote`}
            body={{ participants: ["628123...@c.us"] }}
            description="Promote participants to admin users."
            responseExample={{
                "success": true,
                "message": "Participants promoted"
            }}
            responseDescription="Returns confirmation."
        />
        <ApiExample 
            method="POST" 
            url={`/api/sessions/${sessionId}/groups/{id}/admin/demote`}
            body={{ participants: ["628123...@c.us"] }}
            description="Demotes participants to regular users."
            responseExample={{
                "success": true,
                "message": "Participants demoted"
            }}
            responseDescription="Returns confirmation."
        />
      </div>
    </div>
  )
}
