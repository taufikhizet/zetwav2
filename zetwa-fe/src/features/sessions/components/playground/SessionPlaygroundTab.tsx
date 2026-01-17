import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { PlaygroundSidebar } from './PlaygroundSidebar'
import { MessagingCard } from './features/MessagingCard'
import { GroupsCard } from './features/GroupsCard'
import { SystemCard } from './features/SystemCard'
import { ContactsCard } from './features/ContactsCard'
import { ChatsCard } from './features/ChatsCard'
import { LabelsCard } from './features/LabelsCard'
import { StatusCard } from './features/StatusCard'
import { type PlaygroundFeatureId } from './constants'
import { WifiOff } from 'lucide-react'

interface SessionPlaygroundTabProps {
  sessionId: string
  isOnline: boolean
}

export function SessionPlaygroundTab({ sessionId, isOnline }: SessionPlaygroundTabProps) {
  const [activeFeature, setActiveFeature] = useState<PlaygroundFeatureId>('messaging')

  if (!isOnline) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 border-2 border-dashed rounded-xl bg-muted/10">
        <div className="p-4 rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-600">
          <WifiOff className="h-8 w-8" />
        </div>
        <div className="max-w-md space-y-2">
          <h3 className="text-lg font-semibold">WhatsApp Disconnected</h3>
          <p className="text-sm text-muted-foreground">
            Connect your session to WhatsApp to access playground features. 
            Please scan the QR code in the Overview tab.
          </p>
        </div>
      </div>
    )
  }

  return (
    <Card className="flex flex-col lg:flex-row overflow-hidden min-h-[600px]">
      {/* Sidebar Navigation */}
      <div className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r bg-muted/10 p-4">
        <PlaygroundSidebar 
          activeFeature={activeFeature} 
          onSelect={setActiveFeature} 
        />
      </div>

      {/* Feature Content */}
      <div className="flex-1 w-full min-w-0">
        {activeFeature === 'messaging' && <MessagingCard sessionId={sessionId} />}
        {activeFeature === 'chats' && <ChatsCard sessionId={sessionId} />}
        {activeFeature === 'contacts' && <ContactsCard sessionId={sessionId} />}
        {activeFeature === 'groups' && <GroupsCard sessionId={sessionId} />}
        {activeFeature === 'labels' && <LabelsCard sessionId={sessionId} />}
        {activeFeature === 'status' && <StatusCard sessionId={sessionId} />}
        {activeFeature === 'system' && <SystemCard sessionId={sessionId} />}
      </div>
    </Card>
  )
}
