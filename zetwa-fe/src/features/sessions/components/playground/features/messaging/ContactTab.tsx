import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Contact, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sessionApi } from '@/features/sessions/api/session.api'

interface ContactTabProps {
  sessionId: string
}

export function ContactTab({ sessionId }: ContactTabProps) {
  const [contactTo, setContactTo] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactOrg, setContactOrg] = useState('')
  const [replyTo, setReplyTo] = useState('')

  const sendContactMutation = useMutation({
    mutationFn: () => sessionApi.sendContact(sessionId, {
      to: contactTo,
      contact: {
        name: contactName,
        phone: contactPhone,
        organization: contactOrg
      },
      reply_to: replyTo || undefined
    }),
    onSuccess: () => {
      toast.success('Contact sent successfully')
      setContactName('')
      setContactPhone('')
      setContactOrg('')
      setReplyTo('')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send contact')
    }
  })

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
         <div className="grid gap-6">
            <div className="grid gap-2">
              <Label>Recipient Phone Number</Label>
              <Input 
                placeholder="e.g. 6281234567890" 
                value={contactTo}
                onChange={(e) => setContactTo(e.target.value)}
                className="font-mono"
              />
            </div>
            
            <div className="p-4 border rounded-lg space-y-4 bg-muted/20">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Contact className="h-4 w-4" /> Contact Card Details
              </h4>
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input 
                  placeholder="John Doe" 
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Phone Number</Label>
                <Input 
                  placeholder="628111222333" 
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Organization (Optional)</Label>
                <Input 
                  placeholder="Zetwa Inc." 
                  value={contactOrg}
                  onChange={(e) => setContactOrg(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Reply To Message ID (Optional)</Label>
              <Input 
                placeholder="e.g. false_1234567890@c.us_3EB0..." 
                value={replyTo}
                onChange={(e) => setReplyTo(e.target.value)}
                className="font-mono"
              />
            </div>

            <Button 
              className="w-full" 
              onClick={() => sendContactMutation.mutate()}
              disabled={!contactTo || !contactName || !contactPhone || sendContactMutation.isPending}
            >
              {sendContactMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Contact className="mr-2 h-4 w-4" />
              )}
              Send Contact
            </Button>
         </div>
      </div>
    </div>
  )
}
