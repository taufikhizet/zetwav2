import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Info, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'
import { ResponseDisplay } from '../../ResponseDisplay'

interface GroupInfoTabProps {
  sessionId: string
}

export function GroupInfoTab({ sessionId }: GroupInfoTabProps) {
  const [groupId, setGroupId] = useState('')
  const [groupData, setGroupData] = useState<any>(null)

  const getGroupMutation = useMutation({
    mutationFn: () => sessionApi.getGroup(sessionId, groupId),
    onSuccess: (data) => {
      setGroupData(data)
      toast.success('Group data retrieved')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to get group')
    }
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
            
            <Button 
                variant="outline"
                onClick={() => getGroupMutation.mutate()} 
                disabled={!groupId || getGroupMutation.isPending}
            >
            {getGroupMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Info className="mr-2 h-4 w-4" />}
            Get Info
            </Button>

            <ResponseDisplay data={groupData} />
         </div>
      </div>

      <ApiExample 
          method="GET" 
          url={`/api/sessions/${sessionId}/groups/{id}`}
          description="Get the group."
          parameters={[{ name: "id", type: "string", required: true, description: "Group ID" }]}
          responseExample={{
            "id": "12036302...@g.us",
            "name": "My Group",
            "description": "Group Description",
            "owner": "628123...@c.us",
            "participants": [
              {
                "id": "628123...@c.us",
                "isAdmin": true,
                "isSuperAdmin": true
              }
            ],
            "createdAt": 1705641234,
            "inviteCode": "AbCdEf123..."
          }}
          responseDescription="Returns the group object."
      />
    </div>
  )
}
