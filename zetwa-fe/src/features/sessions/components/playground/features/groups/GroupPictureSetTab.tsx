import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Upload, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'
import { ResponseDisplay } from '../../ResponseDisplay'

interface GroupPictureSetTabProps {
  sessionId: string
}

export function GroupPictureSetTab({ sessionId }: GroupPictureSetTabProps) {
  const [groupId, setGroupId] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [currentPicture, setCurrentPicture] = useState<string | null>(null)
  const [response, setResponse] = useState<any>(null)

  const setPictureMutation = useMutation({
    mutationFn: () => sessionApi.setPicture(sessionId, groupId, { imageUrl }),
    onSuccess: (data) => {
      toast.success('Picture updated successfully')
      setCurrentPicture(imageUrl)
      setResponse(data)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update picture')
    }
  })

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
         <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Group ID</Label>
              <Input 
                placeholder="12036302... @g.us" 
                value={groupId} 
                onChange={(e) => setGroupId(e.target.value)} 
                className="font-mono"
              />
            </div>

            <div className="grid gap-2">
              <Label>Image URL (for update)</Label>
              <Input 
                placeholder="https://example.com/image.jpg" 
                value={imageUrl} 
                onChange={(e) => setImageUrl(e.target.value)} 
              />
            </div>
            
            <Button 
                onClick={() => setPictureMutation.mutate()} 
                disabled={!groupId || !imageUrl || setPictureMutation.isPending}
            >
            {setPictureMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Set Picture
            </Button>

            {currentPicture && (
                <div className="mt-4 flex justify-center p-4 border rounded-lg bg-muted/20">
                    <img src={currentPicture} alt="Group" className="max-h-[200px] rounded-lg object-contain" />
                </div>
            )}
            
            <ResponseDisplay data={response} />
         </div>
      </div>

      <ApiExample 
          method="PUT" 
          url={`/api/sessions/${sessionId}/groups/{id}/picture`}
          body={{ file: imageUrl || "https://..." }}
          description="Set group picture."
          parameters={[{ name: "id", type: "string", required: true, description: "Group ID" }]}
          responseExample={{
            "success": true,
            "message": "Picture updated"
          }}
          responseDescription="Returns confirmation."
      />
    </div>
  )
}
