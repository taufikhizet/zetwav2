import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Tag, Plus, Edit, Trash2, Loader2, RefreshCw, MoreVertical } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
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
    <div className="h-full flex flex-col space-y-4">
      <CardHeader className="px-0 pt-0 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Tag className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Labels</CardTitle>
              <CardDescription>Manage WhatsApp Business labels</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="grid w-[240px] grid-cols-1">
            <TabsTrigger value="list">Manage Labels</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="list" className="flex-1 flex flex-col min-h-0 space-y-4 mt-0">
          <div className="flex justify-between items-center">
            <Button variant="outline" size="sm" onClick={() => refetchLabels()} disabled={isLoadingLabels} className="h-8">
               <RefreshCw className={`h-3.5 w-3.5 mr-2 ${isLoadingLabels ? 'animate-spin' : ''}`} />
               Refresh
            </Button>
            
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8">
                  <Plus className="h-3.5 w-3.5 mr-2" /> New Label
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
                      <Input 
                        id="color" 
                        value={color} 
                        onChange={(e) => setColor(e.target.value)} 
                        placeholder="e.g. #FF5733" 
                        className="font-mono"
                      />
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

          <div className="rounded-xl border bg-card flex-1 min-h-0 overflow-hidden flex flex-col shadow-sm">
             <ScrollArea className="flex-1">
                {isLoadingLabels ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
                    <p>Loading labels...</p>
                  </div>
                ) : labels && labels.length > 0 ? (
                  <div className="divide-y">
                    {labels.map((label: any) => (
                      <div key={label.id} className="p-3 hover:bg-muted/50 transition-all flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full flex items-center justify-center bg-muted/50 border">
                             <Tag className="h-4 w-4" style={{ color: label.hexColor }} />
                          </div>
                          <div>
                            <div className="font-medium flex items-center gap-2 text-sm">
                              {label.name}
                              <Badge variant="secondary" className="text-[10px] h-4 px-1 rounded-sm font-normal">{label.count || 0}</Badge>
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono">ID: {label.id}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <DropdownMenu>
                             <DropdownMenuTrigger asChild>
                               <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreVertical className="h-4 w-4" />
                               </Button>
                             </DropdownMenuTrigger>
                             <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditClick(label)}>
                                   <Edit className="h-4 w-4 mr-2" /> Edit Label
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                   onClick={() => handleDeleteClick(label.id)}
                                   className="text-destructive focus:text-destructive"
                                >
                                   <Trash2 className="h-4 w-4 mr-2" /> Delete Label
                                </DropdownMenuItem>
                             </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                    <div className="bg-muted p-4 rounded-full mb-3">
                      <Tag className="h-8 w-8 opacity-20" />
                    </div>
                    <p className="font-medium">No labels found</p>
                  </div>
                )}
             </ScrollArea>
          </div>

          <ApiExample 
            method="GET" 
            url={`/api/sessions/${sessionId}/labels`}
            description="Get all labels (WA Business only)."
            responseExample={[
              {
                "id": "1",
                "name": "New Customer",
                "hexColor": "#A4A4A4",
                "count": 5
              }
            ]}
            responseDescription="Returns a list of labels."
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
                <Input 
                  id="edit-color" 
                  value={color} 
                  onChange={(e) => setColor(e.target.value)} 
                  className="font-mono"
                />
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
    </div>
  )
}
