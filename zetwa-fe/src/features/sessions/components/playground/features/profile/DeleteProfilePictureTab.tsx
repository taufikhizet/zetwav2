
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'
import { ResponseDisplay } from '../../ResponseDisplay'

interface DeleteProfilePictureTabProps {
  sessionId: string
}

export function DeleteProfilePictureTab({ sessionId }: DeleteProfilePictureTabProps) {
  const [response, setResponse] = useState<any>(null)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => sessionApi.deleteProfilePicture(sessionId),
    onSuccess: () => {
      toast.success('Profile picture removed')
      setResponse({ success: true, message: 'Profile picture removed successfully' })
      queryClient.invalidateQueries({ queryKey: ['profile', sessionId] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove profile picture')
    }
  })

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center justify-center space-y-4 py-4">
          <p className="text-muted-foreground text-center">
            This will remove your current profile picture and revert to the default avatar.
          </p>
          
          <Button 
            variant="destructive"
            onClick={() => mutation.mutate()} 
            disabled={mutation.isPending}
          >
            {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4"/>}
            Remove Profile Picture
          </Button>
          
          <ResponseDisplay data={response} />
        </div>
      </div>

      <ApiExample 
        method="DELETE" 
        url={`/api/sessions/${sessionId}/profile/picture`}
        description="Remove the current profile picture."
        responseExample={{ success: true, message: "Profile picture removed successfully" }}
      />
    </div>
  )
}
