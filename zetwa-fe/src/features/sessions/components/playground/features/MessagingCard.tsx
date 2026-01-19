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
import { ReactionTab } from './messaging/ReactionTab'
import { StarTab } from './messaging/StarTab'
import { StartTypingTab } from './messaging/StartTypingTab'
import { StopTypingTab } from './messaging/StopTypingTab'
import { MarkReadTab } from './messaging/MarkReadTab'
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
            <TabsTrigger value="reaction" className="flex-1 min-w-[70px]">Reaction</TabsTrigger>
            <TabsTrigger value="star" className="flex-1 min-w-[70px]">Star</TabsTrigger>
            <TabsTrigger value="start-typing" className="flex-1 min-w-[90px]">Start Typing</TabsTrigger>
            <TabsTrigger value="stop-typing" className="flex-1 min-w-[90px]">Stop Typing</TabsTrigger>
            <TabsTrigger value="mark-read" className="flex-1 min-w-[70px]">Mark Read</TabsTrigger>
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

            {/* REACTION TAB */}
            <TabsContent value="reaction" className="mt-0 space-y-6">
              <ReactionTab sessionId={sessionId} />
            </TabsContent>

            {/* STAR TAB */}
            <TabsContent value="star" className="mt-0 space-y-6">
              <StarTab sessionId={sessionId} />
            </TabsContent>

            {/* START TYPING TAB */}
            <TabsContent value="start-typing" className="mt-0 space-y-6">
              <StartTypingTab sessionId={sessionId} />
            </TabsContent>

            {/* STOP TYPING TAB */}
            <TabsContent value="stop-typing" className="mt-0 space-y-6">
              <StopTypingTab sessionId={sessionId} />
            </TabsContent>

            {/* MARK READ TAB */}
            <TabsContent value="mark-read" className="mt-0 space-y-6">
              <MarkReadTab sessionId={sessionId} />
            </TabsContent>

            {/* FORWARD TAB */}
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
