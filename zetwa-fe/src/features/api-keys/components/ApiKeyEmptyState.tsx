/**
 * Empty State Component for API Keys
 */

import { KeyRound, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface ApiKeyEmptyStateProps {
  onCreateClick: () => void
}

export function ApiKeyEmptyState({ onCreateClick }: ApiKeyEmptyStateProps) {
  return (
    <Card className="border-dashed border-2 bg-transparent shadow-none">
      <CardContent className="flex flex-col items-center justify-center py-20">
        <div className="p-6 rounded-full bg-secondary mb-6 shadow-inner">
          <KeyRound className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No API Keys yet</h2>
        <p className="text-muted-foreground text-center max-w-md mb-8">
          Create your first API key to start integrating with external applications.
        </p>
        <Button onClick={onCreateClick} size="lg" className="rounded-xl">
          <Plus className="mr-2 h-5 w-5" />
          Create Your First API Key
        </Button>
      </CardContent>
    </Card>
  )
}
