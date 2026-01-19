import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'
import { ResponseDisplay } from '../../ResponseDisplay'

interface GroupPictureDeleteTabProps {
  sessionId: string
}

export function GroupPictureDeleteTab({ sessionId }: GroupPictureDeleteTabProps) {
  const [groupId, setGroupId] = useState('')
  const [response, setResponse] = useState<any>(null)

  const deletePictureMutation = useMutation({
    mutationFn: () => sessionApi.deletePicture(sessionId, groupId),
    onSuccess: (data) => {
      toast.success('Picture removed successfully')
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
            
            <Button 
                variant="destructive"
                onClick={() => deletePictureMutation.mutate()} 
                disabled={!groupId || deletePictureMutation.isPending}
            >
            {deletePictureMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            Delete Picture
            </Button>
            
            <ResponseDisplay data={response} />
         </div>
      </div>

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
  )
}
