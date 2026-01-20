
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Contact2, Loader2, RefreshCw, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'

interface ContactListTabProps {
  sessionId: string
}

export function ContactListTab({ sessionId }: ContactListTabProps) {
  const [searchContact, setSearchContact] = useState('')

  const { data: contacts, isLoading, refetch } = useQuery({
    queryKey: ['contacts', sessionId],
    queryFn: () => sessionApi.getContacts(sessionId),
  })

  const filteredContacts = contacts?.filter((contact: any) => {
    if (!searchContact) return true
    const search = searchContact.toLowerCase()
    return (
      contact.name?.toLowerCase().includes(search) ||
      contact.pushname?.toLowerCase().includes(search) ||
      contact.number?.includes(search)
    )
  })

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                value={searchContact}
                onChange={(e) => setSearchContact(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
        </div>

        <div className="rounded-xl border bg-card h-[400px] overflow-hidden flex flex-col shadow-sm">
            <ScrollArea className="flex-1">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
                    <p>Loading contacts...</p>
                  </div>
                ) : filteredContacts && filteredContacts.length > 0 ? (
                  <div className="divide-y">
                    {filteredContacts.map((contact: any) => (
                      <div key={contact.id._serialized} className="p-3 hover:bg-muted/50 transition-all flex items-center justify-between group">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="min-w-0 flex-1">
                            <div className="font-medium flex items-center gap-2 truncate">
                              {contact.name || contact.pushname || contact.number}
                              {contact.isBlocked && <Badge variant="destructive" className="text-[10px] h-4 px-1 rounded-sm">Blocked</Badge>}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                               {contact.number}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {contact.isBusiness && <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal">Business</Badge>}
                            {contact.isMyContact && <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">Saved</Badge>}
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
      </div>

      <ApiExample 
        method="GET" 
        url={`/api/sessions/${sessionId}/contacts/all`}
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
    </div>
  )
}
