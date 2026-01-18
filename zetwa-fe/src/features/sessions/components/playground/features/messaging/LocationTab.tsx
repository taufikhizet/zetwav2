import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { MapPin, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'

interface LocationTabProps {
  sessionId: string
}

export function LocationTab({ sessionId }: LocationTabProps) {
  const [locationTo, setLocationTo] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [locationDesc, setLocationDesc] = useState('')
  const [locationUrl, setLocationUrl] = useState('')
  const [replyTo, setReplyTo] = useState('')

  const sendLocationMutation = useMutation({
    mutationFn: () => sessionApi.sendLocation(sessionId, {
      to: locationTo,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      description: locationDesc,
      title: locationDesc,
      url: locationUrl,
      reply_to: replyTo || undefined
    }),
    onSuccess: () => {
      toast.success('Location sent successfully')
      setReplyTo('')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send location')
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
                value={locationTo}
                onChange={(e) => setLocationTo(e.target.value)}
                className="font-mono"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Latitude</Label>
                <Input 
                  placeholder="-6.200000" 
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  type="number"
                />
              </div>
              <div className="grid gap-2">
                <Label>Longitude</Label>
                <Input 
                  placeholder="106.816666" 
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  type="number"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Description (Optional)</Label>
              <Input 
                placeholder="My Current Location" 
                value={locationDesc}
                onChange={(e) => setLocationDesc(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>URL (Optional)</Label>
              <Input 
                placeholder="https://maps.google.com/..." 
                value={locationUrl}
                onChange={(e) => setLocationUrl(e.target.value)}
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
              onClick={() => sendLocationMutation.mutate()}
              disabled={!locationTo || !latitude || !longitude || sendLocationMutation.isPending}
            >
              {sendLocationMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <MapPin className="mr-2 h-4 w-4" />
              )}
              Send Location
            </Button>
         </div>
      </div>

      <ApiExample 
        method="POST" 
        url={`/api/sessions/${sessionId}/messages/send-location`}
        body={{
          to: locationTo || "6281234567890",
          latitude: parseFloat(latitude) || -6.2,
          longitude: parseFloat(longitude) || 106.8,
          description: locationDesc || null,
          url: locationUrl || null,
          reply_to: replyTo || null
        }}
        description="Send a location."
        parameters={[
          { name: "to", type: "string", required: true, description: "Recipient's phone number" },
          { name: "latitude", type: "number", required: true, description: "Latitude coordinate" },
          { name: "longitude", type: "number", required: true, description: "Longitude coordinate" },
          { name: "description", type: "string | null", required: false, description: "Description or title of the location (optional, default: null)" },
          { name: "url", type: "string | null", required: false, description: "URL associated with the location (optional, default: null)" },
          { name: "reply_to", type: "string | null", required: false, description: "ID of the message to reply to (optional, default: null)" }
        ]}
      />
    </div>
  )
}
