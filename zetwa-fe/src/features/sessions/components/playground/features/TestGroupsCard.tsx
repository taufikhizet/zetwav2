import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  Users, 
  Plus, 
  Loader2, 
  RefreshCw, 
  ArrowLeft, 
  Info, 
  Shield, 
  User, 
  Search,
  Calendar
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../ApiExample'

interface GroupsCardProps {
  sessionId: string
}

export function TestGroupsCard({ sessionId }: GroupsCardProps) {
  const [activeTab, setActiveTab] = useState('list')
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Create Group State
  const [groupName, setGroupName] = useState('')
  const [participants, setParticipants] = useState('')

  // Get Groups Query
  const { data: groups, isLoading: isLoadingGroups, refetch: refetchGroups } = useQuery({
    queryKey: ['groups', sessionId],
    queryFn: () => sessionApi.getGroups(sessionId),
    enabled: activeTab === 'list' && !selectedGroupId,
  })

  // Get Single Group Query
  const { data: groupDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['group', sessionId, selectedGroupId],
    queryFn: () => sessionApi.getGroup(sessionId, selectedGroupId!),
    enabled: !!selectedGroupId,
  })

  const createGroupMutation = useMutation({
    mutationFn: () => {
      const participantList = participants.split(',').map(p => p.trim()).filter(Boolean)
      return sessionApi.createGroup(sessionId, { name: groupName, participants: participantList })
    },
    onSuccess: () => {
      toast.success('Group created successfully')
      setGroupName('')
      setParticipants('')
      setActiveTab('list')
      refetchGroups()
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create group')
    }
  })

  const getGroupId = (group: any) => {
    if (!group?.id) return null
    if (typeof group.id === 'string') return group.id
    return group.id._serialized
  }

  // Filter groups based on search
  const filteredGroups = groups?.filter((group: any) => {
    if (!searchQuery) return true
    const name = group.name || group.subject || 'Unknown Group'
    return name.toLowerCase().includes(searchQuery.toLowerCase())
  }) || []

  // Render Detailed View
  if (selectedGroupId) {
    return (
      <div className="h-full flex flex-col space-y-4">
        <CardHeader className="px-0 pt-0 pb-2 flex flex-row items-center space-y-0 gap-2">
           <Button variant="ghost" size="icon" onClick={() => setSelectedGroupId(null)} className="h-8 w-8 -ml-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle className="text-xl">Group Details</CardTitle>
            <CardDescription>
              Viewing group information and participants
            </CardDescription>
          </div>
        </CardHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {isLoadingDetails ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
              <p>Loading group details...</p>
            </div>
          ) : groupDetails ? (
            <div className="space-y-6 h-full flex flex-col overflow-hidden">
              {/* Group Header Info */}
              <div className="bg-muted/30 p-4 rounded-xl border space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                     <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-6 w-6 text-primary" />
                     </div>
                     <div>
                        <h3 className="text-lg font-bold leading-tight">{groupDetails.name || groupDetails.subject || 'Unknown Group'}</h3>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                           <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                              {groupDetails.participants?.length || 0} Members
                           </Badge>
                           <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {groupDetails.createdAt ? new Date(groupDetails.createdAt).toLocaleDateString() : '-'}
                           </span>
                        </div>
                     </div>
                  </div>
                </div>
                
                <Separator />

                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider font-semibold mb-1">Group ID</span>
                    <div className="font-mono text-xs select-all bg-background p-2 rounded border truncate">
                       {getGroupId(groupDetails) || selectedGroupId}
                    </div>
                  </div>
                  {groupDetails.description && (
                     <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider font-semibold mb-1">Description</span>
                        <p className="text-sm bg-background p-2 rounded border min-h-[40px]">
                           {groupDetails.description}
                        </p>
                     </div>
                  )}
                </div>
              </div>

              {/* Participants List */}
              <div className="flex flex-col min-h-0 flex-1">
                <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-primary" /> Participants
                </h4>
                <div className="rounded-xl border bg-card flex-1 overflow-hidden shadow-sm">
                   <ScrollArea className="h-full">
                     <div className="divide-y">
                       {[...(groupDetails.participants || [])]
                         .sort((a: any, b: any) => {
                           const getWeight = (p: any) => {
                             if (p.isSuperAdmin || p.role === 'superadmin') return 3
                             if (p.isAdmin || p.role === 'admin') return 2
                             return 1
                           }
                           return getWeight(b) - getWeight(a)
                         })
                         .map((p: any, index: number) => {
                           const participantId = typeof p.id === 'string' ? p.id : p.id?.user || p.id?._serialized || 'unknown'
                           const displayId = typeof p.id === 'string' ? p.id.split('@')[0] : p.id?.user
                           const isAdmin = p.isAdmin || p.role === 'admin' || p.role === 'superadmin'
                           const isSuperAdmin = p.isSuperAdmin || p.role === 'superadmin'
                           
                           return (
                           <div key={participantId + index} className="p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                             <div className="flex items-center gap-3">
                               <Avatar className="h-8 w-8 border">
                                 <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                                   <User className="h-4 w-4 opacity-50" />
                                 </AvatarFallback>
                               </Avatar>
                               <div>
                                 <div className="font-medium text-sm">{displayId}</div>
                                 <div className="text-[10px] text-muted-foreground font-mono">+{displayId}</div>
                               </div>
                             </div>
                             <div className="flex gap-2">
                               {isAdmin && (
                                 <Badge variant="outline" className="text-[10px] h-5 px-1.5 gap-1 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                                   <Shield className="h-3 w-3" /> {isSuperAdmin ? 'Owner' : 'Admin'}
                                 </Badge>
                               )}
                             </div>
                           </div>
                         )})}
                     </div>
                   </ScrollArea>
                </div>
              </div>

              {/* API Example for this detail view */}
              <div className="mt-4 shrink-0">
                <ApiExample 
                  method="GET" 
                  url={`/api/sessions/${sessionId}/groups/${selectedGroupId}`}
                  description="Get full details of a specific group including participants."
                />
              </div>
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
               <div className="bg-destructive/10 p-4 rounded-full mb-3 text-destructive">
                  <Users className="h-8 w-8" />
               </div>
               <p>Failed to load group details</p>
             </div>
          )}
        </div>
      </div>
    )
  }

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
              <CardDescription>Manage your WhatsApp groups</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="grid w-[240px] grid-cols-2">
            <TabsTrigger value="list">List Groups</TabsTrigger>
            <TabsTrigger value="create">Create Group</TabsTrigger>
          </TabsList>

          {activeTab === 'list' && (
             <Button variant="outline" size="sm" onClick={() => refetchGroups()} disabled={isLoadingGroups} className="h-8">
                <RefreshCw className={`h-3.5 w-3.5 mr-2 ${isLoadingGroups ? 'animate-spin' : ''}`} />
                Refresh
             </Button>
          )}
        </div>

        <TabsContent value="list" className="flex-1 flex flex-col min-h-0 space-y-4 mt-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search groups..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="rounded-xl border bg-card flex-1 min-h-0 overflow-hidden flex flex-col shadow-sm">
             <ScrollArea className="flex-1">
                {isLoadingGroups ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
                    <p>Loading groups...</p>
                  </div>
                ) : filteredGroups.length > 0 ? (
                  <div className="divide-y">
                    {filteredGroups.map((group: any, index: number) => {
                      const groupId = getGroupId(group)
                      return (
                      <div 
                        key={groupId || index} 
                        className="p-3 hover:bg-muted/50 transition-all flex items-center justify-between cursor-pointer group"
                        onClick={() => setSelectedGroupId(groupId)}
                      >
                        <div className="flex items-center gap-3 overflow-hidden flex-1">
                          <Avatar className="h-10 w-10 border">
                             <AvatarFallback className="bg-primary/5 text-primary">
                                <Users className="h-5 w-5" />
                             </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate text-sm group-hover:text-primary transition-colors">
                              {group.name || group.subject || 'Unknown Group'}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono truncate opacity-70">
                               {groupId}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {(group.participantCount > 0 || group.participants?.length > 0) && (
                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                              {group.participantCount || group.participants?.length} members
                            </Badge>
                          )}
                          <Info className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    )})}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                    <div className="bg-muted p-4 rounded-full mb-3">
                      <Users className="h-8 w-8 opacity-20" />
                    </div>
                    <p className="font-medium">No groups found</p>
                  </div>
                )}
             </ScrollArea>
          </div>

          <ApiExample 
            method="GET" 
            url={`/api/sessions/${sessionId}/groups`}
            description="Get all groups the session is part of."
          />
        </TabsContent>

        <TabsContent value="create" className="space-y-6 mt-0">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
             <div className="grid gap-6">
               <div className="grid gap-2">
                 <Label>Group Name</Label>
                 <Input 
                   placeholder="My New Group" 
                   value={groupName}
                   onChange={(e) => setGroupName(e.target.value)}
                 />
               </div>
               
               <div className="grid gap-2">
                 <Label>Participants (Phone Numbers)</Label>
                 <Input 
                   placeholder="628123456789, 628987654321" 
                   value={participants}
                   onChange={(e) => setParticipants(e.target.value)}
                 />
                 <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Enter phone numbers separated by commas.
                 </p>
               </div>
   
               <Button 
                 className="w-full" 
                 onClick={() => createGroupMutation.mutate()}
                 disabled={!groupName || !participants || createGroupMutation.isPending}
               >
                 {createGroupMutation.isPending ? (
                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                 ) : (
                   <Plus className="mr-2 h-4 w-4" />
                 )}
                 Create Group
               </Button>
             </div>
          </div>

          <ApiExample 
            method="POST" 
            url={`/api/sessions/${sessionId}/groups`}
            body={{
              name: groupName || "New Group",
              participants: ["628123456789"]
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
