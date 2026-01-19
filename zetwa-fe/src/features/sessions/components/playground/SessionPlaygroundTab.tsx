import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { PlaygroundSidebar } from './PlaygroundSidebar'
import { MessagingCard } from './features/MessagingCard'
import { GroupsCard } from './features/GroupsCard'
import { TestGroupsCard } from './features/TestGroupsCard'
import { SystemCard } from './features/SystemCard'
import { ContactsCard } from './features/ContactsCard'
import { ChatsCard } from './features/ChatsCard'
import { LabelsCard } from './features/LabelsCard'
import { StatusCard } from './features/StatusCard'
import { type PlaygroundFeatureId } from './constants'
import { WifiOff, Zap } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

interface SessionPlaygroundTabProps {
  sessionId: string
  isOnline: boolean
}

export function SessionPlaygroundTab({ sessionId, isOnline }: SessionPlaygroundTabProps) {
  const [activeFeature, setActiveFeature] = useState<PlaygroundFeatureId>('messaging')

  if (!isOnline) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 border border-dashed rounded-xl bg-muted/5">
        <div className="relative">
          <div className="absolute inset-0 bg-orange-100 dark:bg-orange-900/20 blur-xl rounded-full" />
          <div className="relative p-6 rounded-full bg-background border shadow-sm">
            <WifiOff className="h-10 w-10 text-orange-500" />
          </div>
        </div>
        <div className="max-w-md space-y-2">
          <h3 className="text-xl font-semibold tracking-tight">Session Disconnected</h3>
          <p className="text-muted-foreground leading-relaxed">
            Connect your WhatsApp session to access the playground features. 
            Scan the QR code in the Overview tab to get started.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">API Playground</h2>
          <p className="text-sm text-muted-foreground">
            Test and interact with WhatsApp features in real-time.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          System Online
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:items-start">
        {/* Sidebar Navigation */}
        <Card className="p-2 h-auto lg:sticky lg:top-24 shadow-sm border-muted">
          <div className="px-4 py-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Zap className="h-4 w-4" />
            <span>Available Features</span>
          </div>
          <Separator className="mb-2 mx-2 w-auto" />
          <PlaygroundSidebar 
            activeFeature={activeFeature} 
            onSelect={setActiveFeature} 
          />
        </Card>

        {/* Feature Content */}
        <div className="min-w-0 space-y-4">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeFeature === 'messaging' && <MessagingCard sessionId={sessionId} />}
            {activeFeature === 'chats' && <ChatsCard sessionId={sessionId} />}
            {activeFeature === 'contacts' && <ContactsCard sessionId={sessionId} />}
            {activeFeature === 'groups' && <GroupsCard sessionId={sessionId} />}
            {activeFeature === 'test-groups' && <TestGroupsCard sessionId={sessionId} />}
            {activeFeature === 'labels' && <LabelsCard sessionId={sessionId} />}
            {activeFeature === 'status' && <StatusCard sessionId={sessionId} />}
            {activeFeature === 'system' && <SystemCard sessionId={sessionId} />}
          </div>
        </div>
      </div>
    </div>
  )
}
