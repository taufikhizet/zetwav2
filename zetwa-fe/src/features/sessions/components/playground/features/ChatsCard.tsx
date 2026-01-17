import { useState, useEffect, useRef } from 'react'
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
  Users,
  ArrowLeft,
  Info,
  Copy,
  Clock,
  Hash,
  Phone,
  FileJson
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
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  ToggleGroup, 
  ToggleGroupItem 
} from '@/components/ui/toggle-group'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../ApiExample'

interface ChatsCardProps {
  sessionId: string
}

// --- Helper Components ---

const MessageDetailDialog = ({ message, open, onOpenChange }: { message: any, open: boolean, onOpenChange: (open: boolean) => void }) => {
  if (!message) return null

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const isMe = message.fromMe || message.isFromMe

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between mr-8">
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Message Details
            </DialogTitle>
            <Badge variant={isMe ? 'default' : 'secondary'}>
              {isMe ? 'OUTGOING' : 'INCOMING'}
            </Badge>
          </div>
          <DialogDescription>
            Comprehensive metadata for debugging and verification.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Main Info Card */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border bg-muted/20">
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Hash className="h-3 w-3" /> Message ID
              </div>
              <div className="text-xs font-mono break-all cursor-pointer hover:underline" onClick={() => copyToClipboard(message.id._serialized || message.id)}>
                {message.id._serialized || message.id}
              </div>
            </div>
            
            <div className="space-y-1">
               <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> Timestamp
              </div>
              <div className="text-sm">
                {(() => {
                  try {
                    return format(new Date(message.timestamp * 1000), 'PPpp')
                  } catch {
                    return 'N/A'
                  }
                })()}
              </div>
            </div>

            <div className="space-y-1">
               <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3" /> From
              </div>
              <div className="text-sm font-mono truncate">
                {message.from}
              </div>
            </div>

            <div className="space-y-1">
               <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" /> To
              </div>
              <div className="text-sm font-mono truncate">
                {message.to}
              </div>
            </div>
             
             <div className="space-y-1">
               <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" /> Type
              </div>
              <Badge variant="outline" className="uppercase text-[10px]">
                {message.type}
              </Badge>
            </div>

            <div className="space-y-1">
               <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Status (ACK)
              </div>
               <div className="flex items-center gap-2">
                 {message.ack >= 3 ? <Badge className="bg-blue-500 hover:bg-blue-600">READ ({message.ack})</Badge> : 
                  message.ack >= 2 ? <Badge className="bg-gray-500">DELIVERED ({message.ack})</Badge> :
                  message.ack >= 1 ? <Badge variant="secondary">SENT ({message.ack})</Badge> :
                  <Badge variant="outline">PENDING ({message.ack})</Badge>}
               </div>
            </div>
          </div>

          {/* Content Section */}
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              Content
            </h4>
            <div className="p-4 rounded-lg border bg-card text-sm whitespace-pre-wrap leading-relaxed shadow-sm">
              {message.body || <span className="italic text-muted-foreground">No text content (Media/System message)</span>}
            </div>
          </div>

          {/* Raw Data Section */}
          <div>
             <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <FileJson className="h-4 w-4" /> Raw JSON Data
            </h4>
            <div className="relative">
              <ScrollArea className="h-[200px] rounded-lg border bg-muted/50 p-4 font-mono text-xs">
                 <pre>{JSON.stringify(message, null, 2)}</pre>
              </ScrollArea>
              <Button 
                size="icon" 
                variant="ghost" 
                className="absolute top-2 right-2 h-6 w-6"
                onClick={() => copyToClipboard(JSON.stringify(message, null, 2))}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const ChatDetailDialog = ({ chat, open, onOpenChange }: { chat: any, open: boolean, onOpenChange: (open: boolean) => void }) => {
  if (!chat) return null

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between mr-8">
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Chat Details
            </DialogTitle>
            {chat.isGroup && <Badge variant="secondary">GROUP</Badge>}
          </div>
          <DialogDescription>
            Technical details and metadata for this conversation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Main Info Card */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border bg-muted/20">
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Hash className="h-3 w-3" /> Chat ID (WA ID)
              </div>
              <div className="text-xs font-mono break-all cursor-pointer hover:underline" onClick={() => copyToClipboard(chat.id._serialized || chat.id)}>
                {chat.id._serialized || chat.id}
              </div>
            </div>
            
            <div className="space-y-1">
               <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> Last Active
              </div>
              <div className="text-sm">
                {(() => {
                  try {
                    return format(new Date(chat.timestamp * 1000), 'PPpp')
                  } catch {
                    return 'N/A'
                  }
                })()}
              </div>
            </div>

            <div className="space-y-1">
               <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" /> Name
              </div>
              <div className="text-sm font-medium truncate">
                {chat.name || chat.id.user}
              </div>
            </div>

            <div className="space-y-1">
               <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Circle className="h-3 w-3" /> Unread Count
              </div>
              <div className="text-sm">
                {chat.unreadCount} messages
              </div>
            </div>
          </div>
          
          {/* Status Flags */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Status Flags</h4>
            <div className="flex flex-wrap gap-2">
              {chat.isMuted && <Badge variant="outline" className="gap-1"><VolumeX className="h-3 w-3" /> Muted</Badge>}
              {chat.pinned && <Badge variant="outline" className="gap-1"><Pin className="h-3 w-3" /> Pinned</Badge>}
              {chat.archived && <Badge variant="outline" className="gap-1"><Archive className="h-3 w-3" /> Archived</Badge>}
              {!chat.isMuted && !chat.pinned && !chat.archived && <span className="text-sm text-muted-foreground italic">No active flags</span>}
            </div>
          </div>

          {/* Raw Data Section */}
          <div>
             <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <FileJson className="h-4 w-4" /> Raw JSON Data
            </h4>
            <div className="relative">
              <ScrollArea className="h-[200px] rounded-lg border bg-muted/50 p-4 font-mono text-xs">
                 <pre>{JSON.stringify(chat, null, 2)}</pre>
              </ScrollArea>
              <Button 
                size="icon" 
                variant="ghost" 
                className="absolute top-2 right-2 h-6 w-6"
                onClick={() => copyToClipboard(JSON.stringify(chat, null, 2))}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const MessageBubble = ({ msg, onClick }: { msg: any, onClick: (msg: any) => void }) => {
  const isMe = msg.fromMe || msg.isFromMe
  const isSystem = msg.type === 'e2e_notification' || msg.type === 'notification_template' || msg.type === 'call_log'
  
  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <span className="text-[10px] bg-muted/80 text-muted-foreground px-3 py-1 rounded-full shadow-sm border border-border/20">
          {msg.body || msg.type.replace('_', ' ').toUpperCase()}
        </span>
      </div>
    )
  }

  const formatTime = (timestamp: number) => {
    try {
      return format(new Date(timestamp * 1000), 'HH:mm')
    } catch {
      return ''
    }
  }

  return (
    <div 
      className={`flex ${isMe ? 'justify-end' : 'justify-start'} group mb-2 animate-in fade-in slide-in-from-bottom-1 duration-300`}
      onClick={() => onClick(msg)}
    >
      <div className={`
        relative max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm cursor-pointer transition-all hover:shadow-md border
        ${isMe 
          ? 'bg-primary text-primary-foreground rounded-tr-none border-primary/20' 
          : 'bg-card text-card-foreground rounded-tl-none border-border/40 hover:bg-muted/30'}
      `}>
         {/* Sender Name for Groups (Incoming) */}
         {!isMe && msg.isGroup && (
           <div className="text-[10px] font-bold opacity-80 mb-1 text-primary">
             {msg._data?.notifyName || msg.author?.split('@')[0] || 'Unknown'}
           </div>
         )}

         {/* Message Content */}
         <div className="break-words whitespace-pre-wrap leading-relaxed">
           {msg.type !== 'chat' && msg.type !== 'text' && (
             <div className="text-xs opacity-80 italic mb-1 flex items-center gap-1.5 font-medium">
               <Info className="h-3 w-3" /> {msg.type.toUpperCase()}
             </div>
           )}
           {msg.body}
         </div>
         
         {/* Footer: Time & Status */}
         <div className={`flex items-center justify-end gap-1 mt-1.5 text-[10px] ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
            <span>{formatTime(msg.timestamp)}</span>
            {isMe && (
              <span className={msg.ack >= 3 ? 'text-blue-200' : ''}>
                {msg.ack >= 3 ? <CheckCheck className="h-3 w-3" /> : 
                 msg.ack >= 2 ? <CheckCheck className="h-3 w-3" /> :
                 msg.ack >= 1 ? <CheckCircle className="h-3 w-3" /> :
                 <Circle className="h-3 w-3" />}
              </span>
            )}
         </div>
      </div>
    </div>
  )
}

export function ChatsCard({ sessionId }: ChatsCardProps) {
  const [activeTab, setActiveTab] = useState('chats')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedChat, setSelectedChat] = useState<any>(null)
  const [selectedMessage, setSelectedMessage] = useState<any>(null)
  const [showChatInfo, setShowChatInfo] = useState(false)
  const [messageFilter, setMessageFilter] = useState<'all' | 'incoming' | 'outgoing'>('all')
  const scrollRef = useRef<HTMLDivElement>(null)

  const getChatId = (chat: any) => {
    return chat.id._serialized || chat.id
  }

  // Get Chats Query
  const { data: chats, isLoading: isLoadingChats, refetch: refetchChats } = useQuery({
    queryKey: ['chats', sessionId],
    queryFn: () => sessionApi.getChats(sessionId),
    enabled: activeTab === 'chats' && !selectedChat,
  })

  // Get Messages Query (Global)
  const { data: messagesData, isLoading: isLoadingMessages, refetch: refetchMessages } = useQuery({
    queryKey: ['messages', sessionId, messageFilter],
    queryFn: () => sessionApi.getMessages(sessionId, { 
      limit: 50,
      direction: messageFilter === 'all' ? undefined : (messageFilter === 'incoming' ? 'INCOMING' : 'OUTGOING')
    }),
    enabled: activeTab === 'messages',
  })

  // Get Chat Messages Query (Specific Chat)
  const { data: chatMessagesData, isLoading: isLoadingChatMessages, refetch: refetchChatMessages } = useQuery({
    queryKey: ['messages', sessionId, selectedChat ? getChatId(selectedChat) : null],
    queryFn: () => sessionApi.getMessages(sessionId, { limit: 50, chatId: selectedChat ? getChatId(selectedChat) : undefined }),
    enabled: !!selectedChat,
    refetchInterval: 5000, // Poll for new messages every 5s when chat is open
  })

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatMessagesData && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chatMessagesData, selectedChat])

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
      setSelectedChat(null)
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
      refetchChatMessages()
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to clear chat')
    }
  })

  const messages = messagesData?.messages || []
  const chatMessages = chatMessagesData?.messages || []

  const formatTime = (timestamp: number | string) => {
    try {
      return format(new Date(timestamp), 'HH:mm')
    } catch (e) {
      return ''
    }
  }

  // Filter chats based on search
  const filteredChats = chats?.filter((chat: any) => {
    if (!searchQuery) return true
    const name = chat.name || chat.id.user || ''
    return name.toLowerCase().includes(searchQuery.toLowerCase())
  }) || []

  // Handle chat selection
  const handleChatClick = (chat: any) => {
    setSelectedChat(chat)
    // Mark as read when opening
    if (chat.unreadCount > 0) {
      markReadMutation.mutate({ chatId: getChatId(chat), read: true })
    }
  }

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
        {!selectedChat && (
          <div className="flex items-center justify-between mb-4">
            <TabsList className="grid w-[240px] grid-cols-2">
              <TabsTrigger value="chats">Chats</TabsTrigger>
              <TabsTrigger value="messages">History</TabsTrigger>
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
        )}

        <TabsContent value="chats" className="flex-1 flex flex-col min-h-0 space-y-4 mt-0 data-[state=inactive]:hidden">
          {selectedChat ? (
            // Chat Detail View
            <div className="flex flex-col h-full rounded-xl border bg-card shadow-sm overflow-hidden animate-in slide-in-from-right-5 duration-300">
              {/* Chat Header */}
              <div className="flex items-center justify-between p-3 border-b bg-muted/30">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="h-8 w-8 -ml-1" onClick={() => setSelectedChat(null)}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Avatar className="h-9 w-9 border">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {selectedChat.isGroup ? <Users className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-sm flex items-center gap-2">
                      {selectedChat.name || selectedChat.id.user}
                      {selectedChat.isGroup && <Badge variant="secondary" className="text-[10px] h-4 px-1">Group</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {getChatId(selectedChat)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                   <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowChatInfo(true)}>
                      <Info className="h-4 w-4" />
                   </Button>
                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => clearChatMutation.mutate({ chatId: getChatId(selectedChat) })}>
                        <Eraser className="mr-2 h-4 w-4" /> Clear Messages
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this chat?')) {
                            deleteMutation.mutate({ chatId: getChatId(selectedChat) })
                          }
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Chat
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Chat Messages */}
              <ScrollArea className="flex-1 bg-muted/10 p-4" ref={scrollRef}>
                {isLoadingChatMessages ? (
                   <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-10">
                     <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
                     <p>Loading conversation...</p>
                   </div>
                ) : chatMessages.length > 0 ? (
                  <div className="space-y-2 pb-4">
                    {chatMessages.map((msg: any) => (
                      <MessageBubble 
                        key={msg.id._serialized || msg.id} 
                        msg={msg} 
                        onClick={setSelectedMessage} 
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-10">
                    <div className="bg-muted p-4 rounded-full mb-3">
                      <MessageSquare className="h-8 w-8 opacity-20" />
                    </div>
                    <p>No messages yet</p>
                  </div>
                )}
              </ScrollArea>
              
              {/* Footer / Input placeholder */}
              <div className="p-4 border-t bg-card text-center text-xs text-muted-foreground flex items-center justify-between gap-4">
                 <span className="italic">Use the Messaging tab to send messages</span>
                 <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setActiveTab('messages')}>
                    View History
                 </Button>
              </div>
            </div>
          ) : (
            // Chat List View
            <>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  className="pl-9 bg-muted/30 border-muted-foreground/20"
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
                      <div className="divide-y divide-border/40">
                        {filteredChats.map((chat: any) => {
                          const chatId = getChatId(chat)
                          return (
                            <div 
                              key={chatId} 
                              className="p-3.5 hover:bg-muted/40 transition-all flex items-center justify-between group cursor-pointer relative"
                              onClick={() => handleChatClick(chat)}
                            >
                              <div className="flex items-center gap-3.5 overflow-hidden flex-1">
                                <Avatar className="h-11 w-11 border bg-muted/20">
                                  <AvatarFallback className="bg-primary/5 text-primary font-medium">
                                    {chat.isGroup ? <Users className="h-5 w-5" /> : (chat.name?.[0] || <MessageCircle className="h-5 w-5" />)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1 space-y-0.5">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="font-semibold truncate text-sm text-foreground">
                                      {chat.name || chat.id.user}
                                    </div>
                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                      {formatTime(chat.timestamp * 1000)}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div className="text-xs text-muted-foreground truncate flex items-center gap-2">
                                      <div className="flex items-center gap-1">
                                         {chat.pinned && <Pin className="h-3 w-3 -rotate-45 fill-muted-foreground text-muted-foreground" />}
                                         {chat.isMuted && <VolumeX className="h-3 w-3 text-muted-foreground" />}
                                         {chat.archived && <Archive className="h-3 w-3 text-muted-foreground" />}
                                      </div>
                                      <span>{chat.isGroup ? 'Group' : 'Private'}</span>
                                    </div>
                                    {chat.unreadCount > 0 && (
                                      <Badge variant="default" className="h-5 min-w-[20px] px-1.5 flex items-center justify-center text-[10px] rounded-full shadow-sm">
                                        {chat.unreadCount}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 -mr-1 absolute right-2 top-1/2 -translate-y-1/2 bg-card/80 backdrop-blur-sm shadow-sm border" onClick={(e) => e.stopPropagation()}>
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuLabel>Chat Options</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); pinMutation.mutate({ chatId, pin: !chat.pinned }) }}>
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
                                  
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); archiveMutation.mutate({ chatId, archive: !chat.archived }) }}>
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

                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
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

                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); markReadMutation.mutate({ chatId, read: chat.unreadCount > 0 }) }}>
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
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (confirm('Are you sure you want to clear all messages in this chat? This cannot be undone.')) {
                                        clearChatMutation.mutate({ chatId })
                                      }
                                    }}
                                  >
                                    <Eraser className="mr-2 h-4 w-4" /> Clear Messages
                                  </DropdownMenuItem>

                                  <DropdownMenuItem 
                                    className="text-destructive focus:text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
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
            </>
          )}
        </TabsContent>

        <TabsContent value="messages" className="flex-1 flex flex-col min-h-0 space-y-4 mt-0">
          <div className="flex justify-center">
            <ToggleGroup type="single" value={messageFilter} onValueChange={(val: any) => val && setMessageFilter(val)}>
              <ToggleGroupItem value="all" aria-label="All Messages" className="text-xs px-3 h-7">
                All
              </ToggleGroupItem>
              <ToggleGroupItem value="incoming" aria-label="Incoming Messages" className="text-xs px-3 h-7">
                Incoming
              </ToggleGroupItem>
              <ToggleGroupItem value="outgoing" aria-label="Outgoing Messages" className="text-xs px-3 h-7">
                Outgoing
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="rounded-xl border bg-muted/5 flex-1 min-h-0 overflow-hidden flex flex-col shadow-sm">
            <ScrollArea className="flex-1 p-4">
              {isLoadingMessages ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
                  <p>Loading messages...</p>
                </div>
              ) : messages && messages.length > 0 ? (
                <div className="space-y-2 pb-4">
                  {messages.map((msg: any) => (
                    <MessageBubble 
                      key={msg.id._serialized || msg.id} 
                      msg={msg} 
                      onClick={setSelectedMessage} 
                    />
                  ))}
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
            url={`/api/sessions/${sessionId}/messages${messageFilter !== 'all' ? `?direction=${messageFilter.toUpperCase()}` : ''}`}
            description="Get recent message history from database."
          />
        </TabsContent>
      </Tabs>
      
      <MessageDetailDialog 
        message={selectedMessage} 
        open={!!selectedMessage} 
        onOpenChange={(open) => !open && setSelectedMessage(null)} 
      />
      
      <ChatDetailDialog
        chat={selectedChat}
        open={showChatInfo}
        onOpenChange={setShowChatInfo}
      />
    </div>
  )
}
