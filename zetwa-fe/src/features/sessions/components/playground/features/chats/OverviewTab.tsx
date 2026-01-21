import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { sessionApi } from '@/features/sessions/api/session.api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2, RefreshCw } from 'lucide-react'
import { ApiExample } from '../../ApiExample'

interface TabProps {
  sessionId: string
}

export function OverviewTab({ sessionId }: TabProps) {
  const [limit, setLimit] = useState(20)
  const [offset, setOffset] = useState(0)

  const { data, isLoading, refetch, error } = useQuery({
    queryKey: ['chats-overview', sessionId, limit, offset],
    queryFn: () => sessionApi.getChatsOverview(sessionId, { limit, offset }),
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Chats Overview</CardTitle>
          <CardDescription>Get a summary of chats including pictures and last message.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="w-24">
              <Label>Limit</Label>
              <Input type="number" value={limit} onChange={e => setLimit(Number(e.target.value))} />
            </div>
            <div className="w-24">
              <Label>Offset</Label>
              <Input type="number" value={offset} onChange={e => setOffset(Number(e.target.value))} />
            </div>
            <div className="flex items-end">
              <Button onClick={() => refetch()} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Refresh
              </Button>
            </div>
          </div>

          {error && <div className="text-red-500 mb-4">Error: {(error as Error).message}</div>}

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {data?.map((chat: any) => (
              <div key={chat.id} className="p-3 border rounded-lg flex gap-3 items-start">
                 {chat.picture?.url ? (
                    <img src={chat.picture.url} alt="" className="w-10 h-10 rounded-full object-cover" />
                 ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">?</div>
                 )}
                 <div className="overflow-hidden flex-1">
                    <div className="font-medium flex justify-between">
                        <span>{chat.name}</span>
                        <span className="text-xs text-muted-foreground">{chat.id}</span>
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                        {chat.lastMessage?.body || 'No message'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex gap-2">
                        <span>Unread: {chat.unreadCount}</span>
                        {chat.pinned && <span className="text-blue-500">Pinned</span>}
                        {chat.muted && <span className="text-red-500">Muted</span>}
                    </div>
                 </div>
              </div>
            ))}
            {data?.length === 0 && <div className="text-muted-foreground text-center py-4">No chats found.</div>}
          </div>
        </CardContent>
      </Card>

      <ApiExample
        method="GET"
        url={`/api/sessions/${sessionId}/chats/overview`}
        description="Get chats overview."
      />
    </div>
  )
}
