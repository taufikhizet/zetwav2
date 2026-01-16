import { Link } from 'react-router-dom'
import { LucideIcon, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface QuickAction {
  label: string
  description?: string
  icon: LucideIcon
  href: string
  variant?: 'default' | 'outline' | 'secondary'
}

interface QuickActionsCardProps {
  title?: string
  description?: string
  actions: QuickAction[]
  className?: string
}

export function QuickActionsCard({
  title = 'Quick Actions',
  description = 'Get started with common tasks',
  actions,
  className,
}: QuickActionsCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="grid gap-3">
        {actions.map((action, index) => (
          <Link key={index} to={action.href}>
            <Button
              className="w-full justify-start h-auto py-3"
              variant={action.variant || 'outline'}
            >
              <action.icon className="mr-3 h-4 w-4 shrink-0" />
              <div className="text-left">
                <div className="font-medium">{action.label}</div>
                {action.description && (
                  <div className="text-xs font-normal text-muted-foreground mt-0.5">
                    {action.description}
                  </div>
                )}
              </div>
              <ArrowRight className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
