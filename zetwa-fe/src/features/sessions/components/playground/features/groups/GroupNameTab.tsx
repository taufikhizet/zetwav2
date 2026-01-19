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

interface GroupNameTabProps {
  sessionId: string
}

export function GroupNameTab({ sessionId }: GroupNameTabProps) {
  const [groupId, setGroupId] = useState('')
  const [subject, setSubject] = useState('')
  const [response, setResponse] = useState<any>(null)

  const updateSubjectMutation = useMutation({
    mutationFn: () => sessionApi.setSubject(sessionId, groupId, subject),
    onSuccess: (data) => {
      toast.success('Subject updated')
      setResponse(data)
    },
    onError: (error: any) => toast.error(error.message || 'Failed to update subject')
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
                <Label>Subject</Label>
                <div className="flex gap-2">
                    <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="New Subject" />
                    <Button 
                        onClick={() => updateSubjectMutation.mutate()} 
                        disabled={!groupId || !subject || updateSubjectMutation.isPending}
                    >
                        {updateSubjectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update
                    </Button>
                </div>
            </div>
            
            <ResponseDisplay data={response} />
         </div>
      </div>

      <ApiExample 
          method="PUT" 
          url={`/api/sessions/${sessionId}/groups/{id}/subject`}
          body={{ subject: subject || "New Subject" }}
          description="Updates the group subject."
          parameters={[{ name: "id", type: "string", required: true, description: "Group ID" }]}
          responseExample={null}
          responseDescription="Returns 200 OK with no content."
      />
    </div>
  )
}
