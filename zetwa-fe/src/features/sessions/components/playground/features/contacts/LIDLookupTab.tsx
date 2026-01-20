
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'
import { ResponseDisplay } from '../../ResponseDisplay'

interface LIDLookupTabProps {
  sessionId: string
}

export function LIDLookupTab({ sessionId }: LIDLookupTabProps) {
  const [activeTab, setActiveTab] = useState('by-lid')
  const [lidInput, setLidInput] = useState('')
  const [pnInput, setPnInput] = useState('')
  const [triggerLid, setTriggerLid] = useState('')
  const [triggerPn, setTriggerPn] = useState('')

  const { data: resultLid, isLoading: isLoadingLid } = useQuery({
    queryKey: ['lid-by-lid', sessionId, triggerLid],
    queryFn: () => sessionApi.getPNByLid(sessionId, triggerLid),
    enabled: !!triggerLid,
    retry: false
  })

  const { data: resultPn, isLoading: isLoadingPn } = useQuery({
    queryKey: ['lid-by-pn', sessionId, triggerPn],
    queryFn: () => sessionApi.getLidByPN(sessionId, triggerPn),
    enabled: !!triggerPn,
    retry: false
  })

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
         <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="by-lid">By LID</TabsTrigger>
                <TabsTrigger value="by-pn">By Phone Number</TabsTrigger>
            </TabsList>

            <TabsContent value="by-lid" className="space-y-4">
                <div className="grid gap-2">
                    <Label>LID</Label>
                    <div className="flex gap-2">
                        <Input 
                            placeholder="123456...@lid" 
                            value={lidInput} 
                            onChange={(e) => setLidInput(e.target.value)} 
                            className="font-mono"
                        />
                        <Button onClick={() => setTriggerLid(lidInput)} disabled={!lidInput || isLoadingLid}>
                            {isLoadingLid ? <Loader2 className="h-4 w-4 animate-spin"/> : <Search className="h-4 w-4"/>}
                        </Button>
                    </div>
                </div>
                <ResponseDisplay data={resultLid} />
            </TabsContent>

            <TabsContent value="by-pn" className="space-y-4">
                <div className="grid gap-2">
                    <Label>Phone Number</Label>
                    <div className="flex gap-2">
                        <Input 
                            placeholder="6281234567890" 
                            value={pnInput} 
                            onChange={(e) => setPnInput(e.target.value)} 
                            className="font-mono"
                        />
                        <Button onClick={() => setTriggerPn(pnInput)} disabled={!pnInput || isLoadingPn}>
                            {isLoadingPn ? <Loader2 className="h-4 w-4 animate-spin"/> : <Search className="h-4 w-4"/>}
                        </Button>
                    </div>
                </div>
                <ResponseDisplay data={resultPn} />
            </TabsContent>
         </Tabs>
      </div>

      <div className="space-y-4">
        <ApiExample 
            method="GET" 
            url={`/api/sessions/${sessionId}/lids/{lid}`}
            description="Get phone number by lid."
            parameters={[{ name: "lid", type: "string", required: true, description: "LID" }]}
            responseExample={{ "lid": "...", "pn": "..." }}
            responseDescription="Returns mapping."
        />
        <ApiExample 
            method="GET" 
            url={`/api/sessions/${sessionId}/lids/pn/{phoneNumber}`}
            description="Get lid by phone number."
            parameters={[{ name: "phoneNumber", type: "string", required: true, description: "Phone Number" }]}
            responseExample={{ "lid": "...", "pn": "..." }}
            responseDescription="Returns mapping."
        />
      </div>
    </div>
  )
}
