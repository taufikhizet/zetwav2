
import { useQuery } from '@tanstack/react-query'
import { Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'
import { ResponseDisplay } from '../../ResponseDisplay'

interface GetProfileTabProps {
  sessionId: string
}

export function GetProfileTab({ sessionId }: GetProfileTabProps) {
  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ['profile', sessionId],
    queryFn: () => sessionApi.getProfile(sessionId),
  })

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">My Profile</h3>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ResponseDisplay data={profile} />
        )}
      </div>

      <ApiExample 
        method="GET"
        url={`/api/sessions/${sessionId}/profile`}
        description="Get current session profile information."
        responseExample={{
          id: "6281234567890@c.us",
          name: "My Name",
          about: "Hey there! I am using WhatsApp.",
          profilePicUrl: "https://pps.whatsapp.net/..."
        }}
      />
    </div>
  )
}
