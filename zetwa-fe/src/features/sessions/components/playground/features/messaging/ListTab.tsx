import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { List, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { sessionApi } from '@/features/sessions/api/session.api'

interface ListTabProps {
  sessionId: string
}

export function ListTab({ sessionId }: ListTabProps) {
  const [listTo, setListTo] = useState('')
  const [listBody, setListBody] = useState('')
  const [listTitle, setListTitle] = useState('')
  const [listBtnText, setListBtnText] = useState('Menu')
  const [listSections] = useState<{title: string, rows: {id: string, title: string, description?: string}[]}[]>([
    { title: 'Section 1', rows: [{ id: 'row1', title: 'Option 1', description: 'Description 1' }] }
  ])
  const [replyTo, setReplyTo] = useState('')

  const sendListMutation = useMutation({
    mutationFn: () => sessionApi.sendList(sessionId, {
      to: listTo,
      body: listBody,
      buttonText: listBtnText,
      sections: listSections,
      title: listTitle,
      reply_to: replyTo || undefined
    }),
    onSuccess: () => {
      toast.success('List message sent successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send list')
    }
  })

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
         <div className="grid gap-6">
            <div className="grid gap-2">
              <Label>Phone Number</Label>
              <Input value={listTo} onChange={(e) => setListTo(e.target.value)} placeholder="e.g. 6281234567890" className="font-mono" />
            </div>
            <div className="grid gap-2">
              <Label>Title (Optional)</Label>
              <Input value={listTitle} onChange={(e) => setListTitle(e.target.value)} placeholder="List Title" />
            </div>
            <div className="grid gap-2">
              <Label>Body</Label>
              <Textarea value={listBody} onChange={(e) => setListBody(e.target.value)} placeholder="Main message content..." />
            </div>
            <div className="grid gap-2">
              <Label>Button Text</Label>
              <Input value={listBtnText} onChange={(e) => setListBtnText(e.target.value)} placeholder="e.g. Show Menu" />
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
            {/* Simplified Section Editor - For detailed sections, using JSON or a simpler UI is better for now */}
            <Alert><AlertCircle className="h-4 w-4" /><AlertTitle>Info</AlertTitle><AlertDescription>Currently sending a default demo list structure.</AlertDescription></Alert>
            
            <Button className="w-full" onClick={() => sendListMutation.mutate()} disabled={!listTo || !listBody || !listBtnText || sendListMutation.isPending}>
              {sendListMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <List className="mr-2 h-4 w-4" />}
              Send List Message
            </Button>
         </div>
      </div>
    </div>
  )
}
