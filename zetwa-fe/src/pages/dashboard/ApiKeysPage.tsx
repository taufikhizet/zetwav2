import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Plus,
  Key,
  Copy,
  Check,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  Calendar,
  Activity,
  AlertTriangle,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { apiKeyApi, type ApiKey } from '@/api/api-key.api'
import { formatDate, copyToClipboard } from '@/lib/utils'

export default function ApiKeysPage() {
  const queryClient = useQueryClient()

  const [createOpen, setCreateOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null)
  const [newKeyResult, setNewKeyResult] = useState<{ id: string; key: string } | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())

  // Form state
  const [form, setForm] = useState({
    name: '',
    expiresAt: '',
    scopes: ['sessions:read', 'sessions:write', 'messages:send'] as string[],
  })

  const { data: apiKeys = [], isLoading } = useQuery({
    queryKey: ['apiKeys'],
    queryFn: apiKeyApi.list,
  })

  const createMutation = useMutation({
    mutationFn: apiKeyApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] })
      setNewKeyResult(data)
      setForm({ name: '', expiresAt: '', scopes: ['sessions:read', 'sessions:write', 'messages:send'] })
    },
    onError: () => {
      toast.error('Failed to create API key')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiKeyApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] })
      toast.success('API key deleted')
      setDeleteOpen(false)
      setSelectedKey(null)
    },
    onError: () => {
      toast.error('Failed to delete API key')
    },
  })

  const handleCopy = async (text: string, id: string) => {
    await copyToClipboard(text)
    setCopiedId(id)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleKeyVisibility = (id: string) => {
    const newVisible = new Set(visibleKeys)
    if (newVisible.has(id)) {
      newVisible.delete(id)
    } else {
      newVisible.add(id)
    }
    setVisibleKeys(newVisible)
  }

  const handleCreate = () => {
    if (!form.name) {
      toast.error('Name is required')
      return
    }

    createMutation.mutate({
      name: form.name,
      expiresAt: form.expiresAt || undefined,
      scopes: form.scopes,
    })
  }

  const handleCloseCreate = () => {
    setCreateOpen(false)
    setNewKeyResult(null)
    setForm({ name: '', expiresAt: '', scopes: ['sessions:read', 'sessions:write', 'messages:send'] })
  }

  const availableScopes = [
    { value: 'sessions:read', label: 'Read Sessions', description: 'View session information' },
    { value: 'sessions:write', label: 'Write Sessions', description: 'Create, update, delete sessions' },
    { value: 'messages:send', label: 'Send Messages', description: 'Send WhatsApp messages' },
    { value: 'messages:read', label: 'Read Messages', description: 'View message history' },
    { value: 'webhooks:manage', label: 'Manage Webhooks', description: 'Create, update, delete webhooks' },
    { value: 'contacts:read', label: 'Read Contacts', description: 'View contacts information' },
  ]

  const toggleScope = (scope: string) => {
    if (form.scopes.includes(scope)) {
      setForm({ ...form, scopes: form.scopes.filter((s) => s !== scope) })
    } else {
      setForm({ ...form, scopes: [...form.scopes, scope] })
    }
  }

  const isExpired = (date: string | null) => {
    if (!date) return false
    return new Date(date) < new Date()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="text-muted-foreground mt-1">
            Manage API keys for external application access
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create API Key
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
        <CardContent className="flex items-start gap-4 py-4">
          <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-800 dark:text-blue-200">
              API Key Authentication
            </p>
            <p className="text-blue-700 dark:text-blue-300 mt-1">
              Use API keys to authenticate requests from external applications. Include the key in the{' '}
              <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">X-API-Key</code> header.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* API Keys List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : apiKeys.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Key className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No API Keys</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create an API key to integrate with external applications
            </p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create API Key
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {apiKeys.map((apiKey) => (
            <Card key={apiKey.id} className={isExpired(apiKey.expiresAt) ? 'opacity-60' : ''}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <Key className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-semibold truncate">{apiKey.name}</h3>
                      {isExpired(apiKey.expiresAt) && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Expired
                        </Badge>
                      )}
                    </div>
                    
                    {/* Key display */}
                    <div className="flex items-center gap-2 mt-3 font-mono text-sm">
                      <code className="flex-1 bg-muted px-3 py-2 rounded truncate">
                        {visibleKeys.has(apiKey.id) 
                          ? apiKey.keyPreview.replace('...', '••••••••••••••••••••')
                          : apiKey.keyPreview}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleKeyVisibility(apiKey.id)}
                      >
                        {visibleKeys.has(apiKey.id) ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopy(apiKey.keyPreview, apiKey.id)}
                      >
                        {copiedId === apiKey.id ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {/* Scopes */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {apiKey.scopes.map((scope) => (
                        <Badge key={scope} variant="secondary" className="text-xs">
                          {scope}
                        </Badge>
                      ))}
                    </div>

                    {/* Meta info */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Created {formatDate(apiKey.createdAt)}
                      </span>
                      {apiKey.expiresAt && (
                        <span className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          {isExpired(apiKey.expiresAt) ? 'Expired' : 'Expires'}{' '}
                          {formatDate(apiKey.expiresAt)}
                        </span>
                      )}
                      {apiKey.lastUsedAt && (
                        <span className="flex items-center gap-1">
                          Last used {formatDate(apiKey.lastUsedAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      setSelectedKey(apiKey)
                      setDeleteOpen(true)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={handleCloseCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {newKeyResult ? 'API Key Created' : 'Create API Key'}
            </DialogTitle>
            <DialogDescription>
              {newKeyResult
                ? 'Your API key has been created. Make sure to copy it now, you won\'t be able to see it again!'
                : 'Create a new API key for external application access'}
            </DialogDescription>
          </DialogHeader>

          {newKeyResult ? (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg">
                <Label className="text-green-700 dark:text-green-300">Your API Key</Label>
                <div className="flex items-center gap-2 mt-2">
                  <code className="flex-1 font-mono text-sm bg-white dark:bg-gray-900 px-3 py-2 rounded border break-all">
                    {newKeyResult.key}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(newKeyResult.key, 'new-key')}
                  >
                    {copiedId === 'new-key' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4 mt-0.5" />
                <p>
                  This is the only time you'll see this key. Store it securely!
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  placeholder="My Application"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Expiration (optional)</Label>
                <Input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for no expiration
                </p>
              </div>
              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="grid gap-2 mt-2">
                  {availableScopes.map((scope) => (
                    <label
                      key={scope.value}
                      className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={form.scopes.includes(scope.value)}
                        onChange={() => toggleScope(scope.value)}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="font-medium text-sm">{scope.label}</p>
                        <p className="text-xs text-muted-foreground">{scope.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {newKeyResult ? (
              <Button onClick={handleCloseCreate}>Done</Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleCloseCreate}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={createMutation.isPending || !form.name || form.scopes.length === 0}
                >
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create API Key
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete API Key</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedKey?.name}"? This action cannot be undone
              and any applications using this key will lose access.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedKey && deleteMutation.mutate(selectedKey.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
