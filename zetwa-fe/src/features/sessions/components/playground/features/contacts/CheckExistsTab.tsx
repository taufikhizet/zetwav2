
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, X, Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'

interface CheckExistsTabProps {
  sessionId: string
}

export function CheckExistsTab({ sessionId }: CheckExistsTabProps) {
  const [number, setNumber] = useState('')
  const [checkTrigger, setCheckTrigger] = useState('')

  const { data: status, isLoading } = useQuery({
    queryKey: ['check-number', sessionId, checkTrigger],
    queryFn: () => sessionApi.checkNumber(sessionId, checkTrigger),
    enabled: !!checkTrigger,
    retry: false
  })

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
         <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Phone Number</Label>
              <div className="flex gap-2">
                  <Input 
                    placeholder="6281234567890" 
                    value={number} 
                    onChange={(e) => setNumber(e.target.value)} 
                    className="font-mono"
                  />
                  <Button onClick={() => setCheckTrigger(number)} disabled={!number || isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    <span className="ml-2">Check</span>
                  </Button>
              </div>
            </div>
            
            {status && (
                 <div className="flex flex-col items-center gap-4 mt-4 p-6 border rounded-lg bg-muted/30">
                   <div className={`p-4 rounded-full ${status.numberExists ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                     {status.numberExists ? <Check className="h-8 w-8" /> : <X className="h-8 w-8" />}
                   </div>
                   <div className="text-center space-y-1">
                     <h4 className="font-bold text-xl">
                       {status.numberExists ? 'Registered' : 'Not Registered'}
                     </h4>
                     {status.numberExists && (
                       <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-background border rounded-full text-xs font-mono text-muted-foreground shadow-sm select-all">
                         {status.id?._serialized}
                       </div>
                     )}
                   </div>
                 </div>
            )}
         </div>
      </div>

      <ApiExample 
          method="GET" 
          url={`/api/sessions/${sessionId}/contacts/check-exists`}
          description="Check if phone number is registered on WhatsApp."
          parameters={[{ name: "number", type: "string", required: true, description: "Phone Number" }]}
          responseExample={{
            "numberExists": true,
            "id": { "_serialized": "628123...@c.us" }
          }}
          responseDescription="Returns registration status."
      />
    </div>
  )
}
