import { useQuery } from '@tanstack/react-query'
import {
  Smartphone,
  KeyRound,
  MessageSquare,
  Webhook,
  Plus,
  BookOpen,
  Zap,
} from 'lucide-react'

import { sessionApi } from '@/features/sessions/api/session.api'
import { apiKeyApi } from '@/features/api-keys/api/api-key.api'

export function useDashboardStats() {
  const { data: sessions = [], isLoading: isLoadingSessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: sessionApi.list,
  })

  const { data: apiKeys = [], isLoading: isLoadingApiKeys } = useQuery({
    queryKey: ['apiKeys'],
    queryFn: apiKeyApi.list,
  })

  const connectedSessions = sessions.filter((s) => s.status === 'CONNECTED' || s.isOnline)
  const totalWebhooks = sessions.reduce((acc, s) => acc + (s._count?.webhooks || 0), 0)
  const totalMessages = sessions.reduce((acc, s) => acc + (s._count?.messages || 0), 0)
  const activeApiKeys = apiKeys.filter((k) => k.isActive).length

  const quickActions = [
    {
      label: 'New Session',
      description: 'Connect WhatsApp',
      icon: Plus,
      href: '/dashboard/sessions/new',
      variant: 'default' as const,
    },
    {
      label: 'New API Key',
      description: 'Create access key',
      icon: KeyRound,
      href: '/dashboard/api-keys',
    },
    {
      label: 'Documentation',
      description: 'View API docs',
      icon: BookOpen,
      href: '/docs',
    },
    {
      label: 'Test Message',
      description: 'Send payload',
      icon: Zap,
      href: '/docs#messages',
    },
  ]

  const stats = [
    {
      title: 'Active Sessions',
      value: connectedSessions.length,
      subtitle: `Total ${sessions.length} sessions`,
      icon: Smartphone,
      href: '/dashboard/sessions',
      color: 'purple',
    },
    {
      title: 'Total Messages',
      value: totalMessages,
      subtitle: 'Processed messages',
      icon: MessageSquare,
      color: 'blue',
    },
    {
      title: 'Active API Keys',
      value: activeApiKeys,
      subtitle: `Total ${apiKeys.length} keys`,
      icon: KeyRound,
      href: '/dashboard/api-keys',
      color: 'orange',
    },
    {
      title: 'Webhooks',
      value: totalWebhooks,
      subtitle: 'Active endpoints',
      icon: Webhook,
      color: 'green',
    },
  ]

  return {
    sessions,
    apiKeys,
    isLoading: isLoadingSessions || isLoadingApiKeys,
    stats,
    quickActions,
  }
}
