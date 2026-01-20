
import { useQuery } from '@tanstack/react-query'
import { Fingerprint, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'

interface LIDListTabProps {
  sessionId: string
}

export function LIDListTab({ sessionId }: LIDListTabProps) {
  const { data: lids, isLoading, refetch } = useQuery({
    queryKey: ['lids', sessionId],
    queryFn: () => sessionApi.getLids(sessionId),
  })

  const { data: lidsCount } = useQuery({
    queryKey: ['lids-count', sessionId],
    queryFn: () => sessionApi.getLidsCount(sessionId),
  })

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
                <Fingerprint className="h-4 w-4" /> Known LIDs 
                {lidsCount && <span className="text-muted-foreground font-normal">({lidsCount.count})</span>}
            </h3>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`h-3.5 w-3.5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
        </div>

        <div className="rounded-xl border bg-card h-[300px] overflow-hidden flex flex-col shadow-sm">
            <ScrollArea className="flex-1">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
                    <p>Loading LIDs...</p>
                  </div>
                ) : lids && lids.length > 0 ? (
                  <div className="divide-y">
                    {lids.map((lid: any) => (
                      <div key={lid.lid} className="p-3 text-sm flex justify-between hover:bg-muted/50 transition-colors">
                        <span className="font-mono text-xs">{lid.lid}</span>
                        <span className="font-mono text-xs text-muted-foreground">{lid.pn || 'N/A'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <p>No LIDs found</p>
                  </div>
                )}
            </ScrollArea>
        </div>
      </div>

      <div className="space-y-4">
        <ApiExample 
            method="GET" 
            url={`/api/sessions/${sessionId}/lids`}
            description="Get all known lids to phone number mapping."
            responseExample={[
            {
                "lid": "123456...@lid",
                "pn": "628123..."
            }
            ]}
            responseDescription="Returns list of LID mappings."
        />
        <ApiExample 
            method="GET" 
            url={`/api/sessions/${sessionId}/lids/count`}
            description="Get the number of known lids."
            responseExample={{
            "count": 150
            }}
            responseDescription="Returns the count."
        />
      </div>
    </div>
  )
}
