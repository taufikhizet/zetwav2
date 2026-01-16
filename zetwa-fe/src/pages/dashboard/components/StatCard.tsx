import { Link } from 'react-router-dom'
import { ArrowRight, TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: number | string
  subtitle?: string
  icon: LucideIcon
  href?: string
  trend?: {
    value: number
    label: string
  }
  color?: 'green' | 'blue' | 'purple' | 'orange' | 'red' | 'yellow'
  className?: string
}

const colorVariants = {
  green: {
    icon: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    border: 'border-emerald-100 dark:border-emerald-900',
  },
  blue: {
    icon: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/50',
    border: 'border-blue-100 dark:border-blue-900',
  },
  purple: {
    icon: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/50',
    border: 'border-purple-100 dark:border-purple-900',
  },
  orange: {
    icon: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-950/50',
    border: 'border-orange-100 dark:border-orange-900',
  },
  red: {
    icon: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/50',
    border: 'border-red-100 dark:border-red-900',
  },
  yellow: {
    icon: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-50 dark:bg-yellow-950/50',
    border: 'border-yellow-100 dark:border-yellow-900',
  },
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  href,
  trend,
  color = 'blue',
  className,
}: StatCardProps) {
  const colors = colorVariants[color]

  const TrendIcon = trend
    ? trend.value > 0
      ? TrendingUp
      : trend.value < 0
        ? TrendingDown
        : Minus
    : null

  const trendColor = trend
    ? trend.value > 0
      ? 'text-emerald-600 dark:text-emerald-400'
      : trend.value < 0
        ? 'text-red-600 dark:text-red-400'
        : 'text-muted-foreground'
    : ''

  return (
    <Card className={cn('relative overflow-hidden transition-all hover:shadow-md', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn('p-2 rounded-lg', colors.bg)}>
          <Icon className={cn('h-4 w-4', colors.icon)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight">{value}</span>
          {subtitle && (
            <span className="text-sm text-muted-foreground">{subtitle}</span>
          )}
        </div>

        <div className="flex items-center justify-between mt-3">
          {trend && TrendIcon && (
            <div className={cn('flex items-center gap-1 text-xs', trendColor)}>
              <TrendIcon className="h-3 w-3" />
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-muted-foreground ml-1">{trend.label}</span>
            </div>
          )}

          {href && (
            <Link
              to={href}
              className="text-xs text-primary hover:underline inline-flex items-center ml-auto"
            >
              View all <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
