import { useState } from 'react'
import { Contact2 } from 'lucide-react'

import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { ContactListTab } from './contacts/ContactListTab'
import { ContactInfoTab } from './contacts/ContactInfoTab'
import { CheckExistsTab } from './contacts/CheckExistsTab'
import { ContactAboutTab } from './contacts/ContactAboutTab'
import { ContactProfilePictureTab } from './contacts/ContactProfilePictureTab'
import { BlockContactTab } from './contacts/BlockContactTab'
import { CreateContactTab } from './contacts/CreateContactTab'
import { LIDListTab } from './contacts/LIDListTab'
import { LIDLookupTab } from './contacts/LIDLookupTab'

interface ContactsCardProps {
  sessionId: string
}

export function ContactsCard({ sessionId }: ContactsCardProps) {
  const [activeTab, setActiveTab] = useState('list')

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
              <CardDescription>Manage contacts, check numbers, and handle LIDs</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="flex w-full flex-wrap h-auto gap-1 bg-muted/50 p-1 justify-start">
            <TabsTrigger value="list" className="flex-1 min-w-[90px]">All Contacts</TabsTrigger>
            <TabsTrigger value="info" className="flex-1 min-w-[90px]">Get Contact</TabsTrigger>
            <TabsTrigger value="check" className="flex-1 min-w-[90px]">Check Exists</TabsTrigger>
            <TabsTrigger value="about" className="flex-1 min-w-[90px]">Get About</TabsTrigger>
            <TabsTrigger value="profile-pic" className="flex-1 min-w-[90px]">Profile Pic</TabsTrigger>
            <TabsTrigger value="block" className="flex-1 min-w-[90px]">Block/Unblock</TabsTrigger>
            <TabsTrigger value="create" className="flex-1 min-w-[90px]">Create Contact</TabsTrigger>
            <TabsTrigger value="lids" className="flex-1 min-w-[90px]">LID List</TabsTrigger>
            <TabsTrigger value="lid-lookup" className="flex-1 min-w-[90px]">LID Lookup</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <TabsContent value="list" className="mt-0 space-y-6">
            <ContactListTab sessionId={sessionId} />
          </TabsContent>

          <TabsContent value="info" className="mt-0 space-y-6">
            <ContactInfoTab sessionId={sessionId} />
          </TabsContent>

          <TabsContent value="check" className="mt-0 space-y-6">
            <CheckExistsTab sessionId={sessionId} />
          </TabsContent>

          <TabsContent value="about" className="mt-0 space-y-6">
            <ContactAboutTab sessionId={sessionId} />
          </TabsContent>

          <TabsContent value="profile-pic" className="mt-0 space-y-6">
            <ContactProfilePictureTab sessionId={sessionId} />
          </TabsContent>

          <TabsContent value="block" className="mt-0 space-y-6">
            <BlockContactTab sessionId={sessionId} />
          </TabsContent>

          <TabsContent value="create" className="mt-0 space-y-6">
            <CreateContactTab sessionId={sessionId} />
          </TabsContent>

          <TabsContent value="lids" className="mt-0 space-y-6">
            <LIDListTab sessionId={sessionId} />
          </TabsContent>

          <TabsContent value="lid-lookup" className="mt-0 space-y-6">
            <LIDLookupTab sessionId={sessionId} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
