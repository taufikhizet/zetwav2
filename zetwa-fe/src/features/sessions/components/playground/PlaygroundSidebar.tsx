import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { PLAYGROUND_FEATURES, type PlaygroundFeatureId } from './constants'

interface PlaygroundSidebarProps {
  activeFeature: PlaygroundFeatureId
  onSelect: (feature: PlaygroundFeatureId) => void
}

export function PlaygroundSidebar({ activeFeature, onSelect }: PlaygroundSidebarProps) {
  return (
    <div className="flex flex-col gap-2 w-full lg:w-64 shrink-0">
      {PLAYGROUND_FEATURES.map((feature) => {
        const Icon = feature.icon
        const isActive = activeFeature === feature.id
        
        return (
          <Button
            key={feature.id}
            variant={isActive ? 'secondary' : 'ghost'}
            className={cn(
              "justify-start h-auto py-3 px-4",
              isActive ? "bg-primary/10 text-primary hover:bg-primary/15" : "hover:bg-muted"
            )}
            onClick={() => onSelect(feature.id)}
          >
            <div className="flex items-start gap-3 text-left">
              <Icon className={cn("h-5 w-5 mt-0.5", isActive ? "text-primary" : "text-muted-foreground")} />
              <div>
                <div className="font-medium">{feature.label}</div>
                <div className="text-xs text-muted-foreground font-normal opacity-80">
                  {feature.description}
                </div>
              </div>
            </div>
          </Button>
        )
      })}
    </div>
  )
}
