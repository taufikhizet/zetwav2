import { useState } from 'react'
import { 
  Book, 
  Code, 
  Copy, 
  Check, 
  ChevronRight,
  Send,
  Webhook,
  Key,
  Smartphone,
  MessageSquare,
  Users,
  Shield,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { copyToClipboard } from '@/lib/utils'

export default function DocumentationPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const handleCopy = async (code: string, id: string) => {
    await copyToClipboard(code)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const baseUrl = import.meta.env.VITE_API_URL || 'https://api.zetwa.com'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">API Documentation</h1>
        <p className="text-muted-foreground mt-1">
          Learn how to integrate Zetwa WhatsApp API into your applications
        </p>
      </div>

      <Tabs defaultValue="quickstart" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="quickstart">Quick Start</TabsTrigger>
          <TabsTrigger value="auth">Authentication</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        {/* Quick Start */}
        <TabsContent value="quickstart" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="h-5 w-5" />
                Getting Started
              </CardTitle>
              <CardDescription>
                Get up and running with Zetwa API in minutes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold">Create an API Key</h4>
                    <p className="text-sm text-muted-foreground">
                      Go to the API Keys page and create a new key with the required permissions.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold">Create a Session</h4>
                    <p className="text-sm text-muted-foreground">
                      Create a WhatsApp session and scan the QR code to connect your phone.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold">Send Messages</h4>
                    <p className="text-sm text-muted-foreground">
                      Use the API to send messages, media, and more!
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Example: Send a Message</h4>
                <CodeBlock
                  id="quickstart-example"
                  code={`curl -X POST ${baseUrl}/api/sessions/{sessionId}/messages/send \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "to": "628123456789",
    "message": "Hello from Zetwa!"
  }'`}
                  onCopy={handleCopy}
                  copied={copiedCode === 'quickstart-example'}
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <FeatureCard
              icon={Smartphone}
              title="Multi-Session"
              description="Connect unlimited WhatsApp accounts per user"
            />
            <FeatureCard
              icon={Webhook}
              title="Webhooks"
              description="Real-time event notifications for incoming messages"
            />
            <FeatureCard
              icon={Shield}
              title="Secure"
              description="API key authentication with granular permissions"
            />
          </div>
        </TabsContent>

        {/* Authentication */}
        <TabsContent value="auth" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Authentication
              </CardTitle>
              <CardDescription>
                How to authenticate your API requests
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-semibold">API Key Authentication</h4>
                <p className="text-sm text-muted-foreground">
                  Include your API key in the <code className="bg-muted px-1 rounded">X-API-Key</code> header:
                </p>
                <CodeBlock
                  id="auth-header"
                  code={`X-API-Key: zetwa_xxxxxxxxxxxxxxxxxxxx`}
                  onCopy={handleCopy}
                  copied={copiedCode === 'auth-header'}
                />
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">JWT Authentication (Dashboard)</h4>
                <p className="text-sm text-muted-foreground">
                  For dashboard access, use JWT tokens in the <code className="bg-muted px-1 rounded">Authorization</code> header:
                </p>
                <CodeBlock
                  id="auth-jwt"
                  code={`Authorization: Bearer eyJhbGciOiJIUzI1NiIs...`}
                  onCopy={handleCopy}
                  copied={copiedCode === 'auth-jwt'}
                />
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Security Note:</strong> Never expose your API keys in client-side code. 
                  Always make API calls from your backend server.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Key Scopes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <ScopeItem scope="sessions:read" description="View session information and status" />
                <ScopeItem scope="sessions:write" description="Create, update, and delete sessions" />
                <ScopeItem scope="messages:send" description="Send messages through connected sessions" />
                <ScopeItem scope="messages:read" description="View message history" />
                <ScopeItem scope="webhooks:manage" description="Create and manage webhooks" />
                <ScopeItem scope="contacts:read" description="View contact information" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions */}
        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Session Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <EndpointDoc
                method="GET"
                path="/api/sessions"
                description="List all sessions"
                onCopy={handleCopy}
                copiedCode={copiedCode}
                baseUrl={baseUrl}
              />

              <EndpointDoc
                method="POST"
                path="/api/sessions"
                description="Create a new session"
                body={{
                  name: "My Session",
                  description: "Optional description"
                }}
                onCopy={handleCopy}
                copiedCode={copiedCode}
                baseUrl={baseUrl}
              />

              <EndpointDoc
                method="GET"
                path="/api/sessions/{sessionId}"
                description="Get session details"
                onCopy={handleCopy}
                copiedCode={copiedCode}
                baseUrl={baseUrl}
              />

              <EndpointDoc
                method="GET"
                path="/api/sessions/{sessionId}/status"
                description="Get session status and QR code"
                onCopy={handleCopy}
                copiedCode={copiedCode}
                baseUrl={baseUrl}
              />

              <EndpointDoc
                method="POST"
                path="/api/sessions/{sessionId}/restart"
                description="Restart a session"
                onCopy={handleCopy}
                copiedCode={copiedCode}
                baseUrl={baseUrl}
              />

              <EndpointDoc
                method="POST"
                path="/api/sessions/{sessionId}/logout"
                description="Logout from WhatsApp"
                onCopy={handleCopy}
                copiedCode={copiedCode}
                baseUrl={baseUrl}
              />

              <EndpointDoc
                method="DELETE"
                path="/api/sessions/{sessionId}"
                description="Delete a session"
                onCopy={handleCopy}
                copiedCode={copiedCode}
                baseUrl={baseUrl}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messages */}
        <TabsContent value="messages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Messaging
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <EndpointDoc
                method="POST"
                path="/api/sessions/{sessionId}/messages/send"
                description="Send a text message"
                body={{
                  to: "628123456789",
                  message: "Hello from Zetwa!"
                }}
                onCopy={handleCopy}
                copiedCode={copiedCode}
                baseUrl={baseUrl}
              />

              <EndpointDoc
                method="POST"
                path="/api/sessions/{sessionId}/messages/send"
                description="Send an image"
                body={{
                  to: "628123456789",
                  media: {
                    type: "image",
                    url: "https://example.com/image.jpg",
                    caption: "Check this out!"
                  }
                }}
                onCopy={handleCopy}
                copiedCode={copiedCode}
                baseUrl={baseUrl}
              />

              <EndpointDoc
                method="GET"
                path="/api/sessions/{sessionId}/messages"
                description="Get message history"
                onCopy={handleCopy}
                copiedCode={copiedCode}
                baseUrl={baseUrl}
              />

              <div className="space-y-2">
                <h4 className="font-semibold">Phone Number Format</h4>
                <p className="text-sm text-muted-foreground">
                  Phone numbers should include the country code without the + symbol:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li><code className="bg-muted px-1 rounded">628123456789</code> (Indonesia)</li>
                  <li><code className="bg-muted px-1 rounded">14155551234</code> (USA)</li>
                  <li><code className="bg-muted px-1 rounded">447911123456</code> (UK)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Contacts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <EndpointDoc
                method="GET"
                path="/api/sessions/{sessionId}/contacts"
                description="Get all contacts"
                onCopy={handleCopy}
                copiedCode={copiedCode}
                baseUrl={baseUrl}
              />

              <EndpointDoc
                method="GET"
                path="/api/sessions/{sessionId}/contacts/{phone}/check"
                description="Check if number is registered on WhatsApp"
                onCopy={handleCopy}
                copiedCode={copiedCode}
                baseUrl={baseUrl}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhooks */}
        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Webhooks
              </CardTitle>
              <CardDescription>
                Receive real-time notifications for WhatsApp events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <EndpointDoc
                method="POST"
                path="/api/sessions/{sessionId}/webhooks"
                description="Create a webhook"
                body={{
                  name: "n8n Webhook",
                  url: "https://n8n.example.com/webhook/xxx",
                  events: ["message", "message_ack"],
                  secret: "optional_secret_for_signing"
                }}
                onCopy={handleCopy}
                copiedCode={copiedCode}
                baseUrl={baseUrl}
              />

              <EndpointDoc
                method="GET"
                path="/api/sessions/{sessionId}/webhooks"
                description="List webhooks"
                onCopy={handleCopy}
                copiedCode={copiedCode}
                baseUrl={baseUrl}
              />

              <EndpointDoc
                method="POST"
                path="/api/sessions/{sessionId}/webhooks/{webhookId}/test"
                description="Test a webhook"
                onCopy={handleCopy}
                copiedCode={copiedCode}
                baseUrl={baseUrl}
              />

              <div className="space-y-2">
                <h4 className="font-semibold">Available Events</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">message</Badge>
                  <Badge variant="secondary">message_ack</Badge>
                  <Badge variant="secondary">message_create</Badge>
                  <Badge variant="secondary">message_revoke</Badge>
                  <Badge variant="secondary">qr</Badge>
                  <Badge variant="secondary">ready</Badge>
                  <Badge variant="secondary">disconnected</Badge>
                  <Badge variant="secondary">group_join</Badge>
                  <Badge variant="secondary">group_leave</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Webhook Payload Example</h4>
                <CodeBlock
                  id="webhook-payload"
                  code={`{
  "event": "message",
  "sessionId": "my-session",
  "timestamp": 1699123456789,
  "data": {
    "message": {
      "id": "true_628xxx@c.us_ABCD1234",
      "from": "628123456789@c.us",
      "to": "628987654321@c.us",
      "body": "Hello!",
      "type": "TEXT",
      "timestamp": 1699123456,
      "fromMe": false
    },
    "chat": {
      "id": "628123456789@c.us",
      "name": "John Doe",
      "isGroup": false
    }
  }
}`}
                  onCopy={handleCopy}
                  copied={copiedCode === 'webhook-payload'}
                />
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Webhook Signature Verification</h4>
                <p className="text-sm text-muted-foreground">
                  If you provide a secret, webhooks will be signed with HMAC-SHA256. 
                  Verify using the <code className="bg-muted px-1 rounded">X-Webhook-Signature</code> header:
                </p>
                <CodeBlock
                  id="webhook-verify"
                  code={`const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}`}
                  onCopy={handleCopy}
                  copied={copiedCode === 'webhook-verify'}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper Components
function CodeBlock({ 
  id, 
  code, 
  onCopy, 
  copied 
}: { 
  id: string
  code: string
  onCopy: (code: string, id: string) => void
  copied: boolean 
}) {
  return (
    <div className="relative">
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-8 w-8 bg-gray-800 hover:bg-gray-700"
        onClick={() => onCopy(code, id)}
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-400" />
        ) : (
          <Copy className="h-4 w-4 text-gray-400" />
        )}
      </Button>
    </div>
  )
}

function FeatureCard({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string 
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <Icon className="h-8 w-8 text-primary mb-3" />
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}

function ScopeItem({ scope, description }: { scope: string; description: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <code className="text-sm bg-muted px-2 py-1 rounded">{scope}</code>
      <span className="text-sm text-muted-foreground">{description}</span>
    </div>
  )
}

function EndpointDoc({ 
  method, 
  path, 
  description, 
  body,
  onCopy,
  copiedCode,
  baseUrl,
}: { 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  description: string
  body?: Record<string, unknown>
  onCopy: (code: string, id: string) => void
  copiedCode: string | null
  baseUrl: string
}) {
  const methodColors = {
    GET: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    POST: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    PUT: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    DELETE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  }

  const id = `${method}-${path}`
  const curlExample = body
    ? `curl -X ${method} ${baseUrl}${path} \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '${JSON.stringify(body, null, 2)}'`
    : `curl -X ${method} ${baseUrl}${path} \\
  -H "X-API-Key: YOUR_API_KEY"`

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Badge className={methodColors[method]}>{method}</Badge>
        <code className="text-sm">{path}</code>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
      <CodeBlock
        id={id}
        code={curlExample}
        onCopy={onCopy}
        copied={copiedCode === id}
      />
    </div>
  )
}
