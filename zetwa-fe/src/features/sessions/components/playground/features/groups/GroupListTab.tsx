import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { RefreshCw, Users, Hash, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'
import { ResponseDisplay } from '../../ResponseDisplay'

interface GroupListTabProps {
  sessionId: string
}

export function GroupListTab({ sessionId }: GroupListTabProps) {
  const queryClient = useQueryClient()
  const [response, setResponse] = useState<any>(null)

  const { data: groups, isLoading: isLoadingGroups, refetch } = useQuery({
    queryKey: ['session', sessionId, 'groups'],
    queryFn: () => sessionApi.getGroups(sessionId)
  })

  const { data: countData, isLoading: isLoadingCount, refetch: refetchCount } = useQuery({
    queryKey: ['session', sessionId, 'groups', 'count'],
    queryFn: () => sessionApi.getGroupsCount(sessionId)
  })

  const refreshGroupsMutation = useMutation({
    mutationFn: () => sessionApi.refreshGroups(sessionId),
    onSuccess: (data) => {
      toast.success('Groups refreshed from server')
      setResponse(data)
      queryClient.invalidateQueries({ queryKey: ['session', sessionId, 'groups'] })
    },
    onError: (error: any) => {
        // Fallback to local refetch if endpoint fails
        refetch();
        refetchCount();
        toast.error(error.message || 'Failed to refresh groups from server')
    }
  })

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Count Card */}
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
                <Hash className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{isLoadingCount ? <Loader2 className="h-4 w-4 animate-spin"/> : countData?.count || 0}</div>
            </CardContent>
        </Card>

        {/* Refresh Card */}
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Actions</CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => refreshGroupsMutation.mutate()}
                    disabled={refreshGroupsMutation.isPending}
                >
                    {refreshGroupsMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <RefreshCw className="mr-2 h-4 w-4"/>}
                    Refresh Groups
                </Button>
            </CardContent>
        </Card>
      </div>

      <div className="rounded-md border">
        <div className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Users className="h-4 w-4" /> Group List</h3>
            {isLoadingGroups ? (
                <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {groups?.map((group: any) => (
                        <div key={group.id._serialized || group.id} className="flex items-center justify-between p-2 border rounded-lg text-sm">
                            <span className="font-medium truncate max-w-[200px]">{group.name || group.subject}</span>
                            <span className="text-xs text-muted-foreground font-mono">{group.id._serialized || group.id}</span>
                        </div>
                    ))}
                    {(!groups || groups.length === 0) && <div className="text-center text-muted-foreground text-sm p-4">No groups found</div>}
                </div>
            )}
        </div>
      </div>
      
      <ResponseDisplay data={response} title="Refresh Response" />

      <div className="space-y-4">
        <ApiExample 
            method="GET" 
            url={`/api/sessions/${sessionId}/groups`}
            description="Get all groups."
            responseExample={[
              {
                "id": "12036302...@g.us",
                "name": "My Group",
                "unreadCount": 0,
                "timestamp": 1705641234
              }
            ]}
            responseDescription="Returns an array of group objects."
        />
        <ApiExample 
            method="GET" 
            url={`/api/sessions/${sessionId}/groups/count`}
            description="Get the number of groups."
            responseExample={{ "count": 15 }}
            responseDescription="Returns the total count of groups."
        />
        <ApiExample 
            method="POST" 
            url={`/api/sessions/${sessionId}/groups/refresh`}
            description="Refresh groups from the server."
            responseExample={{ "success": true }}
            responseDescription="Returns success status."
        />
      </div>
    </div>
  )
}
