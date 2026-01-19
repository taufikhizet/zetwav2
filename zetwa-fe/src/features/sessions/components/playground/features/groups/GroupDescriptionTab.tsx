import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'
import { ResponseDisplay } from '../../ResponseDisplay'

interface GroupDescriptionTabProps {
  sessionId: string
}

export function GroupDescriptionTab({ sessionId }: GroupDescriptionTabProps) {
  const [groupId, setGroupId] = useState('')
  const [description, setDescription] = useState('')
  const [response, setResponse] = useState<any>(null)

  const updateDescriptionMutation = useMutation({
    mutationFn: () => sessionApi.setDescription(sessionId, groupId, description),
    onSuccess: (data) => {
      toast.success('Description updated')
      setResponse(data)
    },
    onError: (error: any) => toast.error(error.message || 'Failed to update description')
  })

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
         <div className="grid gap-6">
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
                <Label>Description</Label>
                <div className="flex gap-2">
                    <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="New Description" />
                    <Button 
                        onClick={() => updateDescriptionMutation.mutate()} 
                        disabled={!groupId || !description || updateDescriptionMutation.isPending}
                    >
                        {updateDescriptionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update
                    </Button>
                </div>
            </div>
            
            <ResponseDisplay data={response} />
         </div>
      </div>

      <ApiExample 
          method="PUT" 
          url={`/api/sessions/${sessionId}/groups/{id}/description`}
          body={{ description: description || "New Description" }}
          description="Updates the group description."
          parameters={[{ name: "id", type: "string", required: true, description: "Group ID" }]}
          responseExample={null}
          responseDescription="Returns 200 OK with no content."
      />
    </div>
  )
}
