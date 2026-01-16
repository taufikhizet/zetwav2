/**
 * API Key Card Component
 */

import {
  Key,
  Calendar,
  Activity,
  AlertTriangle,
  Hash,
  Globe,
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
import { isExpired, formatRelativeDate, formatExpirationDate, getScopeBadgeVariant, formatUsageCount } from '../utils'

interface ApiKeyCardProps {
  apiKey: ApiKey
  onToggleActive?: (id: string, isActive: boolean) => void
  onEditScopes: (apiKey: ApiKey) => void
  onRegenerate: (apiKey: ApiKey) => void
  onDelete: (apiKey: ApiKey) => void
  isUpdating?: boolean
}

export function ApiKeyCard({
  apiKey,
  onToggleActive,
  onEditScopes,
  onRegenerate,
  onDelete,
  isUpdating,
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

  return (
    <Card className={`transition-all ${isDisabled ? 'opacity-60 bg-muted/30' : 'hover:shadow-md'}`}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`p-2.5 rounded-xl ${isDisabled ? 'bg-muted' : 'bg-primary/10'}`}>
            <Key className={`h-5 w-5 ${isDisabled ? 'text-muted-foreground' : 'text-primary'}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-base truncate">{apiKey.name}</h3>
                  {getStatusBadge()}
                </div>
                {apiKey.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {apiKey.description}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={apiKey.isActive}
                          onCheckedChange={(checked) => onToggleActive?.(apiKey.id, checked)}
                          disabled={isUpdating || !onToggleActive}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {apiKey.isActive ? 'Deactivate key' : 'Activate key'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
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
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDelete(apiKey)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Key Display - Masked preview only */}
            <div className="flex items-center">
              <code className="flex-1 bg-muted/50 px-3 py-2 rounded-lg font-mono text-sm truncate border">
                {apiKey.keyPreview.replace('...', '••••••••••••••••••••••••')}
              </code>
            </div>

            {/* Scopes */}
            <div className="flex flex-wrap gap-1.5">
              {apiKey.scopes.slice(0, 4).map((scope) => (
                <Badge key={scope} variant={getScopeBadgeVariant(scope)} className="text-xs font-normal">
                  {scope}
                </Badge>
              ))}
              {apiKey.scopes.length > 4 && (
                <Badge variant="outline" className="text-xs font-normal">
                  +{apiKey.scopes.length - 4} more
                </Badge>
              )}
            </div>

            {/* Meta Info */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap pt-1 border-t">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Created {formatRelativeDate(apiKey.createdAt)}
              </span>

              {apiKey.expiresAt && (
                <span className="flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5" />
                  {expired ? 'Expired' : 'Expires'} {expired ? formatRelativeDate(apiKey.expiresAt) : formatExpirationDate(apiKey.expiresAt)}
                </span>
              )}

              {apiKey.usageCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5" />
                  {formatUsageCount(apiKey.usageCount)} requests
                </span>
              )}

              {apiKey.lastUsedAt && (
                <span className="flex items-center gap-1.5">
                  Last used {formatRelativeDate(apiKey.lastUsedAt)}
                </span>
              )}

              {apiKey.lastIpAddress && (
                <span className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" />
                  {apiKey.lastIpAddress}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
