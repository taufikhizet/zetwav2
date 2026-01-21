import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RejectCallTab } from "./calls/RejectCallTab"

interface CallsCardProps {
  sessionId: string
}

export function CallsCard({ sessionId }: CallsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Calls</CardTitle>
        <CardDescription>
          Manage WhatsApp calls. Currently supports rejecting incoming calls.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="reject" className="w-full">
          <TabsList className="grid w-full grid-cols-1 mb-4">
            <TabsTrigger value="reject">Reject Call</TabsTrigger>
          </TabsList>
          
          <TabsContent value="reject">
            <RejectCallTab sessionId={sessionId} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
