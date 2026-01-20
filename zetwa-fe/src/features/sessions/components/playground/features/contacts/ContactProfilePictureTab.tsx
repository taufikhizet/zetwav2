
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Search, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'
import { ResponseDisplay } from '../../ResponseDisplay'

interface ContactProfilePictureTabProps {
  sessionId: string
}

export function ContactProfilePictureTab({ sessionId }: ContactProfilePictureTabProps) {
  const [contactId, setContactId] = useState('')
  const [searchTrigger, setSearchTrigger] = useState('')

  const { data: profilePicUrl, isLoading } = useQuery({
    queryKey: ['contact-pp', sessionId, searchTrigger],
    queryFn: () => sessionApi.getContactProfilePicture(sessionId, searchTrigger),
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
            
            {profilePicUrl && (
                <div className="flex justify-center p-6 border rounded-lg bg-muted/30">
                    <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                        <AvatarImage src={profilePicUrl} />
                        <AvatarFallback className="text-4xl bg-primary/10 text-primary"><User /></AvatarFallback>
                    </Avatar>
                </div>
            )}
            
            <ResponseDisplay data={{ profilePicUrl }} />
         </div>
      </div>

      <ApiExample 
          method="GET" 
          url={`/api/sessions/${sessionId}/contacts/profile-picture`}
          description="Get contact's profile picture URL."
          parameters={[{ name: "contactId", type: "string", required: true, description: "Contact ID" }]}
          responseExample={{
            "profilePicUrl": "https://pps.whatsapp.net/..."
          }}
          responseDescription="Returns the image URL."
      />
    </div>
  )
}
