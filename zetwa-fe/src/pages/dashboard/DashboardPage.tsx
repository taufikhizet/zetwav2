import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Smartphone,
  Key,
  MessageSquare,
  Webhook,
  Plus,
  ArrowRight,
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { sessionApi } from '@/api/session.api'
import { apiKeyApi } from '@/api/api-key.api'
import { useAuthStore } from '@/stores/auth.store'
import { getStatusColor, getStatusText } from '@/lib/utils'

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

  const stats = [
    {
      name: 'Active Sessions',
      value: connectedSessions.length,
      total: sessions.length,
      icon: Smartphone,
      href: '/dashboard/sessions',
      color: 'text-green-500',
    },
    {
      name: 'API Keys',
      value: apiKeys.filter((k) => k.isActive).length,
      total: apiKeys.length,
      icon: Key,
      href: '/dashboard/api-keys',
      color: 'text-blue-500',
    },
    {
      name: 'Webhooks',
      value: totalWebhooks,
      icon: Webhook,
      href: '/dashboard/sessions',
      color: 'text-purple-500',
    },
    {
      name: 'Messages',
      value: totalMessages,
      icon: MessageSquare,
      href: '/dashboard/sessions',
      color: 'text-orange-500',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user?.name?.split(' ')[0]}!</h1>
        <p className="text-muted-foreground mt-1">
          Here's an overview of your WhatsApp API gateway
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.name}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stat.value}
                {stat.total !== undefined && (
                  <span className="text-sm font-normal text-muted-foreground">
                    {' '}/ {stat.total}
                  </span>
                )}
              </div>
              <Link
                to={stat.href}
                className="text-xs text-primary hover:underline inline-flex items-center mt-1"
              >
                View all <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions and recent sessions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with common tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Link to="/dashboard/sessions/new">
              <Button className="w-full justify-start" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Create New Session
              </Button>
            </Link>
            <Link to="/dashboard/api-keys">
              <Button className="w-full justify-start" variant="outline">
                <Key className="mr-2 h-4 w-4" />
                Generate API Key
              </Button>
            </Link>
            <Link to="/dashboard/docs">
              <Button className="w-full justify-start" variant="outline">
                <MessageSquare className="mr-2 h-4 w-4" />
                View API Documentation
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Sessions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Sessions</CardTitle>
              <CardDescription>Your WhatsApp sessions</CardDescription>
            </div>
            <Link to="/dashboard/sessions">
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <div className="text-center py-8">
                <Smartphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No sessions yet</p>
                <Link to="/dashboard/sessions/new">
                  <Button className="mt-4" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Session
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.slice(0, 5).map((session) => (
                  <Link
                    key={session.id}
                    to={`/dashboard/sessions/${session.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(session.liveStatus || session.status)}`} />
                      <div>
                        <p className="font-medium">{session.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {session.phoneNumber || 'Not connected'}
                        </p>
                      </div>
                    </div>
                    <Badge variant={session.isOnline ? 'success' : 'secondary'}>
                      {getStatusText(session.liveStatus || session.status)}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* API Usage Guide */}
      <Card>
        <CardHeader>
          <CardTitle>API Integration Guide</CardTitle>
          <CardDescription>Quick start guide for integrating with Zetwa API</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold">1</span>
                </div>
                <h3 className="font-medium">Create a Session</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Create a WhatsApp session and scan the QR code to connect your phone.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold">2</span>
                </div>
                <h3 className="font-medium">Generate API Key</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Generate an API key to authenticate your requests to the Zetwa API.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold">3</span>
                </div>
                <h3 className="font-medium">Start Sending</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Use the API to send messages, set up webhooks, and automate your workflow.
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Example: Send a message</p>
            <pre className="text-xs overflow-x-auto">
{`curl -X POST https://api.zetwa.com/api/sessions/{sessionId}/messages/send \\
  -H "X-API-Key: your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{"to": "628123456789", "message": "Hello from Zetwa!"}'`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
