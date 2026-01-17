import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { 
  Image as ImageIcon, 
  Type, 
  Trash2, 
  Loader2, 
  RefreshCw, 
  Eye, 
  PlayCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
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
    <div className="h-full flex flex-col space-y-4">
      <CardHeader className="px-0 pt-0 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <PlayCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Status & Stories</CardTitle>
              <CardDescription>View and share updates with contacts</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="list">My Status</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="create-text">Post Text</TabsTrigger>
            <TabsTrigger value="create-media">Post Media</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="list" className="flex-1 flex flex-col min-h-0 space-y-4 mt-0">
          <div className="flex justify-end">
             <Button variant="outline" size="sm" onClick={() => refetchMyStatus()} disabled={isLoadingMyStatus} className="h-8">
                <RefreshCw className={`h-3.5 w-3.5 mr-2 ${isLoadingMyStatus ? 'animate-spin' : ''}`} />
                Refresh
             </Button>
          </div>

          <div className="rounded-xl border bg-card flex-1 min-h-0 overflow-hidden flex flex-col shadow-sm">
             <ScrollArea className="flex-1">
                {isLoadingMyStatus ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
                    <p>Loading statuses...</p>
                  </div>
                ) : myStatuses && myStatuses.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
                    {myStatuses.map((status: any) => (
                      <div key={status.id} className="border rounded-xl overflow-hidden relative group shadow-sm hover:shadow-md transition-shadow">
                         {status.type === 'text' ? (
                           <div 
                             className="aspect-square flex items-center justify-center p-6 text-center text-white"
                             style={{ backgroundColor: status.backgroundColor || '#000000' }}
                           >
                             <p className="line-clamp-4 font-medium">{status.body}</p>
                           </div>
                         ) : (
                           <div className="aspect-square bg-muted flex flex-col items-center justify-center gap-2">
                             <ImageIcon className="h-8 w-8 text-muted-foreground opacity-50" />
                             <span className="text-xs text-muted-foreground font-medium">Media Status</span>
                           </div>
                         )}
                         
                         <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent text-white flex justify-between items-end">
                           <span className="text-xs font-medium opacity-90">{formatTime(status.timestamp)}</span>
                           <Button 
                             variant="destructive" 
                             size="icon" 
                             className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                             onClick={() => deleteStatusMutation.mutate(status.id)}
                           >
                             <Trash2 className="h-3.5 w-3.5" />
                           </Button>
                         </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                    <div className="bg-muted p-4 rounded-full mb-3">
                      <PlayCircle className="h-8 w-8 opacity-20" />
                    </div>
                    <p className="font-medium">No active statuses</p>
                    <p className="text-xs mt-1">Post a status to share updates</p>
                  </div>
                )}
             </ScrollArea>
          </div>
          
          <ApiExample 
            method="GET" 
            url={`/api/sessions/${sessionId}/status`}
            description="Get your current active statuses."
          />
        </TabsContent>

        <TabsContent value="contacts" className="flex-1 flex flex-col min-h-0 space-y-4 mt-0">
           <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => refetchContactStatus()} disabled={isLoadingContactStatus} className="h-8">
              <RefreshCw className={`h-3.5 w-3.5 mr-2 ${isLoadingContactStatus ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <div className="rounded-xl border bg-card flex-1 min-h-0 overflow-hidden flex flex-col shadow-sm">
             <ScrollArea className="flex-1">
                {isLoadingContactStatus ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
                    <p>Loading contact statuses...</p>
                  </div>
                ) : contactStatuses && contactStatuses.length > 0 ? (
                  <div className="divide-y">
                    {contactStatuses.map((contact: any) => (
                      <div key={contact.id._serialized} className="p-3 hover:bg-muted/50 transition-all flex items-center justify-between group cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className={`p-0.5 rounded-full border-2 ${contact.unreadCount > 0 ? 'border-primary' : 'border-muted'}`}>
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-secondary text-secondary-foreground">{contact.pushname?.[0] || '?'}</AvatarFallback>
                            </Avatar>
                          </div>
                          <div>
                            <div className="font-medium text-sm">{contact.pushname || contact.name || contact.number}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                               <span className="font-medium text-primary">{contact.msgs?.length || 0}</span> updates
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                           <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                    <div className="bg-muted p-4 rounded-full mb-3">
                      <PlayCircle className="h-8 w-8 opacity-20" />
                    </div>
                    <p className="font-medium">No contact statuses found</p>
                  </div>
                )}
             </ScrollArea>
          </div>

          <ApiExample 
            method="GET" 
            url={`/api/sessions/${sessionId}/status/contacts`}
            description="Get status updates from your contacts."
          />
        </TabsContent>

        <TabsContent value="create-text" className="space-y-6 mt-0">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
             <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label>Status Text</Label>
                  <Textarea 
                    placeholder="Type your status..." 
                    className="min-h-[120px] text-lg resize-none"
                    value={statusText}
                    onChange={(e) => setStatusText(e.target.value)}
                    style={{ backgroundColor: bgColor, color: '#ffffff' }}
                  />
                </div>
    
                <div className="grid gap-2">
                  <Label>Background Color</Label>
                  <div className="flex gap-2 items-center">
                    <Input 
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input 
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      placeholder="#000000"
                      className="font-mono uppercase"
                    />
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
             </div>
          </div>

          <ApiExample 
            method="POST" 
            url={`/api/sessions/${sessionId}/status/text`}
            body={{ text: statusText || "Hello World", backgroundColor: bgColor }}
          />
        </TabsContent>

        <TabsContent value="create-media" className="space-y-6 mt-0">
           <div className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label>Media URL</Label>
                  <div className="flex gap-2">
                     <Input 
                       placeholder="https://example.com/image.jpg" 
                       value={mediaUrl}
                       onChange={(e) => setMediaUrl(e.target.value)}
                     />
                  </div>
                </div>
    
                <div className="grid gap-2">
                  <Label>Caption (Optional)</Label>
                  <Input 
                    placeholder="Add a caption..." 
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                  />
                </div>
                
                {mediaUrl && (
                   <div className="rounded-lg border bg-muted/20 overflow-hidden aspect-video flex items-center justify-center">
                      <img src={mediaUrl} alt="Preview" className="max-h-full max-w-full object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                   </div>
                )}
    
                <Button 
                  className="w-full" 
                  onClick={() => postMediaStatusMutation.mutate()}
                  disabled={!mediaUrl || postMediaStatusMutation.isPending}
                >
                  {postMediaStatusMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ImageIcon className="h-4 w-4 mr-2" />}
                  Post Media Status
                </Button>
              </div>
           </div>

          <ApiExample 
            method="POST" 
            url={`/api/sessions/${sessionId}/status/media`}
            body={{ mediaUrl: mediaUrl || "https://example.com/image.jpg", caption: caption || "Cool pic" }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
