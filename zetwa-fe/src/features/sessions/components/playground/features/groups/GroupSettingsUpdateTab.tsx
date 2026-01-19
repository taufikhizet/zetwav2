import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2 } from 'lucide-react'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'
import { ResponseDisplay } from '../../ResponseDisplay'

interface GroupSettingsUpdateTabProps {
  sessionId: string
}

export function GroupSettingsUpdateTab({ sessionId }: GroupSettingsUpdateTabProps) {
  const [groupId, setGroupId] = useState('')
  const [infoAdminsOnly, setInfoAdminsOnly] = useState(false)
  const [messagesAdminsOnly, setMessagesAdminsOnly] = useState(false)
  const [response, setResponse] = useState<any>(null)

  const updateInfoSettingsMutation = useMutation({
    mutationFn: () => sessionApi.setInfoAdminsOnly(sessionId, groupId, infoAdminsOnly),
    onSuccess: (data) => {
      toast.success('Info settings updated')
      setResponse(data)
    },
    onError: (error: any) => toast.error(error.message || 'Failed to update info settings')
  })

  const updateMessageSettingsMutation = useMutation({
    mutationFn: () => sessionApi.setMessagesAdminsOnly(sessionId, groupId, messagesAdminsOnly),
    onSuccess: (data) => {
      toast.success('Message settings updated')
      setResponse(data)
    },
    onError: (error: any) => toast.error(error.message || 'Failed to update message settings')
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

            <div className="grid gap-4 border p-4 rounded-lg">
                <h4 className="font-medium text-sm">Security Settings</h4>
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label>Info Admin Only</Label>
                        <p className="text-xs text-muted-foreground">Only admins can edit group info</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Switch checked={infoAdminsOnly} onCheckedChange={setInfoAdminsOnly} />
                        <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => updateInfoSettingsMutation.mutate()} 
                            disabled={!groupId || updateInfoSettingsMutation.isPending}
                        >
                            {updateInfoSettingsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Set"}
                        </Button>
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label>Messages Admin Only</Label>
                        <p className="text-xs text-muted-foreground">Only admins can send messages</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Switch checked={messagesAdminsOnly} onCheckedChange={setMessagesAdminsOnly} />
                        <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => updateMessageSettingsMutation.mutate()} 
                            disabled={!groupId || updateMessageSettingsMutation.isPending}
                        >
                            {updateMessageSettingsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Set"}
                        </Button>
                    </div>
                </div>
            </div>
            
            <ResponseDisplay data={response} />
         </div>
      </div>

      <div className="space-y-4">
        <ApiExample 
            method="PUT" 
            url={`/api/sessions/${sessionId}/groups/{id}/settings/security/info-admin-only`}
            body={{ adminsOnly: true }}
            description="Updates the group 'info admin only' settings."
            parameters={[{ name: "id", type: "string", required: true, description: "Group ID" }]}
            responseExample={{
              "success": true,
              "message": "Settings updated"
            }}
            responseDescription="Returns confirmation."
        />
        <ApiExample 
            method="PUT" 
            url={`/api/sessions/${sessionId}/groups/{id}/settings/security/messages-admin-only`}
            body={{ adminsOnly: true }}
            description="Update settings - who can send messages."
            parameters={[{ name: "id", type: "string", required: true, description: "Group ID" }]}
            responseExample={{
              "success": true,
              "message": "Settings updated"
            }}
            responseDescription="Returns confirmation."
        />
      </div>
    </div>
  )
}
