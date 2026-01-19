import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { 
  Contact2, 
  Search, 
  User, 
  Check, 
  X, 
  Loader2, 
  RefreshCw, 
  Ban, 
  ShieldCheck, 
  Info,
  Phone,
  MoreVertical
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
} from "@/components/ui/dialog"
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../ApiExample'

interface ContactsCardProps {
  sessionId: string
}

export function ContactsCard({ sessionId }: ContactsCardProps) {
  const [activeTab, setActiveTab] = useState('list')
  const [checkNumber, setCheckNumber] = useState('')
  const [debouncedCheckNumber, setDebouncedCheckNumber] = useState('')
  const [searchContact, setSearchContact] = useState('')
  const [viewContactId, setViewContactId] = useState<string | null>(null)

  // Get Contacts Query
  const { data: contacts, isLoading: isLoadingContacts, refetch: refetchContacts } = useQuery({
    queryKey: ['contacts', sessionId],
    queryFn: () => sessionApi.getContacts(sessionId),
    enabled: activeTab === 'list',
  })

  // Get Contact About Query
  const { data: contactAbout, isLoading: isLoadingAbout } = useQuery({
    queryKey: ['contact-about', sessionId, viewContactId],
    queryFn: () => sessionApi.getContactAbout(sessionId, viewContactId!),
    enabled: !!viewContactId,
  })

  // Get Contact Profile Pic Query
  const { data: contactProfilePic } = useQuery({
    queryKey: ['contact-profile-pic', sessionId, viewContactId],
    queryFn: () => sessionApi.getContactProfilePicture(sessionId, viewContactId!),
    enabled: !!viewContactId,
  })

  // Get Me Query
  const { data: meInfo, isLoading: isLoadingMe } = useQuery({
    queryKey: ['me', sessionId],
    queryFn: () => sessionApi.getMe(sessionId),
    enabled: activeTab === 'profile',
  })

  // Check Number Query
  const { data: numberStatus, isLoading: isCheckingNumber, isError: isCheckError } = useQuery({
    queryKey: ['check-number', sessionId, debouncedCheckNumber],
    queryFn: () => sessionApi.checkNumber(sessionId, debouncedCheckNumber),
    enabled: !!debouncedCheckNumber && activeTab === 'check',
    retry: false,
  })

  // Block Contact Mutation
  const blockMutation = useMutation({
    mutationFn: ({ contactId, block }: { contactId: string; block: boolean }) =>
      sessionApi.blockContact(sessionId, contactId, block),
    onSuccess: (_, variables) => {
      toast.success(variables.block ? 'Contact blocked' : 'Contact unblocked')
      refetchContacts()
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update block status')
    }
  })

  const handleCheckNumber = () => {
    if (checkNumber) {
      setDebouncedCheckNumber(checkNumber)
    }
  }

  const filteredContacts = contacts?.filter((contact: any) => {
    if (!searchContact) return true
    const search = searchContact.toLowerCase()
    return (
      contact.name?.toLowerCase().includes(search) ||
      contact.pushname?.toLowerCase().includes(search) ||
      contact.number?.includes(search)
    )
  })

  const selectedContact = contacts?.find((c: any) => c.id._serialized === viewContactId)

  return (
    <div className="h-full flex flex-col space-y-4">
      <CardHeader className="px-0 pt-0 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Contact2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Contacts</CardTitle>
              <CardDescription>Manage contacts and verify numbers</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="list">All Contacts</TabsTrigger>
            <TabsTrigger value="check">Check Number</TabsTrigger>
            <TabsTrigger value="profile">My Profile</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="list" className="flex-1 flex flex-col min-h-0 space-y-4 mt-0">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                value={searchContact}
                onChange={(e) => setSearchContact(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => refetchContacts()} disabled={isLoadingContacts}>
              <RefreshCw className={`h-4 w-4 ${isLoadingContacts ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <div className="rounded-xl border bg-card flex-1 min-h-0 overflow-hidden flex flex-col shadow-sm">
             <ScrollArea className="flex-1">
                {isLoadingContacts ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
                    <p>Loading contacts...</p>
                  </div>
                ) : filteredContacts && filteredContacts.length > 0 ? (
                  <div className="divide-y">
                    {filteredContacts.map((contact: any) => (
                      <div key={contact.id._serialized} className="p-3 hover:bg-muted/50 transition-all flex items-center justify-between group">
                        <div className="flex items-center gap-3 cursor-pointer flex-1 overflow-hidden" onClick={() => setViewContactId(contact.id._serialized)}>
                          <Avatar className="h-10 w-10 border">
                            <AvatarImage src={contact.profilePicUrl} />
                            <AvatarFallback className="bg-primary/5 text-primary"><User className="h-5 w-5" /></AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium flex items-center gap-2 truncate">
                              {contact.name || contact.pushname || contact.number}
                              {contact.isBlocked && <Badge variant="destructive" className="text-[10px] h-4 px-1 rounded-sm">Blocked</Badge>}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                               <Phone className="h-3 w-3" /> +{contact.number}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1 mr-1">
                            {contact.isBusiness && <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal">Business</Badge>}
                            {contact.isMyContact && <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">Saved</Badge>}
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setViewContactId(contact.id._serialized)}>
                                <Info className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => blockMutation.mutate({ 
                                  contactId: contact.id._serialized, 
                                  block: !contact.isBlocked 
                                })}
                                className={contact.isBlocked ? "text-green-600 focus:text-green-700 focus:bg-green-50" : "text-destructive focus:text-destructive focus:bg-destructive/10"}
                              >
                                {contact.isBlocked ? (
                                  <>
                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                    Unblock Contact
                                  </>
                                ) : (
                                  <>
                                    <Ban className="mr-2 h-4 w-4" />
                                    Block Contact
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                    <div className="bg-muted p-4 rounded-full mb-3">
                      <Contact2 className="h-8 w-8 opacity-20" />
                    </div>
                    <p className="font-medium">No contacts found</p>
                  </div>
                )}
             </ScrollArea>
          </div>

          <ApiExample 
            method="GET" 
            url={`/api/sessions/${sessionId}/contacts`}
            description="Get all contacts from the database."
            responseExample={[
              {
                "id": { "_serialized": "628123...@c.us" },
                "number": "628123...",
                "name": "John Doe",
                "isBusiness": false,
                "isBlocked": false
              }
            ]}
            responseDescription="Returns a list of contact objects."
          />
        </TabsContent>

        <TabsContent value="check" className="space-y-6 mt-0">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
             <div className="flex gap-3 items-end">
               <div className="grid gap-2 flex-1">
                 <Label>Phone Number</Label>
                 <Input 
                   placeholder="e.g. 6281234567890" 
                   value={checkNumber}
                   onChange={(e) => setCheckNumber(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleCheckNumber()}
                   className="h-10"
                 />
               </div>
               <Button onClick={handleCheckNumber} disabled={!checkNumber || isCheckingNumber} className="h-10 px-6">
                 {isCheckingNumber ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                 <span className="ml-2">Check</span>
               </Button>
             </div>
             
             <div className="mt-6 p-6 rounded-xl border bg-muted/30 min-h-[160px] flex items-center justify-center">
               {!debouncedCheckNumber ? (
                 <div className="text-center text-muted-foreground">
                    <Search className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Enter a phone number to verify its WhatsApp registration status.</p>
                 </div>
               ) : isCheckingNumber ? (
                 <div className="flex flex-col items-center gap-3">
                   <Loader2 className="h-8 w-8 animate-spin text-primary" />
                   <p className="text-sm text-muted-foreground font-medium">Checking WhatsApp servers...</p>
                 </div>
               ) : isCheckError ? (
                 <div className="flex flex-col items-center gap-2 text-destructive">
                   <div className="p-3 bg-destructive/10 rounded-full">
                      <X className="h-6 w-6" />
                   </div>
                   <p className="text-sm font-medium mt-2">Failed to check number</p>
                 </div>
               ) : numberStatus ? (
                 <div className="flex flex-col items-center gap-4 w-full animate-in fade-in zoom-in duration-300">
                   <div className={`p-4 rounded-full ${numberStatus.numberExists ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                     {numberStatus.numberExists ? <Check className="h-8 w-8" /> : <X className="h-8 w-8" />}
                   </div>
                   <div className="text-center space-y-1">
                     <h4 className="font-bold text-xl">
                       {numberStatus.numberExists ? 'Registered on WhatsApp' : 'Not Registered'}
                     </h4>
                     <p className="text-sm text-muted-foreground font-mono">
                       {debouncedCheckNumber}
                     </p>
                     {numberStatus.numberExists && (
                       <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-background border rounded-full text-xs font-mono text-muted-foreground shadow-sm">
                         <span>JID:</span>
                         <span className="select-all text-foreground">{numberStatus.id?._serialized}</span>
                       </div>
                     )}
                   </div>
                 </div>
               ) : null}
             </div>
          </div>

          <ApiExample 
            method="GET" 
            url={`/api/sessions/${sessionId}/check-number/${checkNumber || '{number}'}`}
            description="Verify if a phone number is registered on WhatsApp."
            responseExample={{
              "numberExists": true,
              "id": { "_serialized": "628123...@c.us" }
            }}
            responseDescription="Returns the registration status."
          />
        </TabsContent>

        <TabsContent value="profile" className="space-y-6 mt-0">
          {isLoadingMe ? (
            <div className="flex items-center justify-center h-[300px]">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : meInfo ? (
            <div className="rounded-xl border bg-card p-8 shadow-sm flex flex-col items-center gap-6 relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent h-32 z-0" />
               
              <Avatar className="h-32 w-32 border-4 border-background shadow-lg z-10">
                <AvatarImage src={meInfo.profilePicUrl} />
                <AvatarFallback className="text-4xl bg-primary/10 text-primary"><User /></AvatarFallback>
              </Avatar>
              
              <div className="text-center space-y-2 z-10 max-w-md">
                <h3 className="text-2xl font-bold">{meInfo.pushName || 'Unknown Name'}</h3>
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                   <Phone className="h-4 w-4" />
                   <p className="font-mono">{meInfo.phoneNumber}</p>
                </div>
                <div className="pt-2">
                   <Badge variant="outline" className="font-mono text-xs font-normal text-muted-foreground">
                      {meInfo.id}
                   </Badge>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground border rounded-xl bg-muted/10">
              Could not load profile information.
            </div>
          )}

          <ApiExample 
            method="GET" 
            url={`/api/sessions/${sessionId}/me`}
            description="Get information about the authenticated account."
            responseExample={{
              "pushName": "My Name",
              "id": "628123...@c.us",
              "profilePicUrl": "https://..."
            }}
            responseDescription="Returns account profile information."
          />
        </TabsContent>
      </Tabs>

      <Dialog open={!!viewContactId} onOpenChange={(open) => !open && setViewContactId(null)}>
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden gap-0">
          <div className="bg-muted/30 p-6 flex flex-col items-center gap-4 border-b">
            <Avatar className="h-24 w-24 border-4 border-background shadow-sm">
              <AvatarImage src={contactProfilePic || selectedContact?.profilePicUrl} />
              <AvatarFallback className="text-2xl"><User /></AvatarFallback>
            </Avatar>
            <div className="text-center">
               <h3 className="text-xl font-bold">{selectedContact?.name || selectedContact?.pushname || selectedContact?.number}</h3>
               <p className="text-sm text-muted-foreground font-mono">+{selectedContact?.number}</p>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
             <div className="space-y-2">
               <Label className="text-xs text-muted-foreground uppercase tracking-wider">Status / About</Label>
               <div className="text-sm bg-muted/30 p-3 rounded-lg border">
                  {isLoadingAbout ? (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" /> Loading...
                    </span>
                  ) : contactAbout || <span className="text-muted-foreground italic">No status available</span>}
               </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1.5">
                 <Label className="text-xs text-muted-foreground uppercase tracking-wider">Contact ID</Label>
                 <div className="font-mono text-xs p-2 bg-muted/30 rounded border truncate select-all" title={selectedContact?.id._serialized}>
                    {selectedContact?.id._serialized}
                 </div>
               </div>
               <div className="space-y-1.5">
                 <Label className="text-xs text-muted-foreground uppercase tracking-wider">Type</Label>
                 <div className="text-sm p-2 bg-muted/30 rounded border">
                    {selectedContact?.isBusiness ? 'Business Account' : 'Personal Account'}
                 </div>
               </div>
             </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
