import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Link, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'
import { ResponseDisplay } from '../../ResponseDisplay'

interface GroupInviteTabProps {
  sessionId: string
}

export function GroupInviteTab({ sessionId }: GroupInviteTabProps) {
  const [groupId, setGroupId] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [response, setResponse] = useState<any>(null)

  const getInviteMutation = useMutation({
    mutationFn: () => sessionApi.getGroupInviteCode(sessionId, groupId),
    onSuccess: (code) => {
      setInviteCode(code)
      setResponse({ code })
      toast.success('Invite code retrieved')
    },
    onError: (error: any) => toast.error(error.message || 'Failed to get invite code')
  })

  const revokeInviteMutation = useMutation({
    mutationFn: () => sessionApi.revokeGroupInviteCode(sessionId, groupId),
    onSuccess: (code) => {
      setInviteCode(code)
      setResponse({ code })
      toast.success('Invite code revoked and regenerated')
    },
    onError: (error: any) => toast.error(error.message || 'Failed to revoke invite code')
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

            <div className="flex gap-4">
                <Button 
                    className="flex-1"
                    variant="outline"
                    onClick={() => getInviteMutation.mutate()} 
                    disabled={!groupId || getInviteMutation.isPending}
                >
                {getInviteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link className="mr-2 h-4 w-4" />}
                Get Code
                </Button>

                <Button 
                    className="flex-1"
                    variant="destructive"
                    onClick={() => revokeInviteMutation.mutate()} 
                    disabled={!groupId || revokeInviteMutation.isPending}
                >
                {revokeInviteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Revoke Code
                </Button>
            </div>

            {inviteCode && (
                <div className="mt-4 p-4 border rounded-lg bg-muted/50 text-center">
                    <p className="text-sm font-medium mb-2">Invite Link</p>
                    <code className="bg-background p-2 rounded block mb-2 select-all">https://chat.whatsapp.com/{inviteCode}</code>
                    <p className="text-xs text-muted-foreground">Code: {inviteCode}</p>
                </div>
            )}
            
            <ResponseDisplay data={response} />
         </div>
      </div>

      <div className="space-y-4">
        <ApiExample 
            method="GET" 
            url={`/api/sessions/${sessionId}/groups/{id}/invite-code`}
            description="Gets the invite code for the group."
            responseExample={{
                "code": "F8s0..."
            }}
            responseDescription="Returns the invite code string."
        />
        <ApiExample 
            method="POST" 
            url={`/api/sessions/${sessionId}/groups/{id}/invite-code/revoke`}
            description="Invalidates the current group invite code and generates a new one."
            responseExample={{
                "code": "NewCode..."
            }}
            responseDescription="Returns the new invite code string."
        />
      </div>
    </div>
  )
}
