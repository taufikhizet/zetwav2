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
  Eraser
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../ApiExample'

interface ChatsCardProps {
  sessionId: string
}

export function ChatsCard({ sessionId }: ChatsCardProps) {
  const [activeTab, setActiveTab] = useState('chats')

  // Get Chats Query
  const { data: chats, isLoading: isLoadingChats, refetch: refetchChats } = useQuery({
    queryKey: ['chats', sessionId],
    queryFn: () => sessionApi.getChats(sessionId),
    enabled: activeTab === 'chats',
  })

  // Get Messages Query
  const { data: messagesData, isLoading: isLoadingMessages, refetch: refetchMessages } = useQuery({
    queryKey: ['messages', sessionId],
    queryFn: () => sessionApi.getMessages(sessionId, { limit: 20 }),
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

  return (
    <div className="h-full">
      <CardHeader>
        <CardTitle>Chats & History</CardTitle>
        <CardDescription>View your chat list and message history.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="chats">Active Chats</TabsTrigger>
            <TabsTrigger value="messages">Recent Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="chats" className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => refetchChats()} disabled={isLoadingChats}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingChats ? 'animate-spin' : ''}`} />
                Refresh List
              </Button>
            </div>

            <div className="rounded-md border h-[400px] overflow-hidden">
              <div className="h-full overflow-y-auto">
                {isLoadingChats ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mb-2" />
                    <p>Loading chats...</p>
                  </div>
                ) : chats && chats.length > 0 ? (
                  <div className="divide-y">
                    {chats.map((chat: any) => {
                      const chatId = getChatId(chat)
                      return (
                        <div key={chatId} className="p-3 hover:bg-muted/50 transition-colors flex items-center justify-between group">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback><MessageCircle className="h-5 w-5" /></AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="font-medium truncate">{chat.name || chat.id.user}</div>
                                {chat.pinned && <Pin className="h-3 w-3 -rotate-45 fill-muted-foreground text-muted-foreground" />}
                                {chat.isMuted && <VolumeX className="h-3 w-3 text-muted-foreground" />}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {chat.isGroup ? 'Group' : 'Private Chat'} • {formatTime(chat.timestamp * 1000)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col items-end gap-1">
                              {chat.unreadCount > 0 && (
                                <Badge className="h-5 min-w-[20px] px-1.5 flex items-center justify-center">
                                  {chat.unreadCount}
                                </Badge>
                              )}
                              {chat.archived && <Archive className="h-3 w-3 text-muted-foreground" />}
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
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
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mb-2 opacity-20" />
                    <p>No active chats found</p>
                  </div>
                )}
              </div>
            </div>

            <ApiExample 
              method="GET" 
              url={`/api/sessions/${sessionId}/chats`}
              description="Get all active chats from database."
            />
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
             <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => refetchMessages()} disabled={isLoadingMessages}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingMessages ? 'animate-spin' : ''}`} />
                Refresh Messages
              </Button>
            </div>

            <div className="rounded-md border h-[400px] overflow-hidden bg-muted/5">
              <div className="h-full overflow-y-auto p-4">
                {isLoadingMessages ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mb-2" />
                    <p>Loading messages...</p>
                  </div>
                ) : messages && messages.length > 0 ? (
                  <div className="space-y-4">
                    {messages.map((msg: any) => {
                      const isMe = msg.fromMe
                      return (
                        <div key={msg.id._serialized} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-lg p-3 ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            {!isMe && (
                              <div className="text-xs font-semibold mb-1 opacity-80">
                                {msg._data?.notifyName || msg.from.split('@')[0]}
                              </div>
                            )}
                            <div className="text-sm break-words whitespace-pre-wrap">
                              {msg.body || <span className="italic opacity-70">Media message</span>}
                            </div>
                            <div className="flex items-center justify-end gap-1 mt-1 opacity-70">
                              <span className="text-[10px]">{formatTime(msg.timestamp * 1000)}</span>
                              {isMe && <CheckCheck className="h-3 w-3" />}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mb-2 opacity-20" />
                    <p>No messages found in history</p>
                  </div>
                )}
              </div>
            </div>

            <ApiExample 
              method="GET" 
              url={`/api/sessions/${sessionId}/messages`}
              description="Get recent message history from database."
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </div>
  )
}
