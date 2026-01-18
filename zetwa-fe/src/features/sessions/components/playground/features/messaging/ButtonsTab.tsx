import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Menu, Plus, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { sessionApi } from '@/features/sessions/api/session.api'

interface ButtonsTabProps {
  sessionId: string
}

export function ButtonsTab({ sessionId }: ButtonsTabProps) {
  const [buttonsTo, setButtonsTo] = useState('')
  const [buttonsBody, setButtonsBody] = useState('')
  const [buttonsTitle, setButtonsTitle] = useState('')
  const [buttonsFooter, setButtonsFooter] = useState('')
  const [buttonsList, setButtonsList] = useState<{id: string, text: string}[]>([{id: 'btn1', text: 'Button 1'}])
  const [replyTo, setReplyTo] = useState('')

  const sendButtonsMutation = useMutation({
    mutationFn: () => sessionApi.sendButtons(sessionId, {
      to: buttonsTo,
      body: buttonsBody,
      buttons: buttonsList,
      title: buttonsTitle,
      footer: buttonsFooter,
      // @ts-ignore
      reply_to: replyTo || undefined
    }),
    onSuccess: () => {
      toast.success('Buttons message sent successfully')
      setReplyTo('')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send buttons')
    }
  })

  const handleAddButton = () => setButtonsList([...buttonsList, { id: `btn${buttonsList.length + 1}`, text: '' }])
  const handleRemoveButton = (index: number) => {
    const newBtns = [...buttonsList]
    newBtns.splice(index, 1)
    setButtonsList(newBtns)
  }
  const handleButtonChange = (index: number, field: 'id' | 'text', value: string) => {
    const newBtns = [...buttonsList]
    newBtns[index] = { ...newBtns[index], [field]: value }
    setButtonsList(newBtns)
  }

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
       <div className="grid gap-6">
          <div className="grid gap-2">
            <Label>Phone Number</Label>
            <Input value={buttonsTo} onChange={(e) => setButtonsTo(e.target.value)} placeholder="e.g. 6281234567890" className="font-mono" />
          </div>
          <div className="grid gap-2">
            <Label>Title (Optional)</Label>
            <Input value={buttonsTitle} onChange={(e) => setButtonsTitle(e.target.value)} placeholder="Message Title" />
          </div>
          <div className="grid gap-2">
            <Label>Body</Label>
            <Textarea value={buttonsBody} onChange={(e) => setButtonsBody(e.target.value)} placeholder="Main message content..." />
          </div>
          <div className="grid gap-2">
            <Label>Footer (Optional)</Label>
            <Input value={buttonsFooter} onChange={(e) => setButtonsFooter(e.target.value)} placeholder="Footer text" />
          </div>
          <div className="space-y-3">
            <Label>Buttons (Max 3)</Label>
            {buttonsList.map((btn, index) => (
              <div key={index} className="flex gap-2">
                <Input placeholder="ID" className="w-20" value={btn.id} onChange={(e) => handleButtonChange(index, 'id', e.target.value)} />
                <Input placeholder="Button Text" value={btn.text} onChange={(e) => handleButtonChange(index, 'text', e.target.value)} />
                {buttonsList.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveButton(index)}><X className="h-4 w-4" /></Button>
                )}
              </div>
            ))}
            {buttonsList.length < 3 && (
              <Button variant="outline" size="sm" onClick={handleAddButton} className="w-full"><Plus className="mr-2 h-3 w-3" /> Add Button</Button>
            )}
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

          <Button className="w-full" onClick={() => sendButtonsMutation.mutate()} disabled={!buttonsTo || !buttonsBody || buttonsList.length === 0 || sendButtonsMutation.isPending}>
            {sendButtonsMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Menu className="mr-2 h-4 w-4" />}
            Send Buttons
          </Button>
       </div>
    </div>
  )
}
