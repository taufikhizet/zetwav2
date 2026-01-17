/**
 * API Key Card Component
 */

import {
  KeyRound,
  Calendar,
  AlertTriangle,
  Hash,
  Shield,
  RefreshCw,
  Trash2,
  MoreVertical,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import type { ApiKey } from '../types'
import { 
  isExpired, 
  formatRelativeDate, 
  formatUsageCount 
} from '../utils'

interface ApiKeyCardProps {
  apiKey: ApiKey
  onToggleActive?: (id: string, isActive: boolean) => void
  onEditScopes: (apiKey: ApiKey) => void
  onRegenerate: (apiKey: ApiKey) => void
  onDelete: (apiKey: ApiKey) => void
  isUpdating?: boolean
  viewMode?: 'grid' | 'list'
}

export function ApiKeyCard({
  apiKey,
  onToggleActive,
  onEditScopes,
  onRegenerate,
  onDelete,
  isUpdating,
  viewMode = 'grid',
}: ApiKeyCardProps) {
  const expired = isExpired(apiKey.expiresAt)
  const isDisabled = !apiKey.isActive || expired

  const getStatusBadge = () => {
    if (expired) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          Expired
        </Badge>
      )
    }
    if (!apiKey.isActive) {
      return <Badge variant="secondary">Inactive</Badge>
    }
    return null
  }

  if (viewMode === 'list') {
    return (
      <Card className={`transition-all ${isDisabled ? 'opacity-60 bg-muted/30' : 'hover:shadow-md hover:-translate-y-0.5'}`}>
        <div className="flex flex-col sm:flex-row items-center p-4 gap-4">
          {/* Icon & Basic Info */}
          <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
            <div className={`p-2.5 rounded-xl shrink-0 ${isDisabled ? 'bg-muted' : 'bg-primary/10'}`}>
              <KeyRound className={`h-5 w-5 ${isDisabled ? 'text-muted-foreground' : 'text-primary'}`} />
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base truncate">{apiKey.name}</h3>
                {getStatusBadge()}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <code className="bg-muted/50 px-1.5 py-0.5 rounded font-mono truncate max-w-[150px] border">
                  {apiKey.keyPreview.replace('...', '••••')}
                </code>
                {apiKey.description && (
                  <span className="truncate hidden sm:inline-block border-l pl-2 max-w-[200px]">
                    {apiKey.description}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats - Hidden on very small screens, visible on md+ */}
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5" title="Created Date">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatRelativeDate(apiKey.createdAt)}</span>
            </div>
            {apiKey.usageCount > 0 && (
              <div className="flex items-center gap-1.5" title="Total Requests">
                <Hash className="h-3.5 w-3.5" />
                <span>{formatUsageCount(apiKey.usageCount)}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5" title="Scopes">
              <Shield className="h-3.5 w-3.5" />
              <span>{apiKey.scopes.length} scopes</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 border-t sm:border-t-0 pt-2 sm:pt-0">
             <div className="flex items-center gap-2 mr-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Switch
                        checked={apiKey.isActive}
                        onCheckedChange={(checked) => onToggleActive?.(apiKey.id, checked)}
                        disabled={isUpdating || !onToggleActive}
                        className="scale-90"
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      {apiKey.isActive ? 'Deactivate key' : 'Activate key'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
             </div>
             
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => onEditScopes(apiKey)}>
                        <Shield className="mr-2 h-4 w-4" />
                        Edit Scopes
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onRegenerate(apiKey)}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Regenerate Key
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                        onClick={() => onDelete(apiKey)} 
                        className="text-destructive focus:text-destructive"
                    >
                        <Trash2 className="mr-2 h-4 w-4" /> 
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`transition-all ${isDisabled ? 'opacity-60 bg-muted/30' : 'hover:shadow-md hover:-translate-y-1'}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${isDisabled ? 'bg-muted' : 'bg-primary/10'}`}>
                <KeyRound className={`h-5 w-5 ${isDisabled ? 'text-muted-foreground' : 'text-primary'}`} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{apiKey.name}</h3>
                  {getStatusBadge()}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <code className="block bg-muted/50 px-3 py-1.5 rounded-md font-mono text-sm border">
                {apiKey.keyPreview.replace('...', '••••')}
              </code>
              {apiKey.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {apiKey.description}
                </p>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8 text-muted-foreground hover:text-foreground">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onEditScopes(apiKey)}>
                <Shield className="mr-2 h-4 w-4" />
                Edit Scopes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRegenerate(apiKey)}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate Key
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(apiKey)} 
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" /> 
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-6 pt-4 border-t grid grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{formatRelativeDate(apiKey.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2 justify-end">
             <div className="flex items-center gap-2 mr-2">
                <span className="text-xs">{apiKey.isActive ? 'Active' : 'Inactive'}</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Switch
                        checked={apiKey.isActive}
                        onCheckedChange={(checked) => onToggleActive?.(apiKey.id, checked)}
                        disabled={isUpdating || !onToggleActive}
                        className="scale-75 origin-right"
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      {apiKey.isActive ? 'Deactivate key' : 'Activate key'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
             </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
