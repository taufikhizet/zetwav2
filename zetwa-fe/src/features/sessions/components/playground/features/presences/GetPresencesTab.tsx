import { useQuery } from '@tanstack/react-query'
import { sessionApi } from '@/features/sessions/api/session.api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw } from 'lucide-react'
import { ApiExample } from '../../ApiExample'

interface TabProps {
  sessionId: string
}

export function GetPresencesTab({ sessionId }: TabProps) {
  const { data, isLoading, refetch, error } = useQuery({
    queryKey: ['presences', sessionId],
    queryFn: () => sessionApi.getPresences(sessionId),
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Get All Presences</CardTitle>
          <CardDescription>Get all subscribed presence information.</CardDescription>
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
            {data?.map((item: any, index: number) => (
              <div key={index} className="p-3 border rounded-md">
                <div className="font-medium">{item.id || item.chatId}</div>
                <div className="text-sm text-muted-foreground">
                  Status: {item.presence || 'unknown'}
                </div>
                {item.lastKnownPresence && (
                    <div className="text-xs text-muted-foreground">
                        Last Known: {item.lastKnownPresence}
                    </div>
                )}
              </div>
            ))}
            {data?.length === 0 && <div className="text-muted-foreground">No presences found.</div>}
          </div>
        </CardContent>
      </Card>

      <ApiExample
        method="GET"
        url={`/api/sessions/${sessionId}/presence`}
        description="Get all subscribed presence information."
      />
    </div>
  )
}
