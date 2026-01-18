import { useState } from 'react'
import { MessageSquare } from 'lucide-react'

import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { TextTab } from './messaging/TextTab'
import { MediaTab } from './messaging/MediaTab'
import { LocationTab } from './messaging/LocationTab'
import { ContactTab } from './messaging/ContactTab'
import { PollTab } from './messaging/PollTab'
import { PollVoteTab } from './messaging/PollVoteTab'
import { ButtonsTab } from './messaging/ButtonsTab'
import { ListTab } from './messaging/ListTab'
import { ReactionTab } from './messaging/ReactionTab'
import { PresenceTab } from './messaging/PresenceTab'
import { ForwardTab } from './messaging/ForwardTab'
import { DeleteTab } from './messaging/DeleteTab'

interface MessagingCardProps {
  sessionId: string
}

export function MessagingCard({ sessionId }: MessagingCardProps) {
  const [activeTab, setActiveTab] = useState('text')
  
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
            <TabsTrigger value="vote" className="flex-1 min-w-[70px]">Vote</TabsTrigger>
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
              <TextTab sessionId={sessionId} />
            </TabsContent>

            {/* MEDIA TAB */}
            <TabsContent value="media" className="mt-0 space-y-6">
              <MediaTab sessionId={sessionId} />
            </TabsContent>

            {/* BUTTONS TAB */}
            <TabsContent value="buttons" className="mt-0 space-y-6">
              <ButtonsTab sessionId={sessionId} />
            </TabsContent>

            {/* LIST TAB */}
            <TabsContent value="list" className="mt-0 space-y-6">
              <ListTab sessionId={sessionId} />
            </TabsContent>

            {/* REACTION & STAR TAB */}
            <TabsContent value="reaction" className="mt-0 space-y-6">
              <ReactionTab sessionId={sessionId} />
            </TabsContent>

            {/* PRESENCE TAB */}
            <TabsContent value="presence" className="mt-0 space-y-6">
              <PresenceTab sessionId={sessionId} />
            </TabsContent>

            {/* LOCATION TAB */}
            <TabsContent value="location" className="mt-0 space-y-6">
              <LocationTab sessionId={sessionId} />
            </TabsContent>

            {/* CONTACT TAB */}
            <TabsContent value="contact" className="mt-0 space-y-6">
              <ContactTab sessionId={sessionId} />
            </TabsContent>

            {/* POLL TAB */}
            <TabsContent value="poll" className="mt-0 space-y-6">
              <PollTab sessionId={sessionId} />
            </TabsContent>

            {/* VOTE TAB */}
            <TabsContent value="vote" className="mt-0 space-y-6">
              <PollVoteTab sessionId={sessionId} />
            </TabsContent>

            {/* FORWARD TAB */}
            <TabsContent value="forward" className="mt-0 space-y-6">
              <ForwardTab sessionId={sessionId} />
            </TabsContent>

            {/* DELETE TAB */}
            <TabsContent value="delete" className="mt-0 space-y-6">
              <DeleteTab sessionId={sessionId} />
            </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
