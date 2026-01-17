import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Contact2, Search, User, Check, X, Loader2, RefreshCw, Ban, ShieldCheck, Info } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
    <div className="h-full">
      <CardHeader>
        <CardTitle>Contacts</CardTitle>
        <CardDescription>Manage contacts, check numbers, and view profile.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="list">All Contacts</TabsTrigger>
            <TabsTrigger value="check">Check Number</TabsTrigger>
            <TabsTrigger value="profile">My Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contacts..."
                  value={searchContact}
                  onChange={(e) => setSearchContact(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => refetchContacts()} disabled={isLoadingContacts}>
                <RefreshCw className={`h-4 w-4 ${isLoadingContacts ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            <div className="rounded-md border h-[400px] overflow-hidden">
              <div className="h-full overflow-y-auto">
                {isLoadingContacts ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mb-2" />
                    <p>Loading contacts...</p>
                  </div>
                ) : filteredContacts && filteredContacts.length > 0 ? (
                  <div className="divide-y">
                    {filteredContacts.map((contact: any) => (
                      <div key={contact.id._serialized} className="p-3 hover:bg-muted/50 transition-colors flex items-center justify-between group">
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setViewContactId(contact.id._serialized)}>
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={contact.profilePicUrl} />
                            <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {contact.name || contact.pushname || contact.number}
                              {contact.isBlocked && <Badge variant="destructive" className="text-[10px] h-4 px-1">Blocked</Badge>}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">+{contact.number}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1 mr-2">
                            {contact.isBusiness && <Badge variant="outline" className="text-[10px]">Business</Badge>}
                            {contact.isMyContact && <Badge variant="secondary" className="text-[10px]">Saved</Badge>}
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="sr-only">Open menu</span>
                                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4"><path d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
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
                                className={contact.isBlocked ? "text-green-600" : "text-destructive"}
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
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Contact2 className="h-8 w-8 mb-2 opacity-20" />
                    <p>No contacts found</p>
                  </div>
                )}
              </div>
            </div>

            <ApiExample 
              method="GET" 
              url={`/api/sessions/${sessionId}/contacts`}
              description="Get all contacts from the database."
            />
          </TabsContent>

          <TabsContent value="check" className="space-y-4">
            <div className="flex gap-2 items-end">
              <div className="grid gap-2 flex-1">
                <Label>Phone Number</Label>
                <Input 
                  placeholder="e.g. 6281234567890" 
                  value={checkNumber}
                  onChange={(e) => setCheckNumber(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCheckNumber()}
                />
              </div>
              <Button onClick={handleCheckNumber} disabled={!checkNumber || isCheckingNumber}>
                {isCheckingNumber ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span className="ml-2">Check</span>
              </Button>
            </div>
            
            <div className="p-4 rounded-lg border bg-muted/30 min-h-[100px] flex items-center justify-center">
              {!debouncedCheckNumber ? (
                <p className="text-sm text-muted-foreground">Enter a number to verify if it's registered on WhatsApp.</p>
              ) : isCheckingNumber ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Checking WhatsApp servers...</p>
                </div>
              ) : isCheckError ? (
                <div className="flex flex-col items-center gap-2 text-destructive">
                  <X className="h-6 w-6" />
                  <p className="text-sm font-medium">Failed to check number</p>
                </div>
              ) : numberStatus ? (
                <div className="flex flex-col items-center gap-3 w-full">
                  <div className={`p-3 rounded-full ${numberStatus.numberExists ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {numberStatus.numberExists ? <Check className="h-6 w-6" /> : <X className="h-6 w-6" />}
                  </div>
                  <div className="text-center">
                    <h4 className="font-semibold text-lg">
                      {numberStatus.numberExists ? 'Registered' : 'Not Registered'}
                    </h4>
                    <p className="text-sm text-muted-foreground font-mono mt-1">
                      {debouncedCheckNumber}
                    </p>
                    {numberStatus.numberExists && (
                      <div className="mt-2 text-xs bg-background border px-2 py-1 rounded">
                        JID: <span className="font-mono">{numberStatus.id?._serialized}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <ApiExample 
              method="GET" 
              url={`/api/sessions/${sessionId}/check-number/${checkNumber || '{number}'}`}
              description="Verify if a phone number is registered on WhatsApp."
            />
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            {isLoadingMe ? (
              <div className="flex items-center justify-center h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : meInfo ? (
              <div className="flex flex-col items-center gap-4 py-6 border rounded-lg bg-muted/10">
                <Avatar className="h-24 w-24 border-4 border-background shadow-sm">
                  <AvatarImage src={meInfo.profilePicUrl} />
                  <AvatarFallback className="text-2xl"><User /></AvatarFallback>
                </Avatar>
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-bold">{meInfo.pushName || 'Unknown Name'}</h3>
                  <p className="text-sm text-muted-foreground font-mono">+{meInfo.phoneNumber}</p>
                  <p className="text-xs text-muted-foreground/60 font-mono">{meInfo.id}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                Could not load profile information.
              </div>
            )}

            <ApiExample 
              method="GET" 
              url={`/api/sessions/${sessionId}/me`}
              description="Get information about the authenticated account."
            />
          </TabsContent>
        </Tabs>
      </CardContent>

      <Dialog open={!!viewContactId} onOpenChange={(open) => !open && setViewContactId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Contact Details</DialogTitle>
            <DialogDescription>
              View detailed information about this contact.
            </DialogDescription>
          </DialogHeader>
          
          {selectedContact && (
            <div className="flex flex-col items-center gap-6 py-4">
              <Avatar className="h-32 w-32 border-4 border-background shadow-sm">
                <AvatarImage src={contactProfilePic || selectedContact.profilePicUrl} />
                <AvatarFallback className="text-4xl"><User /></AvatarFallback>
              </Avatar>

              <div className="text-center w-full space-y-4">
                <div>
                  <h3 className="text-xl font-bold">{selectedContact.name || selectedContact.pushname || selectedContact.number}</h3>
                  <p className="text-sm text-muted-foreground font-mono">+{selectedContact.number}</p>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg text-left w-full space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status/About:</span>
                  </div>
                  <p className="text-sm font-medium">
                    {isLoadingAbout ? (
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" /> Loading...
                      </span>
                    ) : contactAbout || <span className="text-muted-foreground italic">No status available</span>}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 w-full text-xs">
                  <div className="p-2 border rounded bg-background">
                    <span className="text-muted-foreground block mb-1">ID</span>
                    <span className="font-mono truncate block" title={selectedContact.id._serialized}>
                      {selectedContact.id._serialized}
                    </span>
                  </div>
                  <div className="p-2 border rounded bg-background">
                    <span className="text-muted-foreground block mb-1">Type</span>
                    <span>{selectedContact.isBusiness ? 'Business' : 'Personal'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
