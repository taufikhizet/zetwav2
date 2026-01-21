import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SetPresenceTab } from './presences/SetPresenceTab'
import { GetPresencesTab } from './presences/GetPresencesTab'
import { GetChatPresenceTab } from './presences/GetChatPresenceTab'
import { SubscribePresenceTab } from './presences/SubscribePresenceTab'

interface PresencesCardProps {
  sessionId: string
}

export function PresencesCard({ sessionId }: PresencesCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Presences</CardTitle>
        <CardDescription>
          Manage session presence and subscriptions (WAHA compatible).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="set" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-4">
            <TabsTrigger value="set">Set Presence</TabsTrigger>
            <TabsTrigger value="get-all">Get All</TabsTrigger>
            <TabsTrigger value="get-chat">Get Chat</TabsTrigger>
            <TabsTrigger value="subscribe">Subscribe</TabsTrigger>
          </TabsList>

          <TabsContent value="set"><SetPresenceTab sessionId={sessionId} /></TabsContent>
          <TabsContent value="get-all"><GetPresencesTab sessionId={sessionId} /></TabsContent>
          <TabsContent value="get-chat"><GetChatPresenceTab sessionId={sessionId} /></TabsContent>
          <TabsContent value="subscribe"><SubscribePresenceTab sessionId={sessionId} /></TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
