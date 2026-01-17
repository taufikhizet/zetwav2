import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Image, Type, Trash2, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../ApiExample'

interface StatusCardProps {
  sessionId: string
}

export function StatusCard({ sessionId }: StatusCardProps) {
  const [activeTab, setActiveTab] = useState('list')
  
  // Status Creation State
  const [statusText, setStatusText] = useState('')
  const [bgColor, setBgColor] = useState('#000000')
  const [mediaUrl, setMediaUrl] = useState('')
  const [caption, setCaption] = useState('')

  // Get My Status Query
  const { data: myStatuses, isLoading: isLoadingMyStatus, refetch: refetchMyStatus } = useQuery({
    queryKey: ['status', 'me', sessionId],
    queryFn: () => sessionApi.getMyStatuses(sessionId),
    enabled: activeTab === 'list',
  })

  // Get Contact Status Query
  const { data: contactStatuses, isLoading: isLoadingContactStatus, refetch: refetchContactStatus } = useQuery({
    queryKey: ['status', 'contacts', sessionId],
    queryFn: () => sessionApi.getContactStatuses(sessionId),
    enabled: activeTab === 'contacts',
  })

  // Post Text Status Mutation
  const postTextStatusMutation = useMutation({
    mutationFn: () => sessionApi.postTextStatus(sessionId, { text: statusText, backgroundColor: bgColor }),
    onSuccess: () => {
      toast.success('Text status posted')
      setStatusText('')
      if (activeTab === 'list') refetchMyStatus()
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to post status')
    }
  })

  // Post Media Status Mutation
  const postMediaStatusMutation = useMutation({
    mutationFn: () => sessionApi.postMediaStatus(sessionId, { mediaUrl, mimetype: 'image/jpeg', caption }), // Simplified mimetype assumption
    onSuccess: () => {
      toast.success('Media status posted')
      setMediaUrl('')
      setCaption('')
      if (activeTab === 'list') refetchMyStatus()
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to post status')
    }
  })

  // Delete Status Mutation
  const deleteStatusMutation = useMutation({
    mutationFn: (statusId: string) => sessionApi.deleteStatus(sessionId, statusId),
    onSuccess: () => {
      toast.success('Status deleted')
      refetchMyStatus()
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete status')
    }
  })

  const formatTime = (timestamp: string | number) => {
    try {
      return format(new Date(timestamp), 'MMM d, HH:mm')
    } catch (e) {
      return ''
    }
  }

  return (
    <div className="h-full">
      <CardHeader>
        <CardTitle>Status / Stories</CardTitle>
        <CardDescription>View and post WhatsApp Status updates.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="list">My Status</TabsTrigger>
            <TabsTrigger value="contacts">Contact Status</TabsTrigger>
            <TabsTrigger value="create-text">Post Text</TabsTrigger>
            <TabsTrigger value="create-media">Post Media</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => refetchMyStatus()} disabled={isLoadingMyStatus}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingMyStatus ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            <div className="rounded-md border h-[400px] overflow-hidden">
              <div className="h-full overflow-y-auto">
                {isLoadingMyStatus ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mb-2" />
                    <p>Loading statuses...</p>
                  </div>
                ) : myStatuses && myStatuses.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 p-4">
                    {myStatuses.map((status: any) => (
                      <div key={status.id} className="border rounded-lg overflow-hidden relative group">
                         {status.type === 'text' ? (
                           <div 
                             className="h-32 flex items-center justify-center p-4 text-center text-white"
                             style={{ backgroundColor: status.backgroundColor || '#000000' }}
                           >
                             <p className="line-clamp-3">{status.body}</p>
                           </div>
                         ) : (
                           <div className="h-32 bg-muted flex items-center justify-center">
                             {/* Placeholder for media, as we might not have direct URL for own status easily without downloading */}
                             <Image className="h-8 w-8 text-muted-foreground" />
                             <span className="ml-2 text-xs text-muted-foreground">Media Status</span>
                           </div>
                         )}
                         <div className="p-2 bg-background/90 text-xs flex justify-between items-center">
                           <span>{formatTime(status.timestamp)}</span>
                           <Button 
                             variant="destructive" 
                             size="icon" 
                             className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                             onClick={() => deleteStatusMutation.mutate(status.id)}
                           >
                             <Trash2 className="h-3 w-3" />
                           </Button>
                         </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <p>No active statuses</p>
                  </div>
                )}
              </div>
            </div>
            
            <ApiExample 
              method="GET" 
              url={`/api/sessions/${sessionId}/status`}
              description="Get your current active statuses."
            />
          </TabsContent>

          <TabsContent value="contacts" className="space-y-4">
             <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => refetchContactStatus()} disabled={isLoadingContactStatus}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingContactStatus ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            <div className="rounded-md border h-[400px] overflow-hidden">
              <div className="h-full overflow-y-auto">
                {isLoadingContactStatus ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mb-2" />
                    <p>Loading contact statuses...</p>
                  </div>
                ) : contactStatuses && contactStatuses.length > 0 ? (
                  <div className="divide-y">
                    {contactStatuses.map((contact: any) => (
                      <div key={contact.id._serialized} className="p-3 hover:bg-muted/50 transition-colors flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-0.5 rounded-full border-2 ${contact.unreadCount > 0 ? 'border-green-500' : 'border-muted'}`}>
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>{contact.pushname?.[0] || '?'}</AvatarFallback>
                            </Avatar>
                          </div>
                          <div>
                            <div className="font-medium">{contact.pushname || contact.name || contact.number}</div>
                            <div className="text-xs text-muted-foreground">{contact.msgs?.length || 0} updates</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <p>No contact statuses found</p>
                  </div>
                )}
              </div>
            </div>

            <ApiExample 
              method="GET" 
              url={`/api/sessions/${sessionId}/status/contacts`}
              description="Get status updates from your contacts."
            />
          </TabsContent>

          <TabsContent value="create-text" className="space-y-4">
            <div className="grid gap-2">
              <Label>Status Text</Label>
              <Textarea 
                placeholder="Type your status..." 
                className="min-h-[100px]"
                value={statusText}
                onChange={(e) => setStatusText(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>Background Color (Hex)</Label>
              <div className="flex gap-2">
                <Input 
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  placeholder="#000000"
                />
                <div className="w-10 h-10 rounded border" style={{ backgroundColor: bgColor }} />
              </div>
            </div>

            <Button 
              className="w-full" 
              onClick={() => postTextStatusMutation.mutate()}
              disabled={!statusText || postTextStatusMutation.isPending}
            >
              {postTextStatusMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Type className="h-4 w-4 mr-2" />}
              Post Text Status
            </Button>

            <ApiExample 
              method="POST" 
              url={`/api/sessions/${sessionId}/status/text`}
              body={{ text: statusText || "Hello World", backgroundColor: bgColor }}
            />
          </TabsContent>

          <TabsContent value="create-media" className="space-y-4">
             <div className="grid gap-2">
              <Label>Media URL</Label>
              <Input 
                placeholder="https://example.com/image.jpg" 
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>Caption (Optional)</Label>
              <Input 
                placeholder="Caption..." 
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </div>

            <Button 
              className="w-full" 
              onClick={() => postMediaStatusMutation.mutate()}
              disabled={!mediaUrl || postMediaStatusMutation.isPending}
            >
              {postMediaStatusMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Image className="h-4 w-4 mr-2" />}
              Post Media Status
            </Button>

            <ApiExample 
              method="POST" 
              url={`/api/sessions/${sessionId}/status/media`}
              body={{ mediaUrl: mediaUrl || "https://example.com/image.jpg", caption: caption || "Cool pic" }}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </div>
  )
}
