import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Image as ImageIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'
import { ResponseDisplay } from '../../ResponseDisplay'

interface GroupPictureGetTabProps {
  sessionId: string
}

export function GroupPictureGetTab({ sessionId }: GroupPictureGetTabProps) {
  const [groupId, setGroupId] = useState('')
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
                variant="outline"
                onClick={() => getPictureMutation.mutate()} 
                disabled={!groupId || getPictureMutation.isPending}
            >
            {getPictureMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
            Get Picture
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
          method="GET" 
          url={`/api/sessions/${sessionId}/groups/{id}/picture`}
          description="Get group picture."
          parameters={[{ name: "id", type: "string", required: true, description: "Group ID" }]}
          responseExample={{
            "url": "https://..."
          }}
          responseDescription="Returns the picture URL."
      />
    </div>
  )
}
