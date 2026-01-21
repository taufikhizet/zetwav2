
import { useState } from 'react'
import { UserCircle2 } from 'lucide-react'

import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { GetProfileTab } from './profile/GetProfileTab'
import { SetProfileNameTab } from './profile/SetProfileNameTab'
import { SetProfileStatusTab } from './profile/SetProfileStatusTab'
import { SetProfilePictureTab } from './profile/SetProfilePictureTab'
import { DeleteProfilePictureTab } from './profile/DeleteProfilePictureTab'

interface ProfileCardProps {
  sessionId: string
}

export function ProfileCard({ sessionId }: ProfileCardProps) {
  const [activeTab, setActiveTab] = useState('get')

  return (
    <div className="h-full flex flex-col space-y-4">
      <CardHeader className="px-0 pt-0 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <UserCircle2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Profile</CardTitle>
              <CardDescription>Manage your WhatsApp profile info, status, and picture</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="flex w-full flex-wrap h-auto gap-1 bg-muted/50 p-1 justify-start">
            <TabsTrigger value="get" className="flex-1 min-w-[90px]">Get Profile</TabsTrigger>
            <TabsTrigger value="name" className="flex-1 min-w-[90px]">Set Name</TabsTrigger>
            <TabsTrigger value="status" className="flex-1 min-w-[90px]">Set Status</TabsTrigger>
            <TabsTrigger value="picture" className="flex-1 min-w-[90px]">Set Picture</TabsTrigger>
            <TabsTrigger value="delete-picture" className="flex-1 min-w-[110px]">Delete Picture</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <TabsContent value="get" className="mt-0 space-y-6">
            <GetProfileTab sessionId={sessionId} />
          </TabsContent>

          <TabsContent value="name" className="mt-0 space-y-6">
            <SetProfileNameTab sessionId={sessionId} />
          </TabsContent>

          <TabsContent value="status" className="mt-0 space-y-6">
            <SetProfileStatusTab sessionId={sessionId} />
          </TabsContent>

          <TabsContent value="picture" className="mt-0 space-y-6">
            <SetProfilePictureTab sessionId={sessionId} />
          </TabsContent>

          <TabsContent value="delete-picture" className="mt-0 space-y-6">
            <DeleteProfilePictureTab sessionId={sessionId} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
