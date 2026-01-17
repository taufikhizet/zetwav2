import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { PLAYGROUND_FEATURES, type PlaygroundFeatureId } from './constants'
import { ChevronRight } from 'lucide-react'

interface PlaygroundSidebarProps {
  activeFeature: PlaygroundFeatureId
  onSelect: (feature: PlaygroundFeatureId) => void
}

export function PlaygroundSidebar({ activeFeature, onSelect }: PlaygroundSidebarProps) {
  return (
    <nav className="flex flex-col gap-1 w-full">
      {PLAYGROUND_FEATURES.map((feature) => {
        const Icon = feature.icon
        const isActive = activeFeature === feature.id
        
        return (
          <Button
            key={feature.id}
            variant="ghost"
            className={cn(
              "group relative w-full justify-start h-auto py-3 px-3 transition-all duration-200",
              isActive 
                ? "bg-primary/10 text-primary hover:bg-primary/15 font-medium" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            onClick={() => onSelect(feature.id)}
          >
            {isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-primary" />
            )}
            
            <div className="flex items-center gap-3 w-full">
              <div className={cn(
                "p-2 rounded-md transition-colors",
                isActive ? "bg-background shadow-sm" : "bg-muted/50 group-hover:bg-background group-hover:shadow-sm"
              )}>
                <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
              </div>
              
              <div className="flex-1 text-left">
                <div className="text-sm leading-none">{feature.label}</div>
                {isActive && (
                  <div className="text-[10px] text-muted-foreground mt-1 line-clamp-1 opacity-90 font-normal">
                    {feature.description}
                  </div>
                )}
              </div>

              {isActive && <ChevronRight className="h-4 w-4 opacity-50" />}
            </div>
          </Button>
        )
      })}
    </nav>
  )
}
