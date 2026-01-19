import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'
import { ResponseDisplay } from '../../ResponseDisplay'

interface GroupDeleteTabProps {
  sessionId: string
}

export function GroupDeleteTab({ sessionId }: GroupDeleteTabProps) {
  const [groupId, setGroupId] = useState('')
  const [response, setResponse] = useState<any>(null)

  const deleteGroupMutation = useMutation({
    mutationFn: () => sessionApi.deleteGroup(sessionId, groupId),
    onSuccess: (data) => {
      toast.success('Group deleted successfully')
      setResponse(data)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete group')
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
                variant="destructive"
                onClick={() => deleteGroupMutation.mutate()} 
                disabled={!groupId || deleteGroupMutation.isPending}
            >
            {deleteGroupMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            Delete Group
            </Button>
            
            <ResponseDisplay data={response} />
         </div>
      </div>

      <ApiExample 
          method="DELETE" 
          url={`/api/sessions/${sessionId}/groups/{id}`}
          description="Delete the group."
          parameters={[{ name: "id", type: "string", required: true, description: "Group ID" }]}
          responseExample={null}
          responseDescription="Returns 200 OK with no content."
      />
    </div>
  )
}
