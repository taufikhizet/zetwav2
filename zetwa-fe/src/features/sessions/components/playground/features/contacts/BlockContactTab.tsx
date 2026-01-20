
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Ban, ShieldCheck, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'
import { ResponseDisplay } from '../../ResponseDisplay'

interface BlockContactTabProps {
  sessionId: string
}

export function BlockContactTab({ sessionId }: BlockContactTabProps) {
  const [contactId, setContactId] = useState('')
  const [response, setResponse] = useState<any>(null)

  const blockMutation = useMutation({
    mutationFn: (block: boolean) => sessionApi.blockContact(sessionId, contactId, block),
    onSuccess: (_, variables) => {
      toast.success(variables ? 'Contact blocked' : 'Contact unblocked')
      setResponse({ success: true, message: variables ? 'Contact blocked' : 'Contact unblocked' })
    },
    onError: (error: any) => toast.error(error.message || 'Failed to update block status')
  })

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
         <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Contact ID</Label>
              <Input 
                placeholder="6281234567890@c.us" 
                value={contactId} 
                onChange={(e) => setContactId(e.target.value)} 
                className="font-mono"
              />
            </div>
            
            <div className="flex gap-4">
                <Button 
                    className="flex-1"
                    variant="destructive"
                    onClick={() => blockMutation.mutate(true)} 
                    disabled={!contactId || blockMutation.isPending}
                >
                    {blockMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Ban className="mr-2 h-4 w-4"/>}
                    Block Contact
                </Button>
                <Button 
                    className="flex-1 border-green-200 hover:bg-green-50 text-green-700"
                    variant="outline"
                    onClick={() => blockMutation.mutate(false)} 
                    disabled={!contactId || blockMutation.isPending}
                >
                    {blockMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ShieldCheck className="mr-2 h-4 w-4"/>}
                    Unblock Contact
                </Button>
            </div>
            
            <ResponseDisplay data={response} />
         </div>
      </div>

      <ApiExample 
          method="POST" 
          url={`/api/sessions/${sessionId}/contacts/{contactId}/block`}
          body={{ block: true }}
          description="Block or unblock a contact."
          parameters={[{ name: "contactId", type: "string", required: true, description: "Contact ID" }]}
          responseExample={null}
          responseDescription="Returns 200 OK."
      />
    </div>
  )
}
