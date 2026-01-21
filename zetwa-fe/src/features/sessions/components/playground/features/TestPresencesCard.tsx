import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Activity, Circle, Loader2, Eye, Signal, Search, Monitor } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../ApiExample'

interface SystemCardProps {
  sessionId: string
}

export function TestPresencesCard({ sessionId }: SystemCardProps) {
  const [activeTab, setActiveTab] = useState('presence')
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
    <div className="h-full flex flex-col space-y-4">
      <CardHeader className="px-0 pt-0 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Monitor className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">System & Presence</CardTitle>
              <CardDescription>Control status and system events</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="presence">Presence Control</TabsTrigger>
            <TabsTrigger value="events">Events & Subscription</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="presence" className="flex-1 flex flex-col space-y-6 mt-0">
           {/* My Presence */}
           <div className="rounded-xl border bg-card p-6 shadow-sm">
             <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2">
                 <div className="p-2 bg-muted rounded-full">
                    <Activity className="h-4 w-4" />
                 </div>
                 <div>
                   <h3 className="font-semibold text-sm">My Presence</h3>
                   <p className="text-xs text-muted-foreground">Set your global online status</p>
                 </div>
               </div>
             </div>
             
             <div className="flex gap-3">
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
                 className="min-w-[80px]"
               >
                 {setPresenceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Set'}
               </Button>
             </div>
             
             <div className="mt-4">
                <ApiExample 
                  method="POST" 
                  url={`/api/sessions/${sessionId}/presence`}
                  body={{ presence }}
                  description="Force set the online/offline status of the session."
                  responseExample={{
                    "success": true,
                    "message": "Presence set"
                  }}
                  responseDescription="Returns confirmation."
                />
             </div>
           </div>

           {/* Check Presence */}
           <div className="rounded-xl border bg-card p-6 shadow-sm">
             <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2">
                 <div className="p-2 bg-muted rounded-full">
                    <Search className="h-4 w-4" />
                 </div>
                 <div>
                   <h3 className="font-semibold text-sm">Check Contact Presence</h3>
                   <p className="text-xs text-muted-foreground">Check online status of a contact</p>
                 </div>
               </div>
             </div>
             
             <div className="flex gap-3">
               <Input 
                 placeholder="Contact ID (e.g. 6281234567890@c.us)" 
                 value={checkPresenceId}
                 onChange={(e) => setCheckPresenceId(e.target.value)}
                 className="flex-1"
               />
               <Button 
                 onClick={() => getPresenceMutation.mutate()}
                 disabled={!checkPresenceId || getPresenceMutation.isPending}
                 variant="secondary"
                 className="min-w-[80px]"
               >
                 {getPresenceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Check'}
               </Button>
             </div>

             {presenceResult && (
               <div className="mt-4 p-4 bg-muted/30 rounded-lg border">
                 <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Result</span>
                    <Badge variant={presenceResult?.id ? 'default' : 'secondary'}>
                       {presenceResult?.id ? 'Found' : 'Unknown'}
                    </Badge>
                 </div>
                 <pre className="text-xs font-mono bg-background p-2 rounded border overflow-x-auto">
                   {JSON.stringify(presenceResult, null, 2)}
                 </pre>
               </div>
             )}

             <div className="mt-4">
                <ApiExample 
                  method="GET" 
                  url={`/api/sessions/${sessionId}/presence/${checkPresenceId || '{contactId}'}`}
                  description="Get the current presence status of a contact."
                  responseExample={{
                    "id": { "_serialized": "628123...@c.us" },
                    "status": "available"
                  }}
                  responseDescription="Returns the presence status object."
                />
             </div>
           </div>
        </TabsContent>

        <TabsContent value="events" className="flex-1 flex flex-col space-y-6 mt-0">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
             <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2">
                 <div className="p-2 bg-muted rounded-full">
                    <Eye className="h-4 w-4" />
                 </div>
                 <div>
                   <h3 className="font-semibold text-sm">Subscribe Presence</h3>
                   <p className="text-xs text-muted-foreground">Listen for realtime updates</p>
                 </div>
               </div>
             </div>
             
             <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900 rounded-lg p-3 mb-4 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                <Signal className="h-4 w-4 mt-0.5 shrink-0" />
                <p>
                  Subscribing to a contact allows you to receive realtime events when they go online, offline, or start typing.
                  These events are sent via Webhooks.
                </p>
             </div>
             
             <div className="flex gap-3">
               <Input 
                 placeholder="Contact ID (e.g. 6281234567890)" 
                 value={subscribeTo}
                 onChange={(e) => setSubscribeTo(e.target.value)}
                 className="flex-1"
               />
               <Button 
                 onClick={() => subscribePresenceMutation.mutate()}
                 disabled={!subscribeTo || subscribePresenceMutation.isPending}
                 className="min-w-[100px]"
               >
                 {subscribePresenceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                    <>
                       <Signal className="h-4 w-4 mr-2" /> Subscribe
                    </>
                 )}
               </Button>
             </div>

             <div className="mt-4">
                <ApiExample 
                  method="POST" 
                  url={`/api/sessions/${sessionId}/presence/subscribe`}
                  body={{ contactId: subscribeTo || "6281234567890" }}
                  description="Subscribe to realtime presence updates for a contact."
                  responseExample={{
                    "success": true,
                    "message": "Subscribed"
                  }}
                  responseDescription="Returns confirmation."
                />
             </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
