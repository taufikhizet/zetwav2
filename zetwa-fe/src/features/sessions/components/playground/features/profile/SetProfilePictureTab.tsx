
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'
import { ResponseDisplay } from '../../ResponseDisplay'

interface SetProfilePictureTabProps {
  sessionId: string
}

export function SetProfilePictureTab({ sessionId }: SetProfilePictureTabProps) {
  const [imageUrl, setImageUrl] = useState('')
  const [response, setResponse] = useState<any>(null)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (url: string) => sessionApi.setProfilePicture(sessionId, { imageUrl: url }),
    onSuccess: () => {
      toast.success('Profile picture updated')
      setResponse({ success: true, message: 'Profile picture updated successfully' })
      queryClient.invalidateQueries({ queryKey: ['profile', sessionId] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update profile picture')
    }
  })

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Image URL</Label>
            <Input 
              placeholder="https://example.com/image.jpg" 
              value={imageUrl} 
              onChange={(e) => setImageUrl(e.target.value)} 
            />
            <p className="text-xs text-muted-foreground">URL must be directly accessible (public)</p>
          </div>
          
          <Button 
            onClick={() => mutation.mutate(imageUrl)} 
            disabled={!imageUrl || mutation.isPending}
          >
            {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4"/>}
            Set Picture
          </Button>
          
          <ResponseDisplay data={response} />
        </div>
      </div>

      <ApiExample 
        method="PUT" 
        url={`/api/sessions/${sessionId}/profile/picture`}
        body={{ imageUrl: "https://example.com/image.jpg" }}
        description="Set the profile picture using an image URL."
        parameters={[{ name: "imageUrl", type: "string", required: true, description: "Direct URL to image" }]}
        responseExample={{ success: true, message: "Profile picture updated successfully" }}
      />
    </div>
  )
}
