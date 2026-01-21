import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { OverviewTab } from './chats/OverviewTab'
import { ListChatsTab } from './chats/ListChatsTab'
import { DeleteChatTab } from './chats/DeleteChatTab'
import { ChatPictureTab } from './chats/ChatPictureTab'
import { GetChatMessagesTab } from './chats/GetChatMessagesTab'
import { ClearMessagesTab } from './chats/ClearMessagesTab'
import { ReadMessagesTab } from './chats/ReadMessagesTab'
import { GetMessageTab } from './chats/GetMessageTab'
import { DeleteMessageTab } from './chats/DeleteMessageTab'
import { EditMessageTab } from './chats/EditMessageTab'
import { PinMessageTab } from './chats/PinMessageTab'
import { UnpinMessageTab } from './chats/UnpinMessageTab'
import { ArchiveChatTab } from './chats/ArchiveChatTab'
import { UnarchiveChatTab } from './chats/UnarchiveChatTab'
import { UnreadChatTab } from './chats/UnreadChatTab'

interface ChatsCardProps {
  sessionId: string
}

export function ChatsCard({ sessionId }: ChatsCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Chats Management</CardTitle>
        <CardDescription>
          Manage chats and messages with WAHA-compatible features.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <ScrollArea className="w-full whitespace-nowrap mb-4">
            <TabsList className="inline-flex w-auto p-1 bg-muted rounded-lg">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
              <TabsTrigger value="delete-chat">Delete Chat</TabsTrigger>
              <TabsTrigger value="picture">Picture</TabsTrigger>
              <TabsTrigger value="archive">Archive</TabsTrigger>
              <TabsTrigger value="unarchive">Unarchive</TabsTrigger>
              <TabsTrigger value="unread">Unread</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="clear">Clear</TabsTrigger>
              <TabsTrigger value="read">Read</TabsTrigger>
              <TabsTrigger value="get-msg">Get Msg</TabsTrigger>
              <TabsTrigger value="del-msg">Del Msg</TabsTrigger>
              <TabsTrigger value="edit-msg">Edit Msg</TabsTrigger>
              <TabsTrigger value="pin-msg">Pin Msg</TabsTrigger>
              <TabsTrigger value="unpin-msg">Unpin Msg</TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <TabsContent value="overview"><OverviewTab sessionId={sessionId} /></TabsContent>
          <TabsContent value="list"><ListChatsTab sessionId={sessionId} /></TabsContent>
          <TabsContent value="delete-chat"><DeleteChatTab sessionId={sessionId} /></TabsContent>
          <TabsContent value="picture"><ChatPictureTab sessionId={sessionId} /></TabsContent>
          <TabsContent value="archive"><ArchiveChatTab sessionId={sessionId} /></TabsContent>
          <TabsContent value="unarchive"><UnarchiveChatTab sessionId={sessionId} /></TabsContent>
          <TabsContent value="unread"><UnreadChatTab sessionId={sessionId} /></TabsContent>
          <TabsContent value="messages"><GetChatMessagesTab sessionId={sessionId} /></TabsContent>
          <TabsContent value="clear"><ClearMessagesTab sessionId={sessionId} /></TabsContent>
          <TabsContent value="read"><ReadMessagesTab sessionId={sessionId} /></TabsContent>
          <TabsContent value="get-msg"><GetMessageTab sessionId={sessionId} /></TabsContent>
          <TabsContent value="del-msg"><DeleteMessageTab sessionId={sessionId} /></TabsContent>
          <TabsContent value="edit-msg"><EditMessageTab sessionId={sessionId} /></TabsContent>
          <TabsContent value="pin-msg"><PinMessageTab sessionId={sessionId} /></TabsContent>
          <TabsContent value="unpin-msg"><UnpinMessageTab sessionId={sessionId} /></TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
