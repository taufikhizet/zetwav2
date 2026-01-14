/**
 * Empty State Component for API Keys
 */

import { KeyRound, Plus, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface ApiKeyEmptyStateProps {
  onCreateClick: () => void
}

export function ApiKeyEmptyState({ onCreateClick }: ApiKeyEmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="pt-12 pb-12">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <KeyRound className="h-10 w-10 text-primary" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">No API Keys Yet</h3>
            <p className="text-muted-foreground max-w-md">
              Create your first API key to start integrating with external applications. 
              API keys allow secure programmatic access to your WhatsApp sessions.
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 pt-2">
            <Button onClick={onCreateClick} size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Create Your First API Key
            </Button>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Secure & encrypted
              </span>
              <span className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                Granular permissions
              </span>
              <span className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                Usage tracking
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
