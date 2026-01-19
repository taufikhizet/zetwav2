import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'
import { ResponseDisplay } from '../../ResponseDisplay'

interface CreateGroupTabProps {
  sessionId: string
}

export function CreateGroupTab({ sessionId }: CreateGroupTabProps) {
  const [groupName, setGroupName] = useState('')
  const [participants, setParticipants] = useState('')
  const [response, setResponse] = useState<any>(null)

  const createGroupMutation = useMutation({
    mutationFn: () => {
      const participantList = participants.split(',').map(p => p.trim()).filter(Boolean)
      return sessionApi.createGroup(sessionId, { name: groupName, participants: participantList })
    },
    onSuccess: (data) => {
      toast.success('Group created successfully')
      setResponse(data)
      setGroupName('')
      setParticipants('')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create group')
    }
  })

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
         <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Group Name</Label>
              <Input 
                placeholder="My New Group" 
                value={groupName} 
                onChange={(e) => setGroupName(e.target.value)} 
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Participants (comma separated)</Label>
              <Textarea 
                placeholder="6281234567890, 6289876543210" 
                value={participants} 
                onChange={(e) => setParticipants(e.target.value)} 
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-muted-foreground">Phone numbers without + or spaces.</p>
            </div>

            <Button 
                onClick={() => createGroupMutation.mutate()} 
                disabled={!groupName || !participants || createGroupMutation.isPending}
                className="w-full"
            >
              {createGroupMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Create Group
            </Button>
            
            <ResponseDisplay data={response} />
         </div>
      </div>

      <ApiExample 
        method="POST" 
        url={`/api/sessions/${sessionId}/groups`}
        body={{
            name: groupName || "New Group Name",
            participants: participants ? participants.split(',').map(p => p.trim()) : ["6281234567890"]
        }}
        description="Create a new group."
        parameters={[
            { name: "name", type: "string", required: true, description: "Name of the group" },
            { name: "participants", type: "string[]", required: true, description: "Array of phone numbers to add" }
        ]}
        responseExample={{
          "groupId": "12036302...@g.us",
          "missingParticipants": []
        }}
        responseDescription="Returns the ID of the created group."
      />
    </div>
  )
}
