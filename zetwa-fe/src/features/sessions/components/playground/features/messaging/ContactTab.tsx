import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Contact, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'
import { ResponseDisplay } from '../../ResponseDisplay'

interface ContactTabProps {
  sessionId: string
}

export function ContactTab({ sessionId }: ContactTabProps) {
  const [contactTo, setContactTo] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactOrg, setContactOrg] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [replyTo, setReplyTo] = useState('')
  const [response, setResponse] = useState<any>(null)

  const sendContactMutation = useMutation({
    mutationFn: () => sessionApi.sendContact(sessionId, {
      to: contactTo,
      contact: {
        name: contactName,
        phone: contactPhone,
        organization: contactOrg,
        email: contactEmail || undefined
      },
      // @ts-ignore
      reply_to: replyTo || undefined
    }),
    onSuccess: (data) => {
      toast.success('Contact sent successfully')
      setResponse(data)
      setContactName('')
      setContactPhone('')
      setContactOrg('')
      setContactEmail('')
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
              <Label>Phone Number</Label>
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
              <div className="grid gap-2">
                <Label>Email (Optional)</Label>
                <Input 
                  placeholder="john@example.com" 
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
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
            
            <ResponseDisplay data={response} />
         </div>
      </div>

      <ApiExample 
        method="POST" 
        url={`/api/sessions/${sessionId}/messages/send-contact`}
        body={{
          to: contactTo || "6281234567890",
          contact: {
            name: contactName || "John Doe",
            phone: contactPhone || "628111222333",
            organization: contactOrg || null,
            email: contactEmail || null
          },
          reply_to: replyTo || null
        }}
        description="Send a contact card (vCard)."
        parameters={[
          { name: "to", type: "string", required: true, description: "Recipient's phone number" },
          { name: "contact.name", type: "string", required: true, description: "Contact's display name" },
          { name: "contact.phone", type: "string", required: true, description: "Contact's phone number" },
          { name: "contact.organization", type: "string | null", required: false, description: "Contact's organization (optional)" },
          { name: "contact.email", type: "string | null", required: false, description: "Contact's email address (optional)" },
          { name: "reply_to", type: "string | null", required: false, description: "ID of the message to reply to (optional, default: null)" }
        ]}
        responseExample={{
          "id": {
            "fromMe": true,
            "remote": "6281234567890@c.us",
            "id": "3EB0...",
            "_serialized": "true_6281234567890@c.us_3EB0..."
          },
          "ack": 0,
          "hasMedia": false,
          "body": "BEGIN:VCARD...",
          "type": "vcard",
          "timestamp": 1705641234,
          "from": "6289876543210@c.us",
          "to": "6281234567890@c.us",
          "deviceType": "android",
          "isForwarded": false,
          "forwardingScore": 0,
          "isStatus": false,
          "isStarred": false,
          "broadcast": false,
          "fromMe": true,
          "hasQuotedMsg": false,
          "location": null,
          "vCards": [
             "BEGIN:VCARD\nVERSION:3.0\nFN:John Doe\nTEL;waid=628111222333:+62 811-1222-333\nEND:VCARD"
          ],
          "mentionedIds": [],
          "isGif": false,
          "links": []
        }}
        responseDescription="Returns the contact message object that was sent."
      />
    </div>
  )
}
