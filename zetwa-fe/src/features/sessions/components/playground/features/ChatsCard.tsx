import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { 
  MessageCircle, 
  MessageSquare, 
  Loader2, 
  RefreshCw, 
  Archive, 
  Pin, 
  CheckCheck,
  MoreVertical,
  VolumeX,
  Volume2,
  Trash2,
  PinOff,
  CheckCircle,
  Circle,
  Eraser,
  Search,
  Users
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../ApiExample'

interface ChatsCardProps {
  sessionId: string
}

export function ChatsCard({ sessionId }: ChatsCardProps) {
  const [activeTab, setActiveTab] = useState('chats')
  const [searchQuery, setSearchQuery] = useState('')

  // Get Chats Query
  const { data: chats, isLoading: isLoadingChats, refetch: refetchChats } = useQuery({
    queryKey: ['chats', sessionId],
    queryFn: () => sessionApi.getChats(sessionId),
    enabled: activeTab === 'chats',
  })

  // Get Messages Query
  const { data: messagesData, isLoading: isLoadingMessages, refetch: refetchMessages } = useQuery({
    queryKey: ['messages', sessionId],
    queryFn: () => sessionApi.getMessages(sessionId, { limit: 50 }),
    enabled: activeTab === 'messages',
  })

  // Mutations
  const archiveMutation = useMutation({
    mutationFn: ({ chatId, archive }: { chatId: string; archive: boolean }) =>
      sessionApi.archiveChat(sessionId, chatId, archive),
    onSuccess: (_, variables) => {
      toast.success(variables.archive ? 'Chat archived' : 'Chat unarchived')
      refetchChats()
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update archive status')
    }
  })

  const pinMutation = useMutation({
    mutationFn: ({ chatId, pin }: { chatId: string; pin: boolean }) =>
      sessionApi.pinChat(sessionId, chatId, pin),
    onSuccess: (_, variables) => {
      toast.success(variables.pin ? 'Chat pinned' : 'Chat unpinned')
      refetchChats()
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update pin status')
    }
  })

  const muteMutation = useMutation({
    mutationFn: ({ chatId, duration }: { chatId: string; duration?: string }) =>
      sessionApi.muteChat(sessionId, chatId, duration),
    onSuccess: () => {
      toast.success('Chat muted')
      refetchChats()
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to mute chat')
    }
  })

  const unmuteMutation = useMutation({
    mutationFn: ({ chatId }: { chatId: string }) =>
      sessionApi.unmuteChat(sessionId, chatId),
    onSuccess: () => {
      toast.success('Chat unmuted')
      refetchChats()
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to unmute chat')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: ({ chatId }: { chatId: string }) =>
      sessionApi.deleteChat(sessionId, chatId),
    onSuccess: () => {
      toast.success('Chat deleted')
      refetchChats()
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete chat')
    }
  })

  const markReadMutation = useMutation({
    mutationFn: ({ chatId, read }: { chatId: string; read: boolean }) =>
      sessionApi.markChatRead(sessionId, chatId, read),
    onSuccess: (_, variables) => {
      toast.success(variables.read ? 'Marked as read' : 'Marked as unread')
      refetchChats()
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update read status')
    }
  })

  const clearChatMutation = useMutation({
    mutationFn: ({ chatId }: { chatId: string }) =>
      sessionApi.clearChat(sessionId, chatId),
    onSuccess: () => {
      toast.success('Chat messages cleared')
      refetchChats()
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to clear chat')
    }
  })

  const messages = messagesData?.messages || []

  const formatTime = (timestamp: number | string) => {
    try {
      return format(new Date(timestamp), 'HH:mm')
    } catch (e) {
      return ''
    }
  }

  const getChatId = (chat: any) => {
    return chat.id._serialized || chat.id
  }

  // Filter chats based on search
  const filteredChats = chats?.filter((chat: any) => {
    if (!searchQuery) return true
    const name = chat.name || chat.id.user || ''
    return name.toLowerCase().includes(searchQuery.toLowerCase())
  }) || []

  return (
    <div className="h-full flex flex-col space-y-4">
      <CardHeader className="px-0 pt-0 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Chats & History</CardTitle>
              <CardDescription>Manage conversations and view history</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="grid w-[240px] grid-cols-2">
            <TabsTrigger value="chats">Chats</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>

          {activeTab === 'chats' && (
             <Button variant="outline" size="sm" onClick={() => refetchChats()} disabled={isLoadingChats} className="h-8">
                <RefreshCw className={`h-3.5 w-3.5 mr-2 ${isLoadingChats ? 'animate-spin' : ''}`} />
                Refresh
             </Button>
          )}
          {activeTab === 'messages' && (
             <Button variant="outline" size="sm" onClick={() => refetchMessages()} disabled={isLoadingMessages} className="h-8">
                <RefreshCw className={`h-3.5 w-3.5 mr-2 ${isLoadingMessages ? 'animate-spin' : ''}`} />
                Refresh
             </Button>
          )}
        </div>

        <TabsContent value="chats" className="flex-1 flex flex-col min-h-0 space-y-4 mt-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search chats..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="rounded-xl border bg-card flex-1 min-h-0 overflow-hidden flex flex-col shadow-sm">
             <ScrollArea className="flex-1">
                {isLoadingChats ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
                    <p>Loading your conversations...</p>
                  </div>
                ) : filteredChats.length > 0 ? (
                  <div className="divide-y">
                    {filteredChats.map((chat: any) => {
                      const chatId = getChatId(chat)
                      return (
                        <div key={chatId} className="p-3 hover:bg-muted/50 transition-all flex items-center justify-between group">
                          <div className="flex items-center gap-3 overflow-hidden flex-1">
                            <Avatar className="h-10 w-10 border">
                              <AvatarFallback className="bg-primary/5 text-primary">
                                {chat.isGroup ? <Users className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <div className="font-semibold truncate text-sm">
                                  {chat.name || chat.id.user}
                                </div>
                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                  {formatTime(chat.timestamp * 1000)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between mt-0.5">
                                <div className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
                                  {chat.pinned && <Pin className="h-3 w-3 -rotate-45 fill-muted-foreground text-muted-foreground" />}
                                  {chat.isMuted && <VolumeX className="h-3 w-3 text-muted-foreground" />}
                                  {chat.archived && <Archive className="h-3 w-3 text-muted-foreground" />}
                                  <span>{chat.isGroup ? 'Group' : 'Private'}</span>
                                </div>
                                {chat.unreadCount > 0 && (
                                  <Badge variant="default" className="h-5 min-w-[20px] px-1.5 flex items-center justify-center text-[10px] rounded-full">
                                    {chat.unreadCount}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity -mr-1">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Chat Options</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => pinMutation.mutate({ chatId, pin: !chat.pinned })}>
                                {chat.pinned ? (
                                  <>
                                    <PinOff className="mr-2 h-4 w-4" /> Unpin Chat
                                  </>
                                ) : (
                                  <>
                                    <Pin className="mr-2 h-4 w-4" /> Pin Chat
                                  </>
                                )}
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem onClick={() => archiveMutation.mutate({ chatId, archive: !chat.archived })}>
                                {chat.archived ? (
                                  <>
                                    <Archive className="mr-2 h-4 w-4" /> Unarchive Chat
                                  </>
                                ) : (
                                  <>
                                    <Archive className="mr-2 h-4 w-4" /> Archive Chat
                                  </>
                                )}
                              </DropdownMenuItem>

                              <DropdownMenuItem onClick={() => {
                                if (chat.isMuted) {
                                  unmuteMutation.mutate({ chatId })
                                } else {
                                  muteMutation.mutate({ chatId })
                                }
                              }}>
                                {chat.isMuted ? (
                                  <>
                                    <Volume2 className="mr-2 h-4 w-4" /> Unmute Chat
                                  </>
                                ) : (
                                  <>
                                    <VolumeX className="mr-2 h-4 w-4" /> Mute Chat
                                  </>
                                )}
                              </DropdownMenuItem>

                              <DropdownMenuItem onClick={() => markReadMutation.mutate({ chatId, read: chat.unreadCount > 0 })}>
                                {chat.unreadCount > 0 ? (
                                  <>
                                    <CheckCircle className="mr-2 h-4 w-4" /> Mark as Read
                                  </>
                                ) : (
                                  <>
                                    <Circle className="mr-2 h-4 w-4" /> Mark as Unread
                                  </>
                                )}
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />
                              
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  if (confirm('Are you sure you want to clear all messages in this chat? This cannot be undone.')) {
                                    clearChatMutation.mutate({ chatId })
                                  }
                                }}
                              >
                                <Eraser className="mr-2 h-4 w-4" /> Clear Messages
                              </DropdownMenuItem>

                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this chat?')) {
                                    deleteMutation.mutate({ chatId })
                                  }
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Chat
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                    <div className="bg-muted p-4 rounded-full mb-3">
                      <MessageSquare className="h-8 w-8 opacity-20" />
                    </div>
                    <p className="font-medium">No chats found</p>
                    <p className="text-xs mt-1">Try starting a new conversation</p>
                  </div>
                )}
             </ScrollArea>
          </div>

          <ApiExample 
            method="GET" 
            url={`/api/sessions/${sessionId}/chats`}
            description="Get all active chats from database."
          />
        </TabsContent>

        <TabsContent value="messages" className="flex-1 flex flex-col min-h-0 space-y-4 mt-0">
          <div className="rounded-xl border bg-muted/5 flex-1 min-h-0 overflow-hidden flex flex-col shadow-sm">
            <ScrollArea className="flex-1 p-4">
              {isLoadingMessages ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
                  <p>Loading messages...</p>
                </div>
              ) : messages && messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.map((msg: any) => {
                    const isMe = msg.fromMe
                    return (
                      <div key={msg.id._serialized} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                          isMe 
                            ? 'bg-primary text-primary-foreground rounded-tr-none' 
                            : 'bg-white dark:bg-muted rounded-tl-none border'
                        }`}>
                          {!isMe && (
                            <div className="text-xs font-bold mb-1 opacity-90 text-primary">
                              {msg._data?.notifyName || msg.from.split('@')[0]}
                            </div>
                          )}
                          <div className="break-words whitespace-pre-wrap leading-relaxed">
                            {msg.body || <span className="italic opacity-70 flex items-center gap-1"><Pin className="h-3 w-3" /> Media message</span>}
                          </div>
                          <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMe ? 'opacity-70' : 'text-muted-foreground'}`}>
                            <span>{formatTime(msg.timestamp * 1000)}</span>
                            {isMe && <CheckCheck className="h-3 w-3" />}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                  <div className="bg-muted p-4 rounded-full mb-3">
                    <MessageSquare className="h-8 w-8 opacity-20" />
                  </div>
                  <p>No recent messages</p>
                </div>
              )}
            </ScrollArea>
          </div>

          <ApiExample 
            method="GET" 
            url={`/api/sessions/${sessionId}/messages`}
            description="Get recent message history from database."
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
