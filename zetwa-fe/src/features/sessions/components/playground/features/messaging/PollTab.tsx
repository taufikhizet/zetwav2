import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { BarChart2, Loader2, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { sessionApi } from '@/features/sessions/api/session.api'

interface PollTabProps {
  sessionId: string
}

export function PollTab({ sessionId }: PollTabProps) {
  const [pollTo, setPollTo] = useState('')
  const [pollName, setPollName] = useState('')
  const [pollOptions, setPollOptions] = useState(['', ''])
  const [pollMultiple, setPollMultiple] = useState(false)
  const [replyTo, setReplyTo] = useState('')
  
  // Vote State
  const [votePollId, setVotePollId] = useState('')
  const [voteOptions, setVoteOptions] = useState<string[]>([])
  const [voteTo, setVoteTo] = useState('')

  const sendPollMutation = useMutation({
    mutationFn: () => sessionApi.sendPoll(sessionId, {
      to: pollTo,
      poll: {
        name: pollName,
        options: pollOptions.filter(o => o.trim() !== ''),
        multipleAnswers: pollMultiple
      },
      reply_to: replyTo || undefined
    }),
    onSuccess: () => {
      toast.success('Poll sent successfully')
      setPollName('')
      setPollOptions(['', ''])
      setReplyTo('')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send poll')
    }
  })

  const sendPollVoteMutation = useMutation({
    mutationFn: () => sessionApi.sendPollVote(sessionId, {
      to: voteTo,
      pollMessageId: votePollId,
      selectedOptions: voteOptions
    }),
    onSuccess: () => {
      toast.success('Poll vote sent successfully')
      setVotePollId('')
      setVoteOptions([])
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send poll vote')
    }
  })

  const handleAddPollOption = () => setPollOptions([...pollOptions, ''])
  const handleRemovePollOption = (index: number) => {
    const newOptions = [...pollOptions]
    newOptions.splice(index, 1)
    setPollOptions(newOptions)
  }
  const handlePollOptionChange = (index: number, value: string) => {
    const newOptions = [...pollOptions]
    newOptions[index] = value
    setPollOptions(newOptions)
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Send Poll */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
         <h3 className="font-semibold mb-4">Send Poll</h3>
         <div className="grid gap-6">
            <div className="grid gap-2">
              <Label>Phone Number</Label>
              <Input 
                placeholder="e.g. 6281234567890" 
                value={pollTo}
                onChange={(e) => setPollTo(e.target.value)}
                className="font-mono"
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Poll Question</Label>
              <Input 
                placeholder="What is your favorite color?" 
                value={pollName}
                onChange={(e) => setPollName(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <Label>Options</Label>
              {pollOptions.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input 
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => handlePollOptionChange(index, e.target.value)}
                  />
                  {pollOptions.length > 2 && (
                    <Button variant="ghost" size="icon" onClick={() => handleRemovePollOption(index)}>
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={handleAddPollOption} className="w-full">
                <Plus className="mr-2 h-3 w-3" /> Add Option
              </Button>
            </div>

            <div className="grid gap-2">
              <Label>Reply To Message ID (Optional)</Label>
              <Input 
                placeholder="e.g. false_1234567890@c.us_3EB0..." 
                value={replyTo}
                onChange={(e) => setReplyTo(e.target.value)}
                className="font-mono"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Switch 
                id="multiple" 
                checked={pollMultiple}
                onCheckedChange={setPollMultiple}
              />
              <Label htmlFor="multiple">Allow Multiple Answers</Label>
            </div>

            <Button 
              className="w-full" 
              onClick={() => sendPollMutation.mutate()}
              disabled={!pollTo || !pollName || pollOptions.filter(o => o).length < 2 || sendPollMutation.isPending}
            >
              {sendPollMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <BarChart2 className="mr-2 h-4 w-4" />
              )}
              Send Poll
            </Button>
         </div>
      </div>

      {/* Vote Poll */}
      <div className="rounded-xl border bg-card p-6 shadow-sm h-fit">
         <h3 className="font-semibold mb-4">Vote on Poll</h3>
         <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Recipient (To)</Label>
              <Input value={voteTo} onChange={(e) => setVoteTo(e.target.value)} placeholder="e.g. 6281234567890" />
            </div>
            <div className="grid gap-2">
              <Label>Poll Message ID</Label>
              <Input value={votePollId} onChange={(e) => setVotePollId(e.target.value)} placeholder="Poll Message ID" className="font-mono" />
            </div>
            <div className="grid gap-2">
              <Label>Selected Options (comma separated)</Label>
              <Input 
                value={voteOptions.join(',')} 
                onChange={(e) => setVoteOptions(e.target.value.split(',').map(s => s.trim()).filter(s => s))} 
                placeholder="Option1, Option2" 
              />
              <p className="text-[11px] text-muted-foreground">Enter the option text exactly as it appears in the poll.</p>
            </div>
            <Button onClick={() => sendPollVoteMutation.mutate()} disabled={!voteTo || !votePollId || voteOptions.length === 0 || sendPollVoteMutation.isPending}>
              {sendPollVoteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Cast Vote'}
            </Button>
         </div>
      </div>
    </div>
  )
}
