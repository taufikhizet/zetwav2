/**
 * API Key Card Component
 */

import { useState } from 'react'
import {
  KeyRound,
  Calendar,
  Hash,
  Shield,
  RefreshCw,
  Trash2,
  MoreVertical,
  Clock,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"

import type { ApiKey } from '../types'
import { 
  isExpired, 
  formatRelativeDate, 
  formatUsageCount,
  formatExpirationDate
} from '../utils'

interface ApiKeyCardProps {
  apiKey: ApiKey
  onToggleActive?: (id: string, isActive: boolean) => void
  onEditScopes: (apiKey: ApiKey) => void
  onEditExpiration: (apiKey: ApiKey) => void
  onRegenerate: (apiKey: ApiKey) => void
  onDelete: (apiKey: ApiKey) => void
  isUpdating?: boolean
  viewMode?: 'grid' | 'list'
}

export function ApiKeyCard({
  apiKey,
  onToggleActive,
  onEditScopes,
  onEditExpiration,
  onRegenerate,
  onDelete,
  isUpdating,
  viewMode = 'grid',
}: ApiKeyCardProps) {
  const expired = isExpired(apiKey.expiresAt)
  const isDisabled = !apiKey.isActive || expired
  
  const [showToggleDialog, setShowToggleDialog] = useState(false)
  const [pendingToggleState, setPendingToggleState] = useState(false)

  const handleToggleClick = (checked: boolean) => {
    setPendingToggleState(checked)
    setShowToggleDialog(true)
  }

  const confirmToggle = () => {
    if (onToggleActive) {
      onToggleActive(apiKey.id, pendingToggleState)
    }
    setShowToggleDialog(false)
  }

  if (viewMode === 'list') {
    return (
      <>
        <Card className={`transition-all ${isDisabled ? 'bg-muted/80 shadow-[inset_0_3px_5px_0_rgba(0,0,0,0.2)]' : 'hover:shadow-md hover:-translate-y-0.5'}`}>
          <div className="flex flex-col sm:flex-row items-center p-4 gap-4">
            {/* Icon & Basic Info */}
            <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
              <div className={`p-2.5 rounded-xl shrink-0 ${isDisabled ? 'bg-muted' : 'bg-primary/10'}`}>
                <KeyRound className={`h-5 w-5 ${isDisabled ? 'text-muted-foreground' : 'text-primary'}`} />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-base truncate">{apiKey.name}</h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="bg-gray-50/50 dark:bg-secondary/20 shadow-inner transition-all px-2 py-0.5 rounded font-mono truncate max-w-[200px] w-full border-none focus-visible:shadow-[inset_0_2px_4px_0_hsl(var(--primary)/0.3)]">
                    {apiKey.keyPreview.replace('...', '••••')}
                  </div>
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
              {apiKey.expiresAt && (
                <div className={`flex items-center gap-1.5 ${expired ? 'text-destructive' : ''}`} title="Expiration Date">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{expired ? 'Expired ' : 'Expires '}{formatExpirationDate(apiKey.expiresAt)}</span>
                </div>
              )}
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
                  <Switch
                    checked={apiKey.isActive}
                    onCheckedChange={handleToggleClick}
                    disabled={isUpdating || !onToggleActive}
                  />
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
                      <DropdownMenuItem onClick={() => onEditExpiration(apiKey)}>
                          <Clock className="mr-2 h-4 w-4" />
                          Edit Expiration
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
        
        <AlertDialog open={showToggleDialog} onOpenChange={setShowToggleDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {pendingToggleState ? 'Activate API Key?' : 'Deactivate API Key?'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {pendingToggleState 
                  ? `Are you sure you want to activate "${apiKey.name}"? Applications will be able to use this key immediately.`
                  : `Are you sure you want to deactivate "${apiKey.name}"? Any applications using this key will lose access immediately.`
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmToggle}>
                {pendingToggleState ? 'Activate' : 'Deactivate'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    )
  }

  return (
    <>
      <Card className={`transition-all flex flex-col h-full ${isDisabled ? 'bg-muted/80 shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.1)]' : 'hover:shadow-md hover:-translate-y-1'}`}>
        <CardContent className="p-6 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${isDisabled ? 'bg-muted' : 'bg-primary/10'}`}>
                  <KeyRound className={`h-5 w-5 ${isDisabled ? 'text-muted-foreground' : 'text-primary'}`} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{apiKey.name}</h3>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="w-full bg-gray-50/50 dark:bg-secondary/20 shadow-inner transition-all px-3 py-2 rounded-md font-mono text-sm border-none focus-visible:shadow-[inset_0_2px_4px_0_hsl(var(--primary)/0.3)]">
                  {apiKey.keyPreview.replace('...', '••••')}
                </div>
                {apiKey.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {apiKey.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
                <Switch
                  checked={apiKey.isActive}
                  onCheckedChange={handleToggleClick}
                  disabled={isUpdating || !onToggleActive}
                />
                
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
                    <DropdownMenuItem onClick={() => onEditExpiration(apiKey)}>
                      <Clock className="mr-2 h-4 w-4" />
                      Edit Expiration
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

          <div className="mt-auto pt-4 border-t grid grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formatRelativeDate(apiKey.createdAt)}</span>
            </div>
            {apiKey.expiresAt && (
               <div className={`flex items-center gap-2 justify-end ${expired ? 'text-destructive' : ''}`}>
                  <Clock className="h-4 w-4" />
                  <span>{expired ? 'Expired ' : 'Expires '}{formatExpirationDate(apiKey.expiresAt)}</span>
               </div>
            )}
            {!apiKey.expiresAt && (
              <div className="flex items-center gap-2 justify-end">
                <span className="text-xs">No expiration</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <AlertDialog open={showToggleDialog} onOpenChange={setShowToggleDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingToggleState ? 'Activate API Key?' : 'Deactivate API Key?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingToggleState 
                ? `Are you sure you want to activate "${apiKey.name}"? Applications will be able to use this key immediately.`
                : `Are you sure you want to deactivate "${apiKey.name}"? Any applications using this key will lose access immediately.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggle}>
              {pendingToggleState ? 'Activate' : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
