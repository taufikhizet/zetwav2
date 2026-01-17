import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Users, Plus, Loader2, RefreshCw, ArrowLeft, Info, Shield, User } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../ApiExample'

interface GroupsCardProps {
  sessionId: string
}

export function GroupsCard({ sessionId }: GroupsCardProps) {
  const [activeTab, setActiveTab] = useState('list')
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  
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

  // Render Detailed View
  if (selectedGroupId) {
    return (
      <div className="h-full flex flex-col">
        <CardHeader className="flex flex-row items-center space-y-0 pb-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedGroupId(null)} className="mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <CardTitle>Group Details</CardTitle>
            <CardDescription>
              Viewing information for selected group.
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden flex flex-col min-h-0">
          {isLoadingDetails ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p>Loading group details...</p>
            </div>
          ) : groupDetails ? (
            <div className="space-y-6 h-full flex flex-col overflow-hidden">
              {/* Group Header Info */}
              <div className="bg-muted/30 p-4 rounded-lg border space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">{groupDetails.name || groupDetails.subject || 'Unknown Group'}</h3>
                  <Badge variant="outline">{groupDetails.participants?.length || 0} Members</Badge>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground block text-xs">Group ID</span>
                    <span className="font-mono text-xs select-all">{getGroupId(groupDetails) || selectedGroupId}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Created At</span>
                    <span>{groupDetails.createdAt ? new Date(groupDetails.createdAt).toLocaleDateString() : '-'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground block text-xs">Description</span>
                    <p className="line-clamp-2">{groupDetails.description || 'No description'}</p>
                  </div>
                </div>
              </div>

              {/* Participants List */}
              <div className="flex flex-col min-h-0">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" /> Participants
                </h4>
                <div className="border rounded-md h-[400px] overflow-hidden">
                   <div className="h-full overflow-y-auto">
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
                           <div key={participantId + index} className="p-3 flex items-center justify-between hover:bg-muted/30">
                             <div className="flex items-center gap-3">
                               <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                                 <User className="h-4 w-4 opacity-50" />
                               </div>
                               <div>
                                 <div className="font-medium text-sm">{displayId}</div>
                                 <div className="text-xs text-muted-foreground">+{displayId}</div>
                               </div>
                             </div>
                             <div className="flex gap-2">
                               {isAdmin && (
                                 <Badge variant="secondary" className="text-xs h-5 px-1.5 gap-1">
                                   <Shield className="h-3 w-3" /> Admin
                                 </Badge>
                               )}
                               {isSuperAdmin && (
                                 <Badge className="text-xs h-5 px-1.5">Owner</Badge>
                               )}
                             </div>
                           </div>
                         )})}
                     </div>
                   </div>
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
             <div className="text-center py-8 text-muted-foreground">
               Failed to load group details.
             </div>
          )}
        </CardContent>
      </div>
    )
  }

  return (
    <div className="h-full">
      <CardHeader>
        <CardTitle>Groups</CardTitle>
        <CardDescription>Manage your WhatsApp groups.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="list">List Groups</TabsTrigger>
            <TabsTrigger value="create">Create Group</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => refetchGroups()} disabled={isLoadingGroups}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingGroups ? 'animate-spin' : ''}`} />
                Refresh List
              </Button>
            </div>

            <div className="rounded-md border min-h-[200px] max-h-[400px] overflow-y-auto">
              {isLoadingGroups ? (
                <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mb-2" />
                  <p>Loading groups...</p>
                </div>
              ) : groups && groups.length > 0 ? (
                <div className="divide-y">
                  {groups.map((group: any, index: number) => {
                    const groupId = getGroupId(group)
                    return (
                    <div 
                      key={groupId || index} 
                      className="p-3 hover:bg-muted/50 transition-colors flex items-center justify-between cursor-pointer group"
                      onClick={() => setSelectedGroupId(groupId)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium group-hover:text-primary transition-colors">
                            {group.name || group.subject || 'Unknown Group'}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">{groupId}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {(group.participantCount > 0 || group.participants?.length > 0) && (
                          <div className="text-xs bg-secondary px-2 py-1 rounded-full">
                            {group.participantCount || group.participants?.length} members
                          </div>
                        )}
                        <Info className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  )})}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                  <Users className="h-8 w-8 mb-2 opacity-20" />
                  <p>No groups found</p>
                </div>
              )}
            </div>

            <ApiExample 
              method="GET" 
              url={`/api/sessions/${sessionId}/groups`}
              description="Get all groups the session is part of."
            />
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <div className="grid gap-2">
              <Label>Group Name</Label>
              <Input 
                placeholder="My New Group" 
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Participants</Label>
              <Input 
                placeholder="628123456789, 628987654321" 
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">Comma separated phone numbers.</p>
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
      </CardContent>
    </div>
  )
}
