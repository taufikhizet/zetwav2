
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'
import { ResponseDisplay } from '../../ResponseDisplay'

interface ContactInfoTabProps {
  sessionId: string
}

export function ContactInfoTab({ sessionId }: ContactInfoTabProps) {
  const [contactId, setContactId] = useState('')
  const [searchTrigger, setSearchTrigger] = useState('')

  const { data: contact, isLoading, error } = useQuery({
    queryKey: ['contact', sessionId, searchTrigger],
    queryFn: () => sessionApi.getContact(sessionId, searchTrigger),
    enabled: !!searchTrigger,
    retry: false
  })

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
         <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Contact ID</Label>
              <div className="flex gap-2">
                  <Input 
                    placeholder="6281234567890@c.us" 
                    value={contactId} 
                    onChange={(e) => setContactId(e.target.value)} 
                    className="font-mono"
                  />
                  <Button onClick={() => setSearchTrigger(contactId)} disabled={!contactId || isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
              </div>
            </div>
            
            <ResponseDisplay data={contact || error} />
         </div>
      </div>

      <ApiExample 
          method="GET" 
          url={`/api/sessions/${sessionId}/contacts`}
          description="Get basic info for a specific contact."
          parameters={[{ name: "contactId", type: "string", required: true, description: "Contact ID (e.g. 628...@c.us)" }]}
          responseExample={{
            "id": { "_serialized": "628123...@c.us" },
            "number": "628123...",
            "name": "John Doe"
          }}
          responseDescription="Returns contact object."
      />
    </div>
  )
}
