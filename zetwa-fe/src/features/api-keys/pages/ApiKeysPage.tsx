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
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, Loader2, RefreshCw, LayoutGrid, List } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import type { ApiKey } from '../types'
import { useApiKeys, useApiKeyStats, useUpdateApiKey } from '../hooks'
import { getKeyStatus } from '../utils'
import {
  ApiKeyStatsCards,
  ApiKeyCard,
  ApiKeyEmptyState,
  EditScopesDialog,
  DeleteApiKeyDialog,
  RegenerateApiKeyDialog,
} from '../components'

type FilterStatus = 'all' | 'active' | 'inactive' | 'expired'

export function ApiKeysPage() {
  const navigate = useNavigate()
  
  // Data fetching
  const { data: apiKeys = [], isLoading, refetch, isRefetching } = useApiKeys()
  const { data: stats } = useApiKeyStats()

  // Mutation for toggling active state
  const updateApiKeyMutation = useUpdateApiKey()

  // Dialog states
  const [editScopesKey, setEditScopesKey] = useState<ApiKey | null>(null)
  const [deleteKey, setDeleteKey] = useState<ApiKey | null>(null)
  const [regenerateKey, setRegenerateKey] = useState<ApiKey | null>(null)

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

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


      {/* Stats Cards */}
      {apiKeys.length > 0 && stats && <ApiKeyStatsCards stats={stats} />}

      {/* Filters & Actions */}
      {apiKeys.length > 0 && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search keys..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 shadow-inner"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: FilterStatus) => setStatusFilter(value)}>
              <SelectTrigger className="w-[160px] shadow-inner">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
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
          
          <div className="flex items-center gap-2">
             <Button onClick={() => navigate('/dashboard/api-keys/new')} size="sm" className="rounded-lg shadow-sm bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                New API Key
             </Button>
             <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => refetch()} 
                disabled={isRefetching}
                className="text-muted-foreground hover:text-foreground"
             >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
                Refresh
             </Button>
              <div className="h-8 w-px bg-border mx-1" />
              <div className="flex items-center bg-gray-50/50 dark:bg-secondary/20 rounded-lg p-1 shadow-inner">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                 size="icon"
                 className="h-8 w-8 rounded-md shadow-none"
                 onClick={() => setViewMode('grid')}
               >
                 <LayoutGrid className="h-4 w-4" />
               </Button>
               <Button
                 variant={viewMode === 'list' ? 'default' : 'ghost'}
                 size="icon"
                 className="h-8 w-8 rounded-md shadow-none"
                 onClick={() => setViewMode('list')}
               >
                 <List className="h-4 w-4" />
               </Button>
             </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {apiKeys.length === 0 ? (
        <ApiKeyEmptyState onCreateClick={() => navigate('/dashboard/api-keys/new')} />
      ) : (
        <>
          {filteredKeys.length === 0 ? (
            <Card className="border-dashed border-2 bg-transparent shadow-none">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Search className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No keys found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filter criteria
                </p>
                <Button
                  variant="outline"
                  className="mt-6"
                  onClick={() => {
                    setSearchQuery('')
                    setStatusFilter('all')
                  }}
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className={
              viewMode === 'grid'
                ? "grid gap-6 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
                : "grid gap-4"
            }>
              {filteredKeys.map((key) => (
                <ApiKeyCard
                  key={key.id}
                  apiKey={key}
                  viewMode={viewMode}
                  onToggleActive={(id, isActive) => {
                    updateApiKeyMutation.mutate({ id, data: { isActive } })
                  }}
                  onEditScopes={setEditScopesKey}
                  onDelete={setDeleteKey}
                  onRegenerate={setRegenerateKey}
                  isUpdating={updateApiKeyMutation.isPending}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Dialogs */}
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
