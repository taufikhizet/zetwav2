import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'
import { ResponseDisplay } from '../../ResponseDisplay'

interface PollVoteTabProps {
  sessionId: string
}

export function PollVoteTab({ sessionId }: PollVoteTabProps) {
  const [votePollId, setVotePollId] = useState('')
  const [voteOptions, setVoteOptions] = useState<string[]>([''])
  const [voteTo, setVoteTo] = useState('')
  const [response, setResponse] = useState<any>(null)

  const sendPollVoteMutation = useMutation({
    mutationFn: () => sessionApi.sendPollVote(sessionId, {
      to: voteTo,
      pollMessageId: votePollId,
      selectedOptions: voteOptions.filter(o => o.trim() !== '')
    }),
    onSuccess: (data) => {
      toast.success('Poll vote sent successfully')
      setResponse(data)
      setVotePollId('')
      setVoteOptions([''])
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send poll vote')
    }
  })

  const handleAddOption = () => setVoteOptions([...voteOptions, ''])
  const handleRemoveOption = (index: number) => {
    const newOptions = [...voteOptions]
    newOptions.splice(index, 1)
    setVoteOptions(newOptions)
  }
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...voteOptions]
    newOptions[index] = value
    setVoteOptions(newOptions)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
         <h3 className="font-semibold mb-4">Vote on Poll</h3>
         <div className="grid gap-6">
            <div className="grid gap-2">
              <Label>Recipient (To)</Label>
              <Input value={voteTo} onChange={(e) => setVoteTo(e.target.value)} placeholder="e.g. 6281234567890" />
            </div>
            <div className="grid gap-2">
              <Label>Poll Message ID</Label>
              <Input value={votePollId} onChange={(e) => setVotePollId(e.target.value)} placeholder="Poll Message ID" className="font-mono" />
            </div>
            
            <div className="space-y-3">
              <Label>Selected Options</Label>
              <p className="text-[11px] text-muted-foreground -mt-2">Enter the option text exactly as it appears in the poll.</p>
              {voteOptions.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input 
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                  />
                  {voteOptions.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveOption(index)}>
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={handleAddOption} className="w-full">
                <Plus className="mr-2 h-3 w-3" /> Add Option
              </Button>
            </div>

            <Button 
              onClick={() => sendPollVoteMutation.mutate()} 
              disabled={!voteTo || !votePollId || voteOptions.filter(o => o.trim() !== '').length === 0 || sendPollVoteMutation.isPending} 
              className="w-full"
            >
              {sendPollVoteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Cast Vote'}
            </Button>
            
            <ResponseDisplay data={response} />
         </div>
      </div>

      <ApiExample 
        method="POST" 
        url={`/api/sessions/${sessionId}/messages/poll-vote`}
        body={{
          to: voteTo || "6281234567890",
          pollMessageId: votePollId || "false_1234567890@c.us_3EB0...",
          selectedOptions: voteOptions.filter(o => o.trim() !== '').length > 0 ? voteOptions.filter(o => o.trim() !== '') : ["Option 1"]
        }}
        description="Vote on a poll message."
        parameters={[
          { name: "to", type: "string", required: true, description: "Recipient's phone number" },
          { name: "pollMessageId", type: "string", required: true, description: "ID of the poll message" },
          { name: "selectedOptions", type: "string[]", required: true, description: "Array of selected option texts" }
        ]}
        responseExample={null}
        responseDescription="Returns 200 OK with no content."
      />
    </div>
  )
}
