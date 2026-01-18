import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  Send, 
  Image, 
  Loader2, 
  Forward, 
  Trash2, 
  MapPin, 
  Contact, 
  BarChart2, 
  Plus, 
  X, 
  MessageSquare, 
  Paperclip, 
  AlertCircle,
  Menu,
  List,
  Smile,
  Star,
  Activity,
  Eye
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../ApiExample'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface MessagingCardProps {
  sessionId: string
}

export function MessagingCard({ sessionId }: MessagingCardProps) {
  const [activeTab, setActiveTab] = useState('text')
  
  // Text Message State
  const [textTo, setTextTo] = useState('')
  const [textBody, setTextBody] = useState('')
  const [linkPreview, setLinkPreview] = useState(false)

  // Media Message State
  const [mediaTo, setMediaTo] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [mediaCaption, setMediaCaption] = useState('')

  // Forward Message State
  const [forwardTo, setForwardTo] = useState('')
  const [forwardMessageId, setForwardMessageId] = useState('')

  // Delete Message State
  const [deleteMessageId, setDeleteMessageId] = useState('')
  const [deleteForEveryone, setDeleteForEveryone] = useState(true)

  // Location Message State
  const [locationTo, setLocationTo] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [locationDesc, setLocationDesc] = useState('')
  const [locationUrl, setLocationUrl] = useState('')

  // Contact Message State
  const [contactTo, setContactTo] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactOrg, setContactOrg] = useState('')

  // Poll Message State
  const [pollTo, setPollTo] = useState('')
  const [pollName, setPollName] = useState('')
  const [pollOptions, setPollOptions] = useState(['', ''])
  const [pollMultiple, setPollMultiple] = useState(false)
  
  // Poll Vote State
  const [votePollId, setVotePollId] = useState('')
  const [voteOptions, setVoteOptions] = useState<string[]>([])
  const [voteTo, setVoteTo] = useState('')

  // Buttons Message State
  const [buttonsTo, setButtonsTo] = useState('')
  const [buttonsBody, setButtonsBody] = useState('')
  const [buttonsTitle, setButtonsTitle] = useState('')
  const [buttonsFooter, setButtonsFooter] = useState('')
  const [buttonsList, setButtonsList] = useState<{id: string, text: string}[]>([{id: 'btn1', text: 'Button 1'}])

  // List Message State
  const [listTo, setListTo] = useState('')
  const [listBody, setListBody] = useState('')
  const [listTitle, setListTitle] = useState('')
  const [listBtnText, setListBtnText] = useState('Menu')
  const [listSections] = useState<{title: string, rows: {id: string, title: string, description?: string}[]}[]>([
    { title: 'Section 1', rows: [{ id: 'row1', title: 'Option 1', description: 'Description 1' }] }
  ])

  // Reaction State
  const [reactionMsgId, setReactionMsgId] = useState('')
  const [reactionEmoji, setReactionEmoji] = useState('❤️')

  // Star Message State
  const [starMsgId, setStarMsgId] = useState('')
  const [isStar, setIsStar] = useState(true)

  // Presence State
  const [presenceChatId, setPresenceChatId] = useState('')

  // Mutations
  const sendTextMutation = useMutation({
    mutationFn: () => sessionApi.sendMessage(sessionId, { to: textTo, message: textBody, linkPreview }),
    onSuccess: () => {
      toast.success('Message sent successfully')
      setTextBody('')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send message')
    }
  })

  const sendMediaMutation = useMutation({
    mutationFn: () => sessionApi.sendMedia(sessionId, { 
      to: mediaTo, 
      mediaUrl, 
      caption: mediaCaption 
    }),
    onSuccess: () => {
      toast.success('Media sent successfully')
      setMediaUrl('')
      setMediaCaption('')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send media')
    }
  })

  const forwardMessageMutation = useMutation({
    mutationFn: () => sessionApi.forwardMessage(sessionId, { messageId: forwardMessageId, to: forwardTo }),
    onSuccess: () => {
      toast.success('Message forwarded successfully')
      setForwardMessageId('')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to forward message')
    }
  })

  const deleteMessageMutation = useMutation({
    mutationFn: () => sessionApi.deleteMessage(sessionId, deleteMessageId, deleteForEveryone),
    onSuccess: () => {
      toast.success('Message deleted successfully')
      setDeleteMessageId('')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete message')
    }
  })

  const sendLocationMutation = useMutation({
    mutationFn: () => sessionApi.sendLocation(sessionId, {
      to: locationTo,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      description: locationDesc,
      url: locationUrl
    }),
    onSuccess: () => {
      toast.success('Location sent successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send location')
    }
  })

  const sendContactMutation = useMutation({
    mutationFn: () => sessionApi.sendContact(sessionId, {
      to: contactTo,
      contact: {
        name: contactName,
        phone: contactPhone,
        organization: contactOrg
      }
    }),
    onSuccess: () => {
      toast.success('Contact sent successfully')
      setContactName('')
      setContactPhone('')
      setContactOrg('')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send contact')
    }
  })

  const sendPollMutation = useMutation({
    mutationFn: () => sessionApi.sendPoll(sessionId, {
      to: pollTo,
      poll: {
        name: pollName,
        options: pollOptions.filter(o => o.trim() !== ''),
        multipleAnswers: pollMultiple
      }
    }),
    onSuccess: () => {
      toast.success('Poll sent successfully')
      setPollName('')
      setPollOptions(['', ''])
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send poll')
    }
  })

  const sendPollVoteMutation = useMutation({
    mutationFn: () => sessionApi.sendPollVote(sessionId, {
      to: voteTo,
      pollMessageId: votePollId,
      selectedOptions: voteOptions
    }),
    onSuccess: () => {
      toast.success('Poll vote sent successfully')
      setVotePollId('')
      setVoteOptions([])
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send poll vote')
    }
  })

  const sendButtonsMutation = useMutation({
    mutationFn: () => sessionApi.sendButtons(sessionId, {
      to: buttonsTo,
      body: buttonsBody,
      buttons: buttonsList,
      title: buttonsTitle,
      footer: buttonsFooter
    }),
    onSuccess: () => {
      toast.success('Buttons message sent successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send buttons')
    }
  })

  const sendListMutation = useMutation({
    mutationFn: () => sessionApi.sendList(sessionId, {
      to: listTo,
      body: listBody,
      buttonText: listBtnText,
      sections: listSections,
      title: listTitle
    }),
    onSuccess: () => {
      toast.success('List message sent successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send list')
    }
  })

  const sendReactionMutation = useMutation({
    mutationFn: () => sessionApi.sendReaction(sessionId, {
      messageId: reactionMsgId,
      reaction: reactionEmoji
    }),
    onSuccess: () => {
      toast.success('Reaction sent successfully')
      setReactionMsgId('')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send reaction')
    }
  })

  const starMessageMutation = useMutation({
    mutationFn: () => sessionApi.starMessage(sessionId, starMsgId, isStar),
    onSuccess: () => {
      toast.success(`Message ${isStar ? 'starred' : 'unstarred'} successfully`)
      setStarMsgId('')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to star/unstar message')
    }
  })

  const sendTypingMutation = useMutation({
    mutationFn: () => sessionApi.sendTyping(sessionId, presenceChatId),
    onSuccess: () => toast.success('Typing indicator sent'),
    onError: (error: any) => toast.error(error.message || 'Failed to send typing')
  })

  const stopTypingMutation = useMutation({
    mutationFn: () => sessionApi.stopTyping(sessionId, presenceChatId),
    onSuccess: () => toast.success('Typing indicator stopped'),
    onError: (error: any) => toast.error(error.message || 'Failed to stop typing')
  })

  const sendSeenMutation = useMutation({
    mutationFn: () => sessionApi.markChatRead(sessionId, presenceChatId, true),
    onSuccess: () => toast.success('Chat marked as read'),
    onError: (error: any) => toast.error(error.message || 'Failed to mark as read')
  })

  // Handlers
  const handleAddPollOption = () => setPollOptions([...pollOptions, ''])
  const handleRemovePollOption = (index: number) => {
    const newOptions = [...pollOptions]
    newOptions.splice(index, 1)
    setPollOptions(newOptions)
  }
  const handlePollOptionChange = (index: number, value: string) => {
    const newOptions = [...pollOptions]
    newOptions[index] = value
    setPollOptions(newOptions)
  }

  const handleAddButton = () => setButtonsList([...buttonsList, { id: `btn${buttonsList.length + 1}`, text: '' }])
  const handleRemoveButton = (index: number) => {
    const newBtns = [...buttonsList]
    newBtns.splice(index, 1)
    setButtonsList(newBtns)
  }
  const handleButtonChange = (index: number, field: 'id' | 'text', value: string) => {
    const newBtns = [...buttonsList]
    newBtns[index] = { ...newBtns[index], [field]: value }
    setButtonsList(newBtns)
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
              <CardTitle className="text-xl">Messaging</CardTitle>
              <CardDescription>Send messages, media, and interactive content</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4">
           <TabsList className="flex w-full flex-wrap h-auto gap-1 bg-muted/50 p-1 justify-start">
            <TabsTrigger value="text" className="flex-1 min-w-[70px]">Text</TabsTrigger>
            <TabsTrigger value="media" className="flex-1 min-w-[70px]">Media</TabsTrigger>
            <TabsTrigger value="location" className="flex-1 min-w-[70px]">Location</TabsTrigger>
            <TabsTrigger value="contact" className="flex-1 min-w-[70px]">Contact</TabsTrigger>
            <TabsTrigger value="poll" className="flex-1 min-w-[70px]">Poll</TabsTrigger>
            <TabsTrigger value="buttons" className="flex-1 min-w-[70px]">Buttons</TabsTrigger>
            <TabsTrigger value="list" className="flex-1 min-w-[70px]">List</TabsTrigger>
            <TabsTrigger value="reaction" className="flex-1 min-w-[70px]">Reaction</TabsTrigger>
            <TabsTrigger value="presence" className="flex-1 min-w-[70px]">Presence</TabsTrigger>
            <TabsTrigger value="forward" className="flex-1 min-w-[70px]">Forward</TabsTrigger>
            <TabsTrigger value="delete" className="flex-1 min-w-[70px]">Delete</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
            {/* TEXT TAB */}
            <TabsContent value="text" className="mt-0 space-y-6">
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
                  linkPreview: linkPreview
                }}
              />
            </TabsContent>

            {/* MEDIA TAB */}
            <TabsContent value="media" className="mt-0 space-y-6">
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
            </TabsContent>

            {/* BUTTONS TAB */}
            <TabsContent value="buttons" className="mt-0 space-y-6">
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                 <div className="grid gap-6">
                    <div className="grid gap-2">
                      <Label>Phone Number</Label>
                      <Input value={buttonsTo} onChange={(e) => setButtonsTo(e.target.value)} placeholder="e.g. 6281234567890" className="font-mono" />
                    </div>
                    <div className="grid gap-2">
                      <Label>Title (Optional)</Label>
                      <Input value={buttonsTitle} onChange={(e) => setButtonsTitle(e.target.value)} placeholder="Message Title" />
                    </div>
                    <div className="grid gap-2">
                      <Label>Body</Label>
                      <Textarea value={buttonsBody} onChange={(e) => setButtonsBody(e.target.value)} placeholder="Main message content..." />
                    </div>
                    <div className="grid gap-2">
                      <Label>Footer (Optional)</Label>
                      <Input value={buttonsFooter} onChange={(e) => setButtonsFooter(e.target.value)} placeholder="Footer text" />
                    </div>
                    <div className="space-y-3">
                      <Label>Buttons (Max 3)</Label>
                      {buttonsList.map((btn, index) => (
                        <div key={index} className="flex gap-2">
                          <Input placeholder="ID" className="w-20" value={btn.id} onChange={(e) => handleButtonChange(index, 'id', e.target.value)} />
                          <Input placeholder="Button Text" value={btn.text} onChange={(e) => handleButtonChange(index, 'text', e.target.value)} />
                          {buttonsList.length > 1 && (
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveButton(index)}><X className="h-4 w-4" /></Button>
                          )}
                        </div>
                      ))}
                      {buttonsList.length < 3 && (
                        <Button variant="outline" size="sm" onClick={handleAddButton} className="w-full"><Plus className="mr-2 h-3 w-3" /> Add Button</Button>
                      )}
                    </div>
                    <Button className="w-full" onClick={() => sendButtonsMutation.mutate()} disabled={!buttonsTo || !buttonsBody || buttonsList.length === 0 || sendButtonsMutation.isPending}>
                      {sendButtonsMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Menu className="mr-2 h-4 w-4" />}
                      Send Buttons
                    </Button>
                 </div>
              </div>
            </TabsContent>

            {/* LIST TAB */}
            <TabsContent value="list" className="mt-0 space-y-6">
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                 <div className="grid gap-6">
                    <div className="grid gap-2">
                      <Label>Phone Number</Label>
                      <Input value={listTo} onChange={(e) => setListTo(e.target.value)} placeholder="e.g. 6281234567890" className="font-mono" />
                    </div>
                    <div className="grid gap-2">
                      <Label>Title (Optional)</Label>
                      <Input value={listTitle} onChange={(e) => setListTitle(e.target.value)} placeholder="List Title" />
                    </div>
                    <div className="grid gap-2">
                      <Label>Body</Label>
                      <Textarea value={listBody} onChange={(e) => setListBody(e.target.value)} placeholder="Main message content..." />
                    </div>
                    <div className="grid gap-2">
                      <Label>Button Text</Label>
                      <Input value={listBtnText} onChange={(e) => setListBtnText(e.target.value)} placeholder="e.g. Show Menu" />
                    </div>
                    {/* Simplified Section Editor - For detailed sections, using JSON or a simpler UI is better for now */}
                    <Alert><AlertCircle className="h-4 w-4" /><AlertTitle>Info</AlertTitle><AlertDescription>Currently sending a default demo list structure.</AlertDescription></Alert>
                    
                    <Button className="w-full" onClick={() => sendListMutation.mutate()} disabled={!listTo || !listBody || !listBtnText || sendListMutation.isPending}>
                      {sendListMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <List className="mr-2 h-4 w-4" />}
                      Send List Message
                    </Button>
                 </div>
              </div>
            </TabsContent>

            {/* REACTION & STAR TAB */}
            <TabsContent value="reaction" className="mt-0 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Reaction */}
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                   <h3 className="font-semibold mb-4 flex items-center gap-2"><Smile className="h-4 w-4" /> Send Reaction</h3>
                   <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label>Message ID</Label>
                        <Input value={reactionMsgId} onChange={(e) => setReactionMsgId(e.target.value)} placeholder="Message ID to react to" className="font-mono" />
                      </div>
                      <div className="grid gap-2">
                        <Label>Emoji</Label>
                        <Input value={reactionEmoji} onChange={(e) => setReactionEmoji(e.target.value)} placeholder="e.g. ❤️, 👍" />
                      </div>
                      <Button onClick={() => sendReactionMutation.mutate()} disabled={!reactionMsgId || !reactionEmoji || sendReactionMutation.isPending}>
                        {sendReactionMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Send Reaction'}
                      </Button>
                   </div>
                </div>

                {/* Star */}
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                   <h3 className="font-semibold mb-4 flex items-center gap-2"><Star className="h-4 w-4" /> Star Message</h3>
                   <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label>Message ID</Label>
                        <Input value={starMsgId} onChange={(e) => setStarMsgId(e.target.value)} placeholder="Message ID to star" className="font-mono" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="is-star" checked={isStar} onCheckedChange={setIsStar} />
                        <Label htmlFor="is-star">Star Message</Label>
                      </div>
                      <Button onClick={() => starMessageMutation.mutate()} disabled={!starMsgId || starMessageMutation.isPending}>
                        {starMessageMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isStar ? 'Star Message' : 'Unstar Message')}
                      </Button>
                   </div>
                </div>
              </div>
            </TabsContent>

            {/* PRESENCE TAB */}
            <TabsContent value="presence" className="mt-0 space-y-6">
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                 <div className="grid gap-6">
                    <div className="grid gap-2">
                      <Label>Chat ID / Phone Number</Label>
                      <Input value={presenceChatId} onChange={(e) => setPresenceChatId(e.target.value)} placeholder="e.g. 6281234567890" className="font-mono" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button variant="outline" onClick={() => sendTypingMutation.mutate()} disabled={!presenceChatId || sendTypingMutation.isPending}>
                        <Activity className="mr-2 h-4 w-4" /> Start Typing
                      </Button>
                      <Button variant="outline" onClick={() => stopTypingMutation.mutate()} disabled={!presenceChatId || stopTypingMutation.isPending}>
                        <Activity className="mr-2 h-4 w-4" /> Stop Typing
                      </Button>
                      <Button variant="outline" onClick={() => sendSeenMutation.mutate()} disabled={!presenceChatId || sendSeenMutation.isPending}>
                        <Eye className="mr-2 h-4 w-4" /> Mark as Read
                      </Button>
                    </div>
                 </div>
              </div>
            </TabsContent>

            {/* LOCATION TAB */}
            <TabsContent value="location" className="mt-0 space-y-6">
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
            </TabsContent>

            {/* CONTACT TAB */}
            <TabsContent value="contact" className="mt-0 space-y-6">
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                 <div className="grid gap-6">
                    <div className="grid gap-2">
                      <Label>Recipient Phone Number</Label>
                      <Input 
                        placeholder="e.g. 6281234567890" 
                        value={contactTo}
                        onChange={(e) => setContactTo(e.target.value)}
                        className="font-mono"
                      />
                    </div>
                    
                    <div className="p-4 border rounded-lg space-y-4 bg-muted/20">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <Contact className="h-4 w-4" /> Contact Card Details
                      </h4>
                      <div className="grid gap-2">
                        <Label>Name</Label>
                        <Input 
                          placeholder="John Doe" 
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Phone Number</Label>
                        <Input 
                          placeholder="628111222333" 
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Organization (Optional)</Label>
                        <Input 
                          placeholder="Zetwa Inc." 
                          value={contactOrg}
                          onChange={(e) => setContactOrg(e.target.value)}
                        />
                      </div>
                    </div>
        
                    <Button 
                      className="w-full" 
                      onClick={() => sendContactMutation.mutate()}
                      disabled={!contactTo || !contactName || !contactPhone || sendContactMutation.isPending}
                    >
                      {sendContactMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Contact className="mr-2 h-4 w-4" />
                      )}
                      Send Contact
                    </Button>
                 </div>
              </div>
            </TabsContent>

            {/* POLL TAB */}
            <TabsContent value="poll" className="mt-0 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Send Poll */}
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                   <h3 className="font-semibold mb-4">Send Poll</h3>
                   <div className="grid gap-6">
                      <div className="grid gap-2">
                        <Label>Phone Number</Label>
                        <Input 
                          placeholder="e.g. 6281234567890" 
                          value={pollTo}
                          onChange={(e) => setPollTo(e.target.value)}
                          className="font-mono"
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label>Poll Question</Label>
                        <Input 
                          placeholder="What is your favorite color?" 
                          value={pollName}
                          onChange={(e) => setPollName(e.target.value)}
                        />
                      </div>
          
                      <div className="space-y-3">
                        <Label>Options</Label>
                        {pollOptions.map((option, index) => (
                          <div key={index} className="flex gap-2">
                            <Input 
                              placeholder={`Option ${index + 1}`}
                              value={option}
                              onChange={(e) => handlePollOptionChange(index, e.target.value)}
                            />
                            {pollOptions.length > 2 && (
                              <Button variant="ghost" size="icon" onClick={() => handleRemovePollOption(index)}>
                                <X className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={handleAddPollOption} className="w-full">
                          <Plus className="mr-2 h-3 w-3" /> Add Option
                        </Button>
                      </div>
          
                      <div className="flex items-center space-x-2 pt-2">
                        <Switch 
                          id="multiple" 
                          checked={pollMultiple}
                          onCheckedChange={setPollMultiple}
                        />
                        <Label htmlFor="multiple">Allow Multiple Answers</Label>
                      </div>
          
                      <Button 
                        className="w-full" 
                        onClick={() => sendPollMutation.mutate()}
                        disabled={!pollTo || !pollName || pollOptions.filter(o => o).length < 2 || sendPollMutation.isPending}
                      >
                        {sendPollMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <BarChart2 className="mr-2 h-4 w-4" />
                        )}
                        Send Poll
                      </Button>
                   </div>
                </div>

                {/* Vote Poll */}
                <div className="rounded-xl border bg-card p-6 shadow-sm h-fit">
                   <h3 className="font-semibold mb-4">Vote on Poll</h3>
                   <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label>Recipient (To)</Label>
                        <Input value={voteTo} onChange={(e) => setVoteTo(e.target.value)} placeholder="e.g. 6281234567890" />
                      </div>
                      <div className="grid gap-2">
                        <Label>Poll Message ID</Label>
                        <Input value={votePollId} onChange={(e) => setVotePollId(e.target.value)} placeholder="Poll Message ID" className="font-mono" />
                      </div>
                      <div className="grid gap-2">
                        <Label>Selected Options (comma separated)</Label>
                        <Input 
                          value={voteOptions.join(',')} 
                          onChange={(e) => setVoteOptions(e.target.value.split(',').map(s => s.trim()).filter(s => s))} 
                          placeholder="Option1, Option2" 
                        />
                        <p className="text-[11px] text-muted-foreground">Enter the option text exactly as it appears in the poll.</p>
                      </div>
                      <Button onClick={() => sendPollVoteMutation.mutate()} disabled={!voteTo || !votePollId || voteOptions.length === 0 || sendPollVoteMutation.isPending}>
                        {sendPollVoteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Cast Vote'}
                      </Button>
                   </div>
                </div>
              </div>
            </TabsContent>

            {/* FORWARD TAB */}
            <TabsContent value="forward" className="mt-0 space-y-6">
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                 <div className="grid gap-6">
                    <div className="grid gap-2">
                      <Label>Message ID</Label>
                      <Input 
                        placeholder="ID of message to forward" 
                        value={forwardMessageId}
                        onChange={(e) => setForwardMessageId(e.target.value)}
                        className="font-mono"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label>Forward To</Label>
                      <Input 
                        placeholder="e.g. 6281234567890" 
                        value={forwardTo}
                        onChange={(e) => setForwardTo(e.target.value)}
                        className="font-mono"
                      />
                    </div>
        
                    <Button 
                      className="w-full" 
                      onClick={() => forwardMessageMutation.mutate()}
                      disabled={!forwardMessageId || !forwardTo || forwardMessageMutation.isPending}
                    >
                      {forwardMessageMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Forward className="mr-2 h-4 w-4" />
                      )}
                      Forward Message
                    </Button>
                 </div>
              </div>
            </TabsContent>

            {/* DELETE TAB */}
            <TabsContent value="delete" className="mt-0 space-y-6">
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                 <div className="grid gap-6">
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Warning</AlertTitle>
                      <AlertDescription>
                        Deleting a message for everyone (Revoke) only works within a limited time window after sending.
                      </AlertDescription>
                    </Alert>
        
                    <div className="grid gap-2">
                      <Label>Message ID</Label>
                      <Input 
                        placeholder="ID of message to delete" 
                        value={deleteMessageId}
                        onChange={(e) => setDeleteMessageId(e.target.value)}
                        className="font-mono"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="forEveryone" 
                        checked={deleteForEveryone}
                        onCheckedChange={(checked) => setDeleteForEveryone(checked as boolean)}
                      />
                      <Label htmlFor="forEveryone" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Delete for everyone (revoke)
                      </Label>
                    </div>
        
                    <Button 
                      className="w-full" 
                      variant="destructive"
                      onClick={() => deleteMessageMutation.mutate()}
                      disabled={!deleteMessageId || deleteMessageMutation.isPending}
                    >
                      {deleteMessageMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Delete Message
                    </Button>
                 </div>
              </div>
            </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
