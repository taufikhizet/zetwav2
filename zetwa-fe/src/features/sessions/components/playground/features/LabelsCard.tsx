import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Tag, Plus, Edit, Trash2, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../ApiExample'

interface LabelsCardProps {
  sessionId: string
}

export function LabelsCard({ sessionId }: LabelsCardProps) {
  const [activeTab, setActiveTab] = useState('list')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState<any>(null)
  
  // Form States
  const [name, setName] = useState('')
  const [color, setColor] = useState('')

  // Get Labels Query
  const { data: labels, isLoading: isLoadingLabels, refetch: refetchLabels } = useQuery({
    queryKey: ['labels', sessionId],
    queryFn: () => sessionApi.getLabels(sessionId),
    enabled: activeTab === 'list',
  })

  // Create Label Mutation
  const createLabelMutation = useMutation({
    mutationFn: () => sessionApi.createLabel(sessionId, { name, color: color || undefined }),
    onSuccess: () => {
      toast.success('Label created successfully')
      setIsCreateOpen(false)
      setName('')
      setColor('')
      refetchLabels()
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create label')
    }
  })

  // Update Label Mutation
  const updateLabelMutation = useMutation({
    mutationFn: () => sessionApi.updateLabel(sessionId, selectedLabel.id, { name, color: color || undefined }),
    onSuccess: () => {
      toast.success('Label updated successfully')
      setIsEditOpen(false)
      setSelectedLabel(null)
      setName('')
      setColor('')
      refetchLabels()
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update label')
    }
  })

  // Delete Label Mutation
  const deleteLabelMutation = useMutation({
    mutationFn: (labelId: string) => sessionApi.deleteLabel(sessionId, labelId),
    onSuccess: () => {
      toast.success('Label deleted successfully')
      refetchLabels()
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete label')
    }
  })

  const handleEditClick = (label: any) => {
    setSelectedLabel(label)
    setName(label.name)
    setColor(label.hexColor || '')
    setIsEditOpen(true)
  }

  const handleDeleteClick = (labelId: string) => {
    if (confirm('Are you sure you want to delete this label?')) {
      deleteLabelMutation.mutate(labelId)
    }
  }

  return (
    <div className="h-full">
      <CardHeader>
        <CardTitle>Labels</CardTitle>
        <CardDescription>Manage WhatsApp Business labels.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-1 mb-6">
            <TabsTrigger value="list">Manage Labels</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => refetchLabels()} disabled={isLoadingLabels}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingLabels ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" /> New Label
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Label</DialogTitle>
                    <DialogDescription>Add a new label to organize chats.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Important" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="color">Color (Hex)</Label>
                      <div className="flex gap-2">
                        <Input id="color" value={color} onChange={(e) => setColor(e.target.value)} placeholder="e.g. #FF5733" />
                        <div className="w-10 h-10 rounded border" style={{ backgroundColor: color || '#ffffff' }} />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => createLabelMutation.mutate()} disabled={!name || createLabelMutation.isPending}>
                      {createLabelMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Create
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="rounded-md border h-[400px] overflow-hidden">
              <div className="h-full overflow-y-auto">
                {isLoadingLabels ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mb-2" />
                    <p>Loading labels...</p>
                  </div>
                ) : labels && labels.length > 0 ? (
                  <div className="divide-y">
                    {labels.map((label: any) => (
                      <div key={label.id} className="p-3 hover:bg-muted/50 transition-colors flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <Tag className="h-4 w-4" style={{ color: label.hexColor }} />
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {label.name}
                              <Badge variant="outline" className="text-[10px] h-4 px-1">{label.count || 0}</Badge>
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">ID: {label.id}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(label)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteClick(label.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Tag className="h-8 w-8 mb-2 opacity-20" />
                    <p>No labels found</p>
                  </div>
                )}
              </div>
            </div>

            <ApiExample 
              method="GET" 
              url={`/api/sessions/${sessionId}/labels`}
              description="Get all labels (WA Business only)."
            />
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Label</DialogTitle>
              <DialogDescription>Update label details.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-color">Color (Hex)</Label>
                <div className="flex gap-2">
                  <Input id="edit-color" value={color} onChange={(e) => setColor(e.target.value)} />
                  <div className="w-10 h-10 rounded border" style={{ backgroundColor: color || '#ffffff' }} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => updateLabelMutation.mutate()} disabled={!name || updateLabelMutation.isPending}>
                {updateLabelMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </div>
  )
}
