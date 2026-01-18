import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'

interface TextTabProps {
  sessionId: string
}

export function TextTab({ sessionId }: TextTabProps) {
  const [textTo, setTextTo] = useState('')
  const [textBody, setTextBody] = useState('')
  const [linkPreview, setLinkPreview] = useState(false)
  const [replyTo, setReplyTo] = useState('')

  const sendTextMutation = useMutation({
    mutationFn: () => sessionApi.sendMessage(sessionId, { 
      to: textTo, 
      message: textBody, 
      linkPreview,
      reply_to: replyTo || undefined
    }),
    onSuccess: () => {
      toast.success('Message sent successfully')
      setTextBody('')
      setReplyTo('')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send message')
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
                value={textTo}
                onChange={(e) => setTextTo(e.target.value)}
                className="font-mono"
              />
              <p className="text-[11px] text-muted-foreground">Include country code without + or spaces.</p>
            </div>
            
            <div className="grid gap-2">
              <Label>Message</Label>
              <Textarea 
                placeholder="Type your message..." 
                className="min-h-[120px] resize-y"
                value={textBody}
                onChange={(e) => setTextBody(e.target.value)}
              />
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

            <div className="flex items-center space-x-2">
              <Switch 
                id="link-preview" 
                checked={linkPreview}
                onCheckedChange={setLinkPreview}
              />
              <Label htmlFor="link-preview">Link Preview</Label>
            </div>

            <Button 
              className="w-full" 
              onClick={() => sendTextMutation.mutate()}
              disabled={!textTo || !textBody || sendTextMutation.isPending}
            >
              {sendTextMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send Text Message
            </Button>
         </div>
      </div>

      <ApiExample 
        method="POST" 
        url={`/api/sessions/${sessionId}/messages/send`}
        body={{
          to: textTo || "6281234567890",
          message: textBody || "Hello from API!",
          linkPreview: linkPreview,
          reply_to: replyTo || null,
          mentions: []
        }}
        description="Send a text message."
        parameters={[
          { name: "to", type: "string", required: true, description: "Recipient's phone number (with country code, no + or spaces)" },
          { name: "message", type: "string", required: true, description: "The text content of the message" },
          { name: "linkPreview", type: "boolean", required: false, description: "Enable/disable link preview generation (default: false)" },
          { name: "reply_to", type: "string | null", required: false, description: "ID of the message to reply to (optional, default: null)" },
          { name: "mentions", type: "string[]", required: false, description: "Array of phone numbers to mention in the message" }
        ]}
      />
    </div>
  )
}
