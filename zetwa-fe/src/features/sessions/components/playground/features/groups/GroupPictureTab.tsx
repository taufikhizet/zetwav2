import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Image as ImageIcon, Trash2, Loader2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'
import { ResponseDisplay } from '../../ResponseDisplay'

interface GroupPictureTabProps {
  sessionId: string
}

export function GroupPictureTab({ sessionId }: GroupPictureTabProps) {
  const [groupId, setGroupId] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [currentPicture, setCurrentPicture] = useState<string | null>(null)
  const [response, setResponse] = useState<any>(null)

  const getPictureMutation = useMutation({
    mutationFn: () => sessionApi.getChatPicture(sessionId, groupId),
    onSuccess: (data) => {
      setCurrentPicture(data.url)
      setResponse(data)
      toast.success('Picture retrieved')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to get picture')
    }
  })

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

  const deletePictureMutation = useMutation({
    mutationFn: () => sessionApi.deletePicture(sessionId, groupId),
    onSuccess: (data) => {
      toast.success('Picture removed successfully')
      setCurrentPicture(null)
      setResponse(data)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove picture')
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                    variant="outline"
                    onClick={() => getPictureMutation.mutate()} 
                    disabled={!groupId || getPictureMutation.isPending}
                >
                {getPictureMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
                Get Picture
                </Button>

                <Button 
                    onClick={() => setPictureMutation.mutate()} 
                    disabled={!groupId || !imageUrl || setPictureMutation.isPending}
                >
                {setPictureMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Set Picture
                </Button>

                <Button 
                    variant="destructive"
                    onClick={() => deletePictureMutation.mutate()} 
                    disabled={!groupId || deletePictureMutation.isPending}
                >
                {deletePictureMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                Delete Picture
                </Button>
            </div>

            {currentPicture && (
                <div className="mt-4 flex justify-center p-4 border rounded-lg bg-muted/20">
                    <img src={currentPicture} alt="Group" className="max-h-[200px] rounded-lg object-contain" />
                </div>
            )}
            
            <ResponseDisplay data={response} />
         </div>
      </div>

      <div className="space-y-4">
        <ApiExample 
            method="GET" 
            url={`/api/sessions/${sessionId}/groups/{id}/picture`}
            description="Get group picture."
            parameters={[{ name: "id", type: "string", required: true, description: "Group ID" }]}
            responseExample={{
              "url": "https://..."
            }}
            responseDescription="Returns the picture URL."
        />
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
        <ApiExample 
            method="DELETE" 
            url={`/api/sessions/${sessionId}/groups/{id}/picture`}
            description="Delete group picture."
            parameters={[{ name: "id", type: "string", required: true, description: "Group ID" }]}
            responseExample={{
              "success": true,
              "message": "Picture deleted"
            }}
            responseDescription="Returns confirmation."
        />
      </div>
    </div>
  )
}
