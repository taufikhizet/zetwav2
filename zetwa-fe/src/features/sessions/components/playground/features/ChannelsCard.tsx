import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ListChannelsTab } from "./channels/ListChannelsTab"
import { CreateChannelTab } from "./channels/CreateChannelTab"
import { DeleteChannelTab } from "./channels/DeleteChannelTab"
import { GetChannelTab } from "./channels/GetChannelTab"
import { PreviewChannelMessagesTab } from "./channels/PreviewChannelMessagesTab"
import { FollowUnfollowTab } from "./channels/FollowUnfollowTab"
import { SearchChannelsTab } from "./channels/SearchChannelsTab"

interface ChannelsCardProps {
  sessionId: string
}

export function ChannelsCard({ sessionId }: ChannelsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Channels</CardTitle>
        <CardDescription>
          Manage WhatsApp Channels (Newsletters). List, create, search, and interact with channels.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-7 h-auto mb-4">
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="create">Create</TabsTrigger>
            <TabsTrigger value="get">Get Info</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="delete">Delete</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list">
            <ListChannelsTab sessionId={sessionId} />
          </TabsContent>
          
          <TabsContent value="create">
            <CreateChannelTab sessionId={sessionId} />
          </TabsContent>
          
          <TabsContent value="get">
            <GetChannelTab sessionId={sessionId} />
          </TabsContent>
          
          <TabsContent value="preview">
            <PreviewChannelMessagesTab sessionId={sessionId} />
          </TabsContent>

          <TabsContent value="actions">
            <FollowUnfollowTab sessionId={sessionId} />
          </TabsContent>

          <TabsContent value="search">
            <SearchChannelsTab sessionId={sessionId} />
          </TabsContent>
          
          <TabsContent value="delete">
            <DeleteChannelTab sessionId={sessionId} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
