import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { UserPlus, Info, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'
import { ResponseDisplay } from '../../ResponseDisplay'

interface JoinGroupTabProps {
  sessionId: string
}

export function JoinGroupTab({ sessionId }: JoinGroupTabProps) {
  const [inviteCode, setInviteCode] = useState('')
  const [groupInfo, setGroupInfo] = useState<any>(null)
  const [joinResponse, setJoinResponse] = useState<any>(null)

  const joinGroupMutation = useMutation({
    mutationFn: () => sessionApi.joinGroup(sessionId, inviteCode),
    onSuccess: (data) => {
      toast.success(`Joined group successfully!`)
      setJoinResponse(data)
      setInviteCode('')
      setGroupInfo(null)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to join group')
    }
  })

  const joinInfoMutation = useMutation({
    mutationFn: () => sessionApi.joinInfoGroup(sessionId, inviteCode),
    onSuccess: (data) => {
      setGroupInfo(data)
      toast.success('Group info retrieved')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to get group info')
    }
  })

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
         <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Invite Code / Link</Label>
              <Input 
                placeholder="FkjHas34..." 
                value={inviteCode} 
                onChange={(e) => {
                    // Extract code if full link is pasted
                    const val = e.target.value;
                    const code = val.includes('chat.whatsapp.com/') ? val.split('chat.whatsapp.com/')[1] : val;
                    setInviteCode(code)
                }} 
                className="font-mono"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <Button 
                    variant="outline"
                    onClick={() => joinInfoMutation.mutate()} 
                    disabled={!inviteCode || joinInfoMutation.isPending}
                >
                {joinInfoMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Info className="mr-2 h-4 w-4" />}
                Get Info
                </Button>

                <Button 
                    onClick={() => joinGroupMutation.mutate()} 
                    disabled={!inviteCode || joinGroupMutation.isPending}
                >
                {joinGroupMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                Join Group
                </Button>
            </div>

            {groupInfo && (
                <div className="mt-4 p-4 border rounded-lg bg-muted/50 text-sm">
                    <pre className="whitespace-pre-wrap overflow-auto max-h-[200px]">
                        {JSON.stringify(groupInfo, null, 2)}
                    </pre>
                </div>
            )}
            
            <ResponseDisplay data={joinResponse} title="Join Response" />
         </div>
      </div>

      <div className="space-y-4">
        <ApiExample 
            method="GET" 
            url={`/api/sessions/${sessionId}/groups/join-info?code={code}`}
            description="Get info about the group before joining."
            parameters={[
                { name: "code", type: "string", required: true, description: "Invite code or link" }
            ]}
            responseExample={{
              "id": "12036302...@g.us",
              "subject": "Group Name",
              "subjectOwner": "628123...@c.us",
              "subjectTime": 1705641234,
              "size": 5,
              "creation": 1705641234,
              "owner": "628123...@c.us",
              "desc": "Description"
            }}
            responseDescription="Returns information about the group from the invite code."
        />
        <ApiExample 
            method="POST" 
            url={`/api/sessions/${sessionId}/groups/join`}
            body={{ code: inviteCode || "AbCdEf123..." }}
            description="Join group via code."
            parameters={[
                { name: "code", type: "string", required: true, description: "Invite code or link" }
            ]}
            responseExample={{ "groupId": "12036302...@g.us" }}
            responseDescription="Returns the ID of the joined group."
        />
      </div>
    </div>
  )
}
