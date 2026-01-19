import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { BarChart2, Plus, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'
import { ResponseDisplay } from '../../ResponseDisplay'

interface PollTabProps {
  sessionId: string
}

export function PollTab({ sessionId }: PollTabProps) {
  // Poll Message State
  const [pollTo, setPollTo] = useState('')
  const [pollName, setPollName] = useState('')
  const [pollOptions, setPollOptions] = useState(['', ''])
  const [pollMultiple, setPollMultiple] = useState(false)
  const [replyTo, setReplyTo] = useState('')
  const [response, setResponse] = useState<any>(null)

  const sendPollMutation = useMutation({
    mutationFn: () => sessionApi.sendPoll(sessionId, {
      to: pollTo,
      name: pollName,
      options: pollOptions.filter(o => o.trim() !== ''),
      multipleAnswers: pollMultiple,
      // @ts-ignore
      reply_to: replyTo || undefined
    }),
    onSuccess: (data) => {
      toast.success('Poll sent successfully')
      setResponse(data)
      setPollName('')
      setPollOptions(['', ''])
      setReplyTo('')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send poll')
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
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
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

            <div className="flex items-center space-x-2 pt-2">
              <Switch 
                id="multiple" 
                checked={pollMultiple}
                onCheckedChange={setPollMultiple}
              />
              <Label htmlFor="multiple">Allow Multiple Answers</Label>
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
            
            <ResponseDisplay data={response} />
         </div>
      </div>

      <ApiExample 
        method="POST" 
        url={`/api/sessions/${sessionId}/messages/send-poll`}
        body={{
          to: pollTo || "6281234567890",
          name: pollName || "What is your favorite color?",
          options: pollOptions.filter(o => o).length > 0 ? pollOptions.filter(o => o) : ["Red", "Blue", "Green"],
          multipleAnswers: pollMultiple,
          reply_to: replyTo || null
        }}
        description="Send a poll message with multiple options."
        parameters={[
          { name: "to", type: "string", required: true, description: "Recipient's phone number" },
          { name: "name", type: "string", required: true, description: "Poll question/title" },
          { name: "options", type: "string[]", required: true, description: "Array of poll options (min 2)" },
          { name: "multipleAnswers", type: "boolean", required: false, description: "Allow multiple answers (default: false)" },
          { name: "selectableCount", type: "number", required: false, description: "Number of selectable options (overrides multipleAnswers)" },
          { name: "reply_to", type: "string | null", required: false, description: "ID of the message to reply to (optional)" }
        ]}
        responseExample={{
          "id": {
            "fromMe": true,
            "remote": "6281234567890@c.us",
            "id": "3EB0...",
            "_serialized": "true_6281234567890@c.us_3EB0..."
          },
          "ack": 0,
          "hasMedia": false,
          "body": "POLL: What is your favorite color?",
          "type": "poll_creation",
          "timestamp": 1705641234,
          "from": "6289876543210@c.us",
          "to": "6281234567890@c.us",
          "deviceType": "android",
          "isForwarded": false,
          "forwardingScore": 0,
          "isStatus": false,
          "isStarred": false,
          "broadcast": false,
          "fromMe": true,
          "hasQuotedMsg": false,
          "location": null,
          "vCards": [],
          "mentionedIds": [],
          "isGif": false,
          "links": []
        }}
        responseDescription="Returns the poll message object that was sent."
      />
    </div>
  )
}
