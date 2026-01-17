import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Send, Image, Loader2, Forward, Trash2, MapPin, Contact, BarChart2, Plus, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../ApiExample'

interface MessagingCardProps {
  sessionId: string
}

export function MessagingCard({ sessionId }: MessagingCardProps) {
  const [activeTab, setActiveTab] = useState('text')
  
  // Text Message State
  const [textTo, setTextTo] = useState('')
  const [textBody, setTextBody] = useState('')

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

  const sendTextMutation = useMutation({
    mutationFn: () => sessionApi.sendMessage(sessionId, { to: textTo, message: textBody }),
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
      description: locationDesc
    }),
    onSuccess: () => {
      toast.success('Location sent successfully')
      setLocationDesc('')
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

  const handleAddPollOption = () => {
    setPollOptions([...pollOptions, ''])
  }

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

  return (
    <div className="h-full">
      <CardHeader>
        <CardTitle>Messaging</CardTitle>
        <CardDescription>Send, forward, and manage messages.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-2">
            <TabsTrigger value="text">Text</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
          </TabsList>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="poll">Poll</TabsTrigger>
            <TabsTrigger value="forward">Forward</TabsTrigger>
            <TabsTrigger value="delete">Delete</TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4">
            <div className="grid gap-2">
              <Label>Phone Number</Label>
              <Input 
                placeholder="e.g. 6281234567890" 
                value={textTo}
                onChange={(e) => setTextTo(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">Include country code without + or spaces.</p>
            </div>
            
            <div className="grid gap-2">
              <Label>Message</Label>
              <Textarea 
                placeholder="Type your message..." 
                className="min-h-[100px]"
                value={textBody}
                onChange={(e) => setTextBody(e.target.value)}
              />
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
              Send Text
            </Button>

            <ApiExample 
              method="POST" 
              url={`/api/sessions/${sessionId}/messages/send`}
              body={{
                to: textTo || "6281234567890",
                message: textBody || "Hello from API!"
              }}
            />
          </TabsContent>

          <TabsContent value="media" className="space-y-4">
            <div className="grid gap-2">
              <Label>Phone Number</Label>
              <Input 
                placeholder="e.g. 6281234567890" 
                value={mediaTo}
                onChange={(e) => setMediaTo(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>Media URL</Label>
              <Input 
                placeholder="https://example.com/image.jpg" 
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
              />
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

            <ApiExample 
              method="POST" 
              url={`/api/sessions/${sessionId}/messages/send-media`}
              body={{
                to: mediaTo || "6281234567890",
                mediaUrl: mediaUrl || "https://example.com/image.jpg",
                caption: mediaCaption || "Look at this!"
              }}
            />
          </TabsContent>

          <TabsContent value="location" className="space-y-4">
            <div className="grid gap-2">
              <Label>Phone Number</Label>
              <Input 
                placeholder="e.g. 6281234567890" 
                value={locationTo}
                onChange={(e) => setLocationTo(e.target.value)}
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

            <ApiExample 
              method="POST" 
              url={`/api/sessions/${sessionId}/messages/send-location`}
              body={{
                to: locationTo || "6281234567890",
                latitude: parseFloat(latitude) || -6.2,
                longitude: parseFloat(longitude) || 106.8,
                description: locationDesc || "Jakarta"
              }}
            />
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <div className="grid gap-2">
              <Label>Phone Number (Recipient)</Label>
              <Input 
                placeholder="e.g. 6281234567890" 
                value={contactTo}
                onChange={(e) => setContactTo(e.target.value)}
              />
            </div>
            
            <div className="p-4 border rounded-md space-y-4 bg-muted/20">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Contact className="h-4 w-4" /> Contact Details
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

            <ApiExample 
              method="POST" 
              url={`/api/sessions/${sessionId}/messages/send-contact`}
              body={{
                to: contactTo || "6281234567890",
                contact: {
                  name: contactName || "John Doe",
                  phone: contactPhone || "628111222333",
                  organization: contactOrg || "Zetwa Inc."
                }
              }}
            />
          </TabsContent>

          <TabsContent value="poll" className="space-y-4">
            <div className="grid gap-2">
              <Label>Phone Number</Label>
              <Input 
                placeholder="e.g. 6281234567890" 
                value={pollTo}
                onChange={(e) => setPollTo(e.target.value)}
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

            <div className="space-y-2">
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

            <ApiExample 
              method="POST" 
              url={`/api/sessions/${sessionId}/messages/send-poll`}
              body={{
                to: pollTo || "6281234567890",
                poll: {
                  name: pollName || "Question?",
                  options: pollOptions.filter(o => o) || ["Yes", "No"],
                  multipleAnswers: pollMultiple
                }
              }}
            />
          </TabsContent>

          <TabsContent value="forward" className="space-y-4">
            <div className="grid gap-2">
              <Label>Message ID</Label>
              <Input 
                placeholder="ID of message to forward" 
                value={forwardMessageId}
                onChange={(e) => setForwardMessageId(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Forward To</Label>
              <Input 
                placeholder="e.g. 6281234567890" 
                value={forwardTo}
                onChange={(e) => setForwardTo(e.target.value)}
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

            <ApiExample 
              method="POST" 
              url={`/api/sessions/${sessionId}/messages/forward`}
              body={{
                messageId: forwardMessageId || "false_000000@c.us_3EB0...",
                to: forwardTo || "6281234567890"
              }}
            />
          </TabsContent>

          <TabsContent value="delete" className="space-y-4">
            <div className="grid gap-2">
              <Label>Message ID</Label>
              <Input 
                placeholder="ID of message to delete" 
                value={deleteMessageId}
                onChange={(e) => setDeleteMessageId(e.target.value)}
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

            <ApiExample 
              method="DELETE" 
              url={`/api/sessions/${sessionId}/messages/${deleteMessageId || 'false_000000@c.us_3EB0...'}`}
              description="Delete a message. Add ?forEveryone=true to revoke it."
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </div>
  )
}
