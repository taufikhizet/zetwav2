import { useState } from 'react'
import { 
  Book, 
  Copy, 
  Check, 
  Webhook,
  Key,
  Smartphone,
  MessageSquare,
  Shield,
  ExternalLink,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { copyToClipboard } from '@/lib/utils'

export default function DocumentationPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const handleCopy = async (code: string, id: string) => {
    await copyToClipboard(code)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3222'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">API Documentation</h1>
        <p className="text-muted-foreground mt-1">
          Panduan penggunaan Zetwa WhatsApp API
        </p>
      </div>

      {/* Quick Start */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Book className="h-5 w-5" />
            Quick Start
          </CardTitle>
          <CardDescription>
            Mulai menggunakan Zetwa API dalam 3 langkah
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <StepItem 
              number={1} 
              title="Buat API Key" 
              description="Buka menu API Keys dan buat key baru dengan permission yang diperlukan."
            />
            <StepItem 
              number={2} 
              title="Buat Session WhatsApp" 
              description="Buat session baru dan scan QR code dengan WhatsApp di ponsel Anda."
            />
            <StepItem 
              number={3} 
              title="Kirim Pesan" 
              description="Gunakan API untuk mengirim pesan!"
            />
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Contoh: Kirim Pesan</h4>
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

      {/* Features */}
      <div className="grid gap-4 md:grid-cols-3">
        <FeatureCard
          icon={Smartphone}
          title="Multi-Session"
          description="Hubungkan banyak akun WhatsApp dalam satu dashboard"
        />
        <FeatureCard
          icon={Webhook}
          title="Webhooks"
          description="Terima notifikasi real-time untuk pesan masuk"
        />
        <FeatureCard
          icon={Shield}
          title="Secure"
          description="Autentikasi API key dengan permission granular"
        />
      </div>

      {/* Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Autentikasi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Sertakan API key di header <code className="bg-muted px-1 rounded">X-API-Key</code> pada setiap request:
          </p>
          <CodeBlock
            id="auth-header"
            code={`X-API-Key: zetwa_xxxxxxxxxxxxxxxxxxxx`}
            onCopy={handleCopy}
            copied={copiedCode === 'auth-header'}
          />
          
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>⚠️ Penting:</strong> Jangan pernah expose API key di client-side code. 
              Selalu panggil API dari backend server Anda.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Send Message */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Mengirim Pesan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <h4 className="font-semibold">Pesan Teks</h4>
            <CodeBlock
              id="send-text"
              code={`curl -X POST ${baseUrl}/api/sessions/{sessionId}/messages/send \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "to": "628123456789",
    "message": "Hello World!"
  }'`}
              onCopy={handleCopy}
              copied={copiedCode === 'send-text'}
            />
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">Pesan Gambar</h4>
            <CodeBlock
              id="send-image"
              code={`curl -X POST ${baseUrl}/api/sessions/{sessionId}/messages/send \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "to": "628123456789",
    "media": {
      "type": "image",
      "url": "https://example.com/image.jpg",
      "caption": "Check this out!"
    }
  }'`}
              onCopy={handleCopy}
              copied={copiedCode === 'send-image'}
            />
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Format Nomor Telepon</h4>
            <p className="text-sm text-muted-foreground">
              Gunakan kode negara tanpa simbol <code className="bg-muted px-1 rounded">+</code>:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li><code className="bg-muted px-1 rounded">628123456789</code> - Indonesia</li>
              <li><code className="bg-muted px-1 rounded">14155551234</code> - USA</li>
              <li><code className="bg-muted px-1 rounded">447911123456</code> - UK</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Webhooks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Webhooks
          </CardTitle>
          <CardDescription>
            Terima notifikasi real-time untuk event WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <h4 className="font-semibold">Buat Webhook</h4>
            <CodeBlock
              id="create-webhook"
              code={`curl -X POST ${baseUrl}/api/sessions/{sessionId}/webhooks \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "name": "My Webhook",
    "url": "https://your-server.com/webhook",
    "events": ["message", "message_ack"]
  }'`}
              onCopy={handleCopy}
              copied={copiedCode === 'create-webhook'}
            />
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Event yang Tersedia</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">message</Badge>
              <Badge variant="secondary">message_ack</Badge>
              <Badge variant="secondary">message_create</Badge>
              <Badge variant="secondary">qr</Badge>
              <Badge variant="secondary">ready</Badge>
              <Badge variant="secondary">disconnected</Badge>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">Contoh Payload Webhook</h4>
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
      "body": "Hello!",
      "type": "TEXT",
      "fromMe": false
    }
  }
}`}
              onCopy={handleCopy}
              copied={copiedCode === 'webhook-payload'}
            />
          </div>
        </CardContent>
      </Card>

      {/* API Reference Summary */}
      <Card>
        <CardHeader>
          <CardTitle>API Reference</CardTitle>
          <CardDescription>Daftar endpoint yang tersedia</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <EndpointGroup title="Sessions">
              <EndpointItem method="GET" path="/api/sessions" description="List semua session" />
              <EndpointItem method="POST" path="/api/sessions" description="Buat session baru" />
              <EndpointItem method="GET" path="/api/sessions/{id}/status" description="Status & QR code" />
              <EndpointItem method="POST" path="/api/sessions/{id}/restart" description="Restart session" />
              <EndpointItem method="POST" path="/api/sessions/{id}/logout" description="Logout WhatsApp" />
            </EndpointGroup>

            <EndpointGroup title="Messages">
              <EndpointItem method="POST" path="/api/sessions/{id}/messages/send" description="Kirim pesan" />
              <EndpointItem method="GET" path="/api/sessions/{id}/messages" description="Riwayat pesan" />
            </EndpointGroup>

            <EndpointGroup title="Contacts">
              <EndpointItem method="GET" path="/api/sessions/{id}/contacts" description="List kontak" />
              <EndpointItem method="GET" path="/api/sessions/{id}/contacts/{phone}/check" description="Cek nomor WhatsApp" />
            </EndpointGroup>

            <EndpointGroup title="Webhooks">
              <EndpointItem method="GET" path="/api/sessions/{id}/webhooks" description="List webhooks" />
              <EndpointItem method="POST" path="/api/sessions/{id}/webhooks" description="Buat webhook" />
              <EndpointItem method="POST" path="/api/sessions/{id}/webhooks/{wid}/test" description="Test webhook" />
            </EndpointGroup>
          </div>
        </CardContent>
      </Card>

      {/* Full Documentation Link */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Dokumentasi Lengkap</h3>
              <p className="text-sm text-muted-foreground">
                Lihat dokumentasi lengkap untuk developer di file documentation.md
              </p>
            </div>
            <Button variant="outline" asChild>
              <a href="https://github.com/your-repo" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                GitHub
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper Components
function StepItem({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
        {number}
      </div>
      <div>
        <h4 className="font-semibold">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

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

function EndpointGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">{title}</h4>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function EndpointItem({ method, path, description }: { method: string; path: string; description: string }) {
  const methodColors: Record<string, string> = {
    GET: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    POST: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    PUT: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    DELETE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  }

  return (
    <div className="flex items-center gap-3 py-1.5">
      <Badge className={`${methodColors[method]} text-xs w-14 justify-center`}>{method}</Badge>
      <code className="text-sm flex-1">{path}</code>
      <span className="text-sm text-muted-foreground hidden md:block">{description}</span>
    </div>
  )
}
