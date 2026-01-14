/**
 * API Keys Page Component
 * 
 * Modern, clean page for managing API keys with comprehensive features:
 * - Stats overview
 * - Create, edit, delete, and regenerate keys
 * - Granular scope management
 * - Usage tracking
 */

import { useState, useMemo } from 'react'
import { Plus, KeyRound, Info, Search, Filter, Loader2, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import type { ApiKey } from './types'
import { useApiKeys, useApiKeyStats } from './hooks'
import { getKeyStatus } from './utils'
import {
  ApiKeyStatsCards,
  ApiKeyCard,
  ApiKeyEmptyState,
  CreateApiKeyDialog,
  EditScopesDialog,
  DeleteApiKeyDialog,
  RegenerateApiKeyDialog,
} from './components'

type FilterStatus = 'all' | 'active' | 'inactive' | 'expired'

export function ApiKeysPage() {
  // Data fetching
  const { data: apiKeys = [], isLoading, refetch, isRefetching } = useApiKeys()
  const { data: stats } = useApiKeyStats()

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editScopesKey, setEditScopesKey] = useState<ApiKey | null>(null)
  const [deleteKey, setDeleteKey] = useState<ApiKey | null>(null)
  const [regenerateKey, setRegenerateKey] = useState<ApiKey | null>(null)

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')

  // Filter and search logic
  const filteredKeys = useMemo(() => {
    return apiKeys.filter((key) => {
      // Search filter
      const matchesSearch =
        searchQuery === '' ||
        key.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        key.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        key.keyPreview.toLowerCase().includes(searchQuery.toLowerCase())

      // Status filter
      const status = getKeyStatus(key)
      const matchesStatus =
        statusFilter === 'all' || status.toLowerCase() === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [apiKeys, searchQuery, statusFilter])

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading API keys...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <KeyRound className="h-8 w-8 text-primary" />
            API Keys
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage API keys for programmatic access to your WhatsApp sessions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create API Key
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && <ApiKeyStatsCards stats={stats} />}

      {/* Info Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Info className="h-5 w-5" />
            How API Keys Work
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-1">
              <p className="font-medium text-blue-800 dark:text-blue-200">🔐 Secure Access</p>
              <p className="text-blue-600 dark:text-blue-400">
                API keys are hashed and securely stored. You can only see the full key once
                when creating or regenerating.
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-blue-800 dark:text-blue-200">🎯 Granular Permissions</p>
              <p className="text-blue-600 dark:text-blue-400">
                Assign specific scopes to each key. Grant only the permissions your
                application needs.
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-blue-800 dark:text-blue-200">📊 Usage Tracking</p>
              <p className="text-blue-600 dark:text-blue-400">
                Monitor API usage with request counts and last access information for each
                key.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      {apiKeys.length === 0 ? (
        <ApiKeyEmptyState onCreateClick={() => setCreateDialogOpen(true)} />
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Your API Keys</CardTitle>
                <CardDescription>
                  {filteredKeys.length} of {apiKeys.length} keys
                </CardDescription>
              </div>

              {/* Search and Filter */}
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search keys..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-full sm:w-[200px]"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={(value: FilterStatus) => setStatusFilter(value)}
                >
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {filteredKeys.length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No keys found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredKeys.map((key) => (
                  <ApiKeyCard
                    key={key.id}
                    apiKey={key}
                    onEditScopes={setEditScopesKey}
                    onDelete={setDeleteKey}
                    onRegenerate={setRegenerateKey}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <CreateApiKeyDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

      <EditScopesDialog
        apiKey={editScopesKey}
        open={!!editScopesKey}
        onOpenChange={(open) => !open && setEditScopesKey(null)}
      />

      <DeleteApiKeyDialog
        apiKey={deleteKey}
        open={!!deleteKey}
        onOpenChange={(open) => !open && setDeleteKey(null)}
      />

      <RegenerateApiKeyDialog
        apiKey={regenerateKey}
        open={!!regenerateKey}
        onOpenChange={(open) => !open && setRegenerateKey(null)}
      />
    </div>
  )
}
