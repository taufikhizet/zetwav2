import { useState } from 'react'
import { Users } from 'lucide-react'
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { GroupListTab } from './groups/GroupListTab'
import { CreateGroupTab } from './groups/CreateGroupTab'
import { JoinGroupTab } from './groups/JoinGroupTab'
import { GroupInfoTab } from './groups/GroupInfoTab'
import { GroupLeaveTab } from './groups/GroupLeaveTab'
import { GroupDeleteTab } from './groups/GroupDeleteTab'
import { GroupPictureGetTab } from './groups/GroupPictureGetTab'
import { GroupPictureSetTab } from './groups/GroupPictureSetTab'
import { GroupPictureDeleteTab } from './groups/GroupPictureDeleteTab'
import { GroupNameTab } from './groups/GroupNameTab'
import { GroupDescriptionTab } from './groups/GroupDescriptionTab'
import { GroupSettingsInfoTab } from './groups/GroupSettingsInfoTab'
import { GroupSettingsMessagesTab } from './groups/GroupSettingsMessagesTab'
import { GroupParticipantsGetTab } from './groups/GroupParticipantsGetTab'
import { GroupParticipantsAddTab } from './groups/GroupParticipantsAddTab'
import { GroupParticipantsRemoveTab } from './groups/GroupParticipantsRemoveTab'
import { GroupParticipantsPromoteTab } from './groups/GroupParticipantsPromoteTab'
import { GroupParticipantsDemoteTab } from './groups/GroupParticipantsDemoteTab'
import { GroupInviteTab } from './groups/GroupInviteTab'

interface GroupsCardProps {
  sessionId: string
}

export function GroupsCard({ sessionId }: GroupsCardProps) {
  const [activeTab, setActiveTab] = useState('list')
  
  return (
    <div className="h-full flex flex-col space-y-4">
      <CardHeader className="px-0 pt-0 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Groups</CardTitle>
              <CardDescription>Manage groups, participants, and settings</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4">
           <TabsList className="flex w-full flex-wrap h-auto gap-1 bg-muted/50 p-1 justify-start">
            {/* 1. Discovery & Creation */}
            <TabsTrigger value="list" className="flex-1 min-w-[70px]">List</TabsTrigger>
            <TabsTrigger value="create" className="flex-1 min-w-[70px]">Create</TabsTrigger>
            <TabsTrigger value="join" className="flex-1 min-w-[70px]">Join</TabsTrigger>
            
            {/* 2. Basic Management */}
            <TabsTrigger value="info" className="flex-1 min-w-[70px]">Get Info</TabsTrigger>
            <TabsTrigger value="subject" className="flex-1 min-w-[70px]">Subject</TabsTrigger>
            <TabsTrigger value="description" className="flex-1 min-w-[70px]">Description</TabsTrigger>
            <TabsTrigger value="picture-get" className="flex-1 min-w-[70px]">Get Picture</TabsTrigger>
            <TabsTrigger value="picture-set" className="flex-1 min-w-[70px]">Set Picture</TabsTrigger>
            <TabsTrigger value="picture-delete" className="flex-1 min-w-[70px]">Delete Picture</TabsTrigger>
            <TabsTrigger value="invite" className="flex-1 min-w-[70px]">Invite</TabsTrigger>
            
            {/* 3. Participant Management */}
            <TabsTrigger value="participants-get" className="flex-1 min-w-[90px]">Get Participants</TabsTrigger>
            <TabsTrigger value="participants-add" className="flex-1 min-w-[90px]">Add Participants</TabsTrigger>
            <TabsTrigger value="participants-remove" className="flex-1 min-w-[90px]">Remove Participants</TabsTrigger>
            <TabsTrigger value="participants-promote" className="flex-1 min-w-[90px]">Promote</TabsTrigger>
            <TabsTrigger value="participants-demote" className="flex-1 min-w-[90px]">Demote</TabsTrigger>
            
            {/* 4. Settings & Security */}
            <TabsTrigger value="settings-info" className="flex-1 min-w-[70px]">Settings Info</TabsTrigger>
            <TabsTrigger value="settings-messages" className="flex-1 min-w-[70px]">Settings Msg</TabsTrigger>
            
            {/* 5. Destructive/Exit Actions */}
            <TabsTrigger value="leave" className="flex-1 min-w-[70px]">Leave</TabsTrigger>
            <TabsTrigger value="delete" className="flex-1 min-w-[70px]">Delete</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
            <TabsContent value="list" className="mt-0 space-y-6">
              <GroupListTab sessionId={sessionId} />
            </TabsContent>

            <TabsContent value="create" className="mt-0 space-y-6">
              <CreateGroupTab sessionId={sessionId} />
            </TabsContent>

            <TabsContent value="join" className="mt-0 space-y-6">
              <JoinGroupTab sessionId={sessionId} />
            </TabsContent>

            <TabsContent value="info" className="mt-0 space-y-6">
              <GroupInfoTab sessionId={sessionId} />
            </TabsContent>

            <TabsContent value="subject" className="mt-0 space-y-6">
              <GroupNameTab sessionId={sessionId} />
            </TabsContent>

            <TabsContent value="description" className="mt-0 space-y-6">
              <GroupDescriptionTab sessionId={sessionId} />
            </TabsContent>

            <TabsContent value="picture-get" className="mt-0 space-y-6">
              <GroupPictureGetTab sessionId={sessionId} />
            </TabsContent>

            <TabsContent value="picture-set" className="mt-0 space-y-6">
              <GroupPictureSetTab sessionId={sessionId} />
            </TabsContent>

            <TabsContent value="picture-delete" className="mt-0 space-y-6">
              <GroupPictureDeleteTab sessionId={sessionId} />
            </TabsContent>

            <TabsContent value="invite" className="mt-0 space-y-6">
              <GroupInviteTab sessionId={sessionId} />
            </TabsContent>

            <TabsContent value="participants-get" className="mt-0 space-y-6">
              <GroupParticipantsGetTab sessionId={sessionId} />
            </TabsContent>

            <TabsContent value="participants-add" className="mt-0 space-y-6">
              <GroupParticipantsAddTab sessionId={sessionId} />
            </TabsContent>

            <TabsContent value="participants-remove" className="mt-0 space-y-6">
              <GroupParticipantsRemoveTab sessionId={sessionId} />
            </TabsContent>

            <TabsContent value="participants-promote" className="mt-0 space-y-6">
              <GroupParticipantsPromoteTab sessionId={sessionId} />
            </TabsContent>

            <TabsContent value="participants-demote" className="mt-0 space-y-6">
              <GroupParticipantsDemoteTab sessionId={sessionId} />
            </TabsContent>

            <TabsContent value="settings-info" className="mt-0 space-y-6">
              <GroupSettingsInfoTab sessionId={sessionId} />
            </TabsContent>

            <TabsContent value="settings-messages" className="mt-0 space-y-6">
              <GroupSettingsMessagesTab sessionId={sessionId} />
            </TabsContent>

            <TabsContent value="leave" className="mt-0 space-y-6">
              <GroupLeaveTab sessionId={sessionId} />
            </TabsContent>

            <TabsContent value="delete" className="mt-0 space-y-6">
              <GroupDeleteTab sessionId={sessionId} />
            </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
