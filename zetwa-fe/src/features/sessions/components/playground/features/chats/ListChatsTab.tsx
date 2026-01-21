import { useQuery } from '@tanstack/react-query'
import { sessionApi } from '@/features/sessions/api/session.api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw } from 'lucide-react'
import { ApiExample } from '../../ApiExample'

interface TabProps {
  sessionId: string
}

export function ListChatsTab({ sessionId }: TabProps) {
  const { data, isLoading, refetch, error } = useQuery({
    queryKey: ['chats-list', sessionId],
    queryFn: () => sessionApi.getChats(sessionId, false),
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>List Chats</CardTitle>
          <CardDescription>Get all chats (simple list).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Button onClick={() => refetch()} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Refresh List
            </Button>
          </div>

          {error && <div className="text-red-500 mb-4">Error: {(error as Error).message}</div>}

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {data?.map((chat: any) => (
              <div key={chat.id} className="p-2 border rounded-md text-sm">
                <div className="font-medium">{chat.name || 'Unknown'}</div>
                <div className="text-muted-foreground text-xs">{chat.id}</div>
              </div>
            ))}
             {data?.length === 0 && <div className="text-muted-foreground">No chats found.</div>}
          </div>
        </CardContent>
      </Card>

      <ApiExample
        method="GET"
        url={`/api/sessions/${sessionId}/chats`}
        description="Get all chats."
      />
    </div>
  )
}
