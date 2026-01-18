import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Image, Loader2, Paperclip } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'

interface MediaTabProps {
  sessionId: string
}

export function MediaTab({ sessionId }: MediaTabProps) {
  const [mediaTo, setMediaTo] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [mediaCaption, setMediaCaption] = useState('')
  const [replyTo, setReplyTo] = useState('')

  const sendMediaMutation = useMutation({
    mutationFn: () => sessionApi.sendMedia(sessionId, { 
      to: mediaTo, 
      mediaUrl, 
      caption: mediaCaption,
      reply_to: replyTo || undefined
    }),
    onSuccess: () => {
      toast.success('Media sent successfully')
      setMediaUrl('')
      setMediaCaption('')
      setReplyTo('')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send media')
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
                value={mediaTo}
                onChange={(e) => setMediaTo(e.target.value)}
                className="font-mono"
              />
            </div>

            <div className="grid gap-2">
              <Label>Media URL</Label>
              <div className="relative">
                <Paperclip className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  className="pl-9"
                  placeholder="https://example.com/image.jpg" 
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">Direct link to image, video, or document.</p>
            </div>

            <div className="grid gap-2">
              <Label>Caption (Optional)</Label>
              <Input 
                placeholder="Check this out!" 
                value={mediaCaption}
                onChange={(e) => setMediaCaption(e.target.value)}
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

            <Button 
              className="w-full" 
              onClick={() => sendMediaMutation.mutate()}
              disabled={!mediaTo || !mediaUrl || sendMediaMutation.isPending}
            >
              {sendMediaMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Image className="mr-2 h-4 w-4" />
              )}
              Send Media
            </Button>
         </div>
      </div>

      <ApiExample 
        method="POST" 
        url={`/api/sessions/${sessionId}/messages/send-media`}
        body={{
          to: mediaTo || "6281234567890",
          mediaUrl: mediaUrl || "https://example.com/image.jpg",
          caption: mediaCaption || undefined,
          reply_to: replyTo || null
        }}
        description="Send media (image/video/document) from a URL."
        parameters={[
          { name: "to", type: "string", required: true, description: "Recipient's phone number" },
          { name: "mediaUrl", type: "string", required: true, description: "Direct URL to the media file" },
          { name: "caption", type: "string", required: false, description: "Caption for the media" },
          { name: "reply_to", type: "string | null", required: false, description: "ID of the message to reply to (optional, default: null)" },
          { name: "mimetype", type: "string", required: false, description: "MIME type of the media (optional, auto-detected if possible)" },
          { name: "filename", type: "string", required: false, description: "Filename for the media (optional)" }
        ]}
      />
    </div>
  )
}
