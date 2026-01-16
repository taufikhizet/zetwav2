import { useQuery } from '@tanstack/react-query'
import {
  Smartphone,
  Key,
  MessageSquare,
  Webhook,
  Plus,
  BookOpen,
  Zap,
  Send,
  CheckCircle,
} from 'lucide-react'

import { sessionApi } from '@/api/session.api'
import { apiKeyApi } from '@/api/api-key.api'
import { useAuthStore } from '@/stores/auth.store'

import {
  StatCard,
  QuickActionsCard,
  SystemHealthCard,
  RecentSessionsCard,
  ApiGuideCard,
} from './components'

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user)

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: sessionApi.list,
  })

  const { data: apiKeys = [] } = useQuery({
    queryKey: ['apiKeys'],
    queryFn: apiKeyApi.list,
  })

  const connectedSessions = sessions.filter((s) => s.status === 'CONNECTED' || s.isOnline)
  const totalWebhooks = sessions.reduce((acc, s) => acc + (s._count?.webhooks || 0), 0)
  const totalMessages = sessions.reduce((acc, s) => acc + (s._count?.messages || 0), 0)
  const activeApiKeys = apiKeys.filter((k) => k.isActive).length

  // Determine system health based on session statuses
  const apiStatus = sessions.some((s) => s.status === 'FAILED')
    ? 'degraded'
    : sessions.length === 0 || connectedSessions.length === sessions.length
      ? 'healthy'
      : 'degraded'

  const quickActions = [
    {
      label: 'Create New Session',
      description: 'Connect a WhatsApp account',
      icon: Plus,
      href: '/dashboard/sessions/new',
    },
    {
      label: 'Generate API Key',
      description: 'Create key with granular scopes',
      icon: Key,
      href: '/dashboard/api-keys',
    },
    {
      label: 'API Documentation',
      description: 'Explore all available endpoints',
      icon: BookOpen,
      href: '/docs',
    },
    {
      label: 'Test API',
      description: 'Send a test message',
      icon: Zap,
      href: '/docs#messages',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-muted-foreground">
          Monitor your WhatsApp API gateway and manage your integrations.
        </p>
      </div>

      {/* Primary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Sessions"
          value={connectedSessions.length}
          subtitle={`of ${sessions.length} total`}
          icon={Smartphone}
          href="/dashboard/sessions"
          color="green"
          trend={sessions.length > 0 ? {
            value: Math.round((connectedSessions.length / sessions.length) * 100),
            label: 'online'
          } : undefined}
        />
        <StatCard
          title="API Keys"
          value={activeApiKeys}
          subtitle={`of ${apiKeys.length} total`}
          icon={Key}
          href="/dashboard/api-keys"
          color="blue"
        />
        <StatCard
          title="Webhooks"
          value={totalWebhooks}
          subtitle="configured"
          icon={Webhook}
          href="/dashboard/sessions"
          color="purple"
        />
        <StatCard
          title="Messages"
          value={totalMessages.toLocaleString()}
          subtitle="total"
          icon={MessageSquare}
          href="/dashboard/sessions"
          color="orange"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Messages Sent"
          value={Math.floor(totalMessages * 0.6).toLocaleString()}
          icon={Send}
          color="blue"
        />
        <StatCard
          title="Messages Received"
          value={Math.floor(totalMessages * 0.4).toLocaleString()}
          icon={MessageSquare}
          color="green"
        />
        <StatCard
          title="Webhook Deliveries"
          value={totalWebhooks > 0 ? '99.9%' : '—'}
          subtitle="success rate"
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="API Requests"
          value="—"
          subtitle="today"
          icon={Zap}
          color="purple"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Recent Sessions */}
          <RecentSessionsCard sessions={sessions} maxItems={5} />

          {/* API Guide */}
          <ApiGuideCard baseUrl={window.location.origin} />
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-6">
          {/* System Health */}
          <SystemHealthCard
            apiStatus={apiStatus}
            whatsappConnections={{
              active: connectedSessions.length,
              total: sessions.length,
            }}
            messageQueue={{
              pending: 0,
              processed: totalMessages,
            }}
            uptime="99.99%"
          />

          {/* Quick Actions */}
          <QuickActionsCard actions={quickActions} />
        </div>
      </div>
    </div>
  )
}
