
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { UserPlus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'
import { ResponseDisplay } from '../../ResponseDisplay'

interface CreateContactTabProps {
  sessionId: string
}

export function CreateContactTab({ sessionId }: CreateContactTabProps) {
  const [contactId, setContactId] = useState('')
  const [response, setResponse] = useState<any>(null)

  const createMutation = useMutation({
    mutationFn: () => sessionApi.createContact(sessionId, contactId),
    onSuccess: (data) => {
      toast.success('Contact synced/created')
      setResponse(data)
    },
    onError: (error: any) => toast.error(error.message || 'Failed to sync contact')
  })

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
         <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Contact ID (Phone Number)</Label>
              <Input 
                placeholder="6281234567890@c.us" 
                value={contactId} 
                onChange={(e) => setContactId(e.target.value)} 
                className="font-mono"
              />
              <p className="text-[11px] text-muted-foreground">This triggers a sync for the contact on the device.</p>
            </div>
            
            <Button 
                onClick={() => createMutation.mutate()} 
                disabled={!contactId || createMutation.isPending}
            >
                {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UserPlus className="mr-2 h-4 w-4"/>}
                Create / Sync Contact
            </Button>
            
            <ResponseDisplay data={response} />
         </div>
      </div>

      <ApiExample 
          method="PUT" 
          url={`/api/sessions/${sessionId}/contacts/{contactId}`}
          description="Create or update (sync) contact."
          parameters={[{ name: "contactId", type: "string", required: true, description: "Contact ID" }]}
          responseExample={{
            "id": { "_serialized": "628123...@c.us" },
            "number": "628123...",
            "name": "John Doe"
          }}
          responseDescription="Returns the contact object."
      />
    </div>
  )
}
