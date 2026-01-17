import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Activity, Circle, Loader2, Eye, Signal, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../ApiExample'

interface SystemCardProps {
  sessionId: string
}

export function SystemCard({ sessionId }: SystemCardProps) {
  const [presence, setPresence] = useState('available')
  const [subscribeTo, setSubscribeTo] = useState('')
  const [checkPresenceId, setCheckPresenceId] = useState('')
  const [presenceResult, setPresenceResult] = useState<any>(null)

  const setPresenceMutation = useMutation({
    mutationFn: () => sessionApi.setPresence(sessionId, { presence }),
    onSuccess: () => {
      toast.success(`Presence set to ${presence}`)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to set presence')
    }
  })

  const subscribePresenceMutation = useMutation({
    mutationFn: () => sessionApi.subscribePresence(sessionId, subscribeTo),
    onSuccess: () => {
      toast.success(`Subscribed to presence for ${subscribeTo}`)
      setSubscribeTo('')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to subscribe presence')
    }
  })

  const getPresenceMutation = useMutation({
    mutationFn: () => sessionApi.getPresence(sessionId, checkPresenceId),
    onSuccess: (data) => {
      setPresenceResult(data)
      toast.success('Presence checked successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to check presence')
    }
  })

  return (
    <div className="h-full">
      <CardHeader>
        <CardTitle>System & Presence</CardTitle>
        <CardDescription>Control your online status and system events.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Presence Control */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base">Set My Presence</Label>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          
          <div className="flex gap-2">
            <Select value={presence} onValueChange={setPresence}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">
                  <div className="flex items-center gap-2">
                    <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                    <span>Available (Online)</span>
                  </div>
                </SelectItem>
                <SelectItem value="unavailable">
                  <div className="flex items-center gap-2">
                    <Circle className="h-2 w-2 fill-gray-400 text-gray-400" />
                    <span>Unavailable (Offline)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              onClick={() => setPresenceMutation.mutate()}
              disabled={setPresenceMutation.isPending}
            >
              {setPresenceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Set'}
            </Button>
          </div>

          <ApiExample 
            method="POST" 
            url={`/api/sessions/${sessionId}/presence`}
            body={{ presence }}
            description="Force set the online/offline status of the session."
          />
        </div>

        <Separator />

        {/* Check Presence */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base">Check Presence</Label>
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Check the current online/offline status of a contact.
          </p>
          
          <div className="flex gap-2">
            <Input 
              placeholder="Contact ID (e.g. 6281234567890@c.us)" 
              value={checkPresenceId}
              onChange={(e) => setCheckPresenceId(e.target.value)}
            />
            <Button 
              onClick={() => getPresenceMutation.mutate()}
              disabled={!checkPresenceId || getPresenceMutation.isPending}
              variant="secondary"
            >
              {getPresenceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Check'}
            </Button>
          </div>

          {presenceResult && (
            <div className="p-3 bg-muted rounded-md text-sm font-mono whitespace-pre-wrap">
              {JSON.stringify(presenceResult, null, 2)}
            </div>
          )}

          <ApiExample 
            method="GET" 
            url={`/api/sessions/${sessionId}/presence/${checkPresenceId || '{contactId}'}`}
            description="Get the current presence status of a contact."
          />
        </div>

        <Separator />

        {/* Subscribe Presence */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base">Subscribe Presence</Label>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Listen for online/offline/typing events from a specific contact.
          </p>
          
          <div className="flex gap-2">
            <Input 
              placeholder="Contact ID (e.g. 6281234567890)" 
              value={subscribeTo}
              onChange={(e) => setSubscribeTo(e.target.value)}
            />
            <Button 
              onClick={() => subscribePresenceMutation.mutate()}
              disabled={!subscribeTo || subscribePresenceMutation.isPending}
              variant="secondary"
            >
              {subscribePresenceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Signal className="h-4 w-4" />}
            </Button>
          </div>

          <ApiExample 
            method="POST" 
            url={`/api/sessions/${sessionId}/presence/subscribe`}
            body={{ contactId: subscribeTo || "6281234567890" }}
            description="Subscribe to realtime presence updates for a contact."
          />
        </div>

      </CardContent>
    </div>
  )
}
