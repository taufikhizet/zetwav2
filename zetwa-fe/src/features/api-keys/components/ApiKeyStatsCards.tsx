/**
 * API Key Stats Cards Component
 */

import { Key, Activity, AlertTriangle, Hash, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ApiKeyStats } from '../types'
import { formatUsageCount } from '../utils'

interface ApiKeyStatsCardsProps {
  stats: ApiKeyStats
}

export function ApiKeyStatsCards({ stats }: ApiKeyStatsCardsProps) {
  const cards = [
    {
      title: 'Total Keys',
      value: stats.totalKeys,
      icon: Key,
      color: 'text-muted-foreground',
    },
    {
      title: 'Active',
      value: stats.activeKeys,
      icon: Activity,
      color: 'text-green-500',
      valueColor: 'text-green-600',
    },
    {
      title: 'Inactive',
      value: stats.inactiveKeys,
      icon: AlertTriangle,
      color: 'text-amber-500',
      valueColor: 'text-amber-600',
    },
    {
      title: 'Expired',
      value: stats.expiredKeys,
      icon: Clock,
      color: 'text-red-500',
      valueColor: 'text-red-600',
    },
    {
      title: 'Total Requests',
      value: formatUsageCount(stats.totalUsage),
      icon: Hash,
      color: 'text-blue-500',
      valueColor: 'text-blue-600',
    },
  ]

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.title} className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${card.valueColor || ''}`}>
              {card.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
