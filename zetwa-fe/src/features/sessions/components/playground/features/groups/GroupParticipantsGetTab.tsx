import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Users, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'
import { ResponseDisplay } from '../../ResponseDisplay'

interface GroupParticipantsGetTabProps {
  sessionId: string
}

export function GroupParticipantsGetTab({ sessionId }: GroupParticipantsGetTabProps) {
  const [groupId, setGroupId] = useState('')
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
                <div className="border rounded-md p-2 max-h-[300px] overflow-y-auto text-xs">
                    {participantsList.map((p: any, i) => (
                        <div key={i} className="flex justify-between py-1 border-b last:border-0">
                            <span>{p.id._serialized || p.id}</span>
                            <span>{p.isAdmin ? 'Admin' : 'User'}</span>
                        </div>
                    ))}
                </div>
            )}
            
            <ResponseDisplay data={response} />
         </div>
      </div>

      <ApiExample 
          method="GET" 
          url={`/api/sessions/${sessionId}/groups/{id}/participants`}
          description="Get participants."
          parameters={[{ name: "id", type: "string", required: true, description: "Group ID" }]}
          responseExample={[
            {
              "id": {
                "_serialized": "628123...@c.us"
              },
              "isAdmin": true,
              "isSuperAdmin": false
            }
          ]}
          responseDescription="Returns a list of participants."
      />
    </div>
  )
}
