
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'
import { ResponseDisplay } from '../../ResponseDisplay'

interface ContactAboutTabProps {
  sessionId: string
}

export function ContactAboutTab({ sessionId }: ContactAboutTabProps) {
  const [contactId, setContactId] = useState('')
  const [searchTrigger, setSearchTrigger] = useState('')

  const { data: about, isLoading } = useQuery({
    queryKey: ['contact-about', sessionId, searchTrigger],
    queryFn: () => sessionApi.getContactAbout(sessionId, searchTrigger),
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
            
            <ResponseDisplay data={{ about }} />
         </div>
      </div>

      <ApiExample 
          method="GET" 
          url={`/api/sessions/${sessionId}/contacts/about`}
          description="Get contact's 'About' status."
          parameters={[{ name: "contactId", type: "string", required: true, description: "Contact ID" }]}
          responseExample={{
            "about": "Hey there! I am using WhatsApp."
          }}
          responseDescription="Returns the status text."
      />
    </div>
  )
}
