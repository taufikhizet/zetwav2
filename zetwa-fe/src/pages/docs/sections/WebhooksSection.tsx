import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EndpointCard, CodeBlock } from '../components'

interface WebhooksSectionProps {
  baseUrl: string
}

const exampleSessionId = 'cmkd4b4pw00034jjvcm2msjs2'
const exampleWebhookId = 'cmkd4webhook00034jjvcm2ms'
const exampleApiKey = 'zk_live_abc123xyz456def789'

export function WebhooksSection({ baseUrl }: WebhooksSectionProps) {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Webhooks API</h2>
        <p className="text-muted-foreground mt-1">
          Endpoint untuk mengelola webhook dan menerima notifikasi real-time dari WhatsApp
        </p>
      </div>

      {/* Webhook Events Reference */}
      <Card className="mb-6">
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold">Event yang Tersedia</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Gunakan format WAHA-style (recommended) atau legacy events untuk backward compatibility.
          </p>
          
          {/* WAHA-style Events */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">WAHA-style Events (Recommended)</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              <div className="p-2 border rounded-lg">
                <Badge variant="default" className="text-xs">message</Badge>
                <p className="text-xs text-muted-foreground mt-1">Pesan masuk</p>
              </div>
              <div className="p-2 border rounded-lg">
                <Badge variant="default" className="text-xs">message.any</Badge>
                <p className="text-xs text-muted-foreground mt-1">Semua pesan</p>
              </div>
              <div className="p-2 border rounded-lg">
                <Badge variant="default" className="text-xs">message.ack</Badge>
                <p className="text-xs text-muted-foreground mt-1">Status pesan</p>
              </div>
              <div className="p-2 border rounded-lg">
                <Badge variant="default" className="text-xs">message.reaction</Badge>
                <p className="text-xs text-muted-foreground mt-1">Reaction</p>
              </div>
              <div className="p-2 border rounded-lg">
                <Badge variant="default" className="text-xs">message.revoked</Badge>
                <p className="text-xs text-muted-foreground mt-1">Pesan dihapus</p>
              </div>
              <div className="p-2 border rounded-lg">
                <Badge variant="default" className="text-xs">message.edited</Badge>
                <p className="text-xs text-muted-foreground mt-1">Pesan diedit</p>
              </div>
              <div className="p-2 border rounded-lg">
                <Badge variant="default" className="text-xs">session.status</Badge>
                <p className="text-xs text-muted-foreground mt-1">Status session</p>
              </div>
              <div className="p-2 border rounded-lg">
                <Badge variant="default" className="text-xs">group.join</Badge>
                <p className="text-xs text-muted-foreground mt-1">Member join</p>
              </div>
              <div className="p-2 border rounded-lg">
                <Badge variant="default" className="text-xs">group.leave</Badge>
                <p className="text-xs text-muted-foreground mt-1">Member leave</p>
              </div>
              <div className="p-2 border rounded-lg">
                <Badge variant="default" className="text-xs">group.update</Badge>
                <p className="text-xs text-muted-foreground mt-1">Update grup</p>
              </div>
              <div className="p-2 border rounded-lg">
                <Badge variant="default" className="text-xs">presence.update</Badge>
                <p className="text-xs text-muted-foreground mt-1">Online status</p>
              </div>
              <div className="p-2 border rounded-lg">
                <Badge variant="default" className="text-xs">call.received</Badge>
                <p className="text-xs text-muted-foreground mt-1">Panggilan masuk</p>
              </div>
              <div className="p-2 border rounded-lg">
                <Badge variant="default" className="text-xs">poll.vote</Badge>
                <p className="text-xs text-muted-foreground mt-1">Vote poll</p>
              </div>
              <div className="p-2 border rounded-lg">
                <Badge variant="default" className="text-xs">contact.update</Badge>
                <p className="text-xs text-muted-foreground mt-1">Update kontak</p>
              </div>
              <div className="p-2 border rounded-lg">
                <Badge variant="default" className="text-xs">label.upsert</Badge>
                <p className="text-xs text-muted-foreground mt-1">Label dibuat</p>
              </div>
              <div className="p-2 border rounded-lg">
                <Badge variant="default" className="text-xs">chat.archive</Badge>
                <p className="text-xs text-muted-foreground mt-1">Chat archive</p>
              </div>
            </div>
          </div>

          {/* Legacy Events */}
          <div className="space-y-2 mt-4">
            <h4 className="text-sm font-medium text-muted-foreground">Legacy Events (Backward Compatible)</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              <div className="p-2 border rounded-lg border-dashed">
                <Badge variant="secondary" className="text-xs">MESSAGE_RECEIVED</Badge>
                <p className="text-xs text-muted-foreground mt-1">= message</p>
              </div>
              <div className="p-2 border rounded-lg border-dashed">
                <Badge variant="secondary" className="text-xs">MESSAGE_SENT</Badge>
                <p className="text-xs text-muted-foreground mt-1">Pesan terkirim</p>
              </div>
              <div className="p-2 border rounded-lg border-dashed">
                <Badge variant="secondary" className="text-xs">MESSAGE_ACK</Badge>
                <p className="text-xs text-muted-foreground mt-1">= message.ack</p>
              </div>
              <div className="p-2 border rounded-lg border-dashed">
                <Badge variant="secondary" className="text-xs">QR_RECEIVED</Badge>
                <p className="text-xs text-muted-foreground mt-1">QR code baru</p>
              </div>
              <div className="p-2 border rounded-lg border-dashed">
                <Badge variant="secondary" className="text-xs">AUTHENTICATED</Badge>
                <p className="text-xs text-muted-foreground mt-1">Berhasil login</p>
              </div>
              <div className="p-2 border rounded-lg border-dashed">
                <Badge variant="secondary" className="text-xs">READY</Badge>
                <p className="text-xs text-muted-foreground mt-1">Session siap</p>
              </div>
              <div className="p-2 border rounded-lg border-dashed">
                <Badge variant="secondary" className="text-xs">DISCONNECTED</Badge>
                <p className="text-xs text-muted-foreground mt-1">Terputus</p>
              </div>
              <div className="p-2 border rounded-lg border-dashed">
                <Badge variant="secondary" className="text-xs">STATE_CHANGE</Badge>
                <p className="text-xs text-muted-foreground mt-1">Status berubah</p>
              </div>
            </div>
          </div>

          {/* Wildcards */}
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Badge variant="outline">*</Badge>
              <Badge variant="outline">ALL</Badge>
              <span className="text-sm text-muted-foreground">= Subscribe ke semua event</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Webhook Payload Example */}
      <Card className="mb-6">
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold">Contoh Payload Webhook</h3>
          <CodeBlock
            code={`{
  "event": "message",
  "sessionId": "${exampleSessionId}",
  "timestamp": 1737024000000,
  "data": {
    "message": {
      "id": "true_628123456789@c.us_ABCD1234",
      "from": "628123456789@c.us",
      "to": "628987654321@c.us",
      "body": "Hello from WhatsApp!",
      "type": "TEXT",
      "timestamp": 1737024000,
      "fromMe": false
    },
    "chat": {
      "id": "628123456789@c.us",
      "name": "John Doe",
      "isGroup": false
    }
  }
}`}
            language="json"
          />
        </CardContent>
      </Card>

      {/* Webhook Signature */}
      <Card className="mb-6">
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold">Verifikasi Signature Webhook</h3>
          <p className="text-sm text-muted-foreground">
            Jika webhook memiliki secret, payload akan di-sign dengan HMAC-SHA256. 
            Verifikasi menggunakan header <code className="bg-muted px-1 rounded">X-Webhook-Signature</code>:
          </p>
          <CodeBlock
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
}

// Express middleware example
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const isValid = verifyWebhook(req.body, signature, 'your_secret');
  
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process webhook...
  console.log('Event:', req.body.event);
  res.json({ received: true });
});`}
            language="javascript"
          />
        </CardContent>
      </Card>

      <EndpointCard
        method="GET"
        path="/api/sessions/{sessionId}/webhooks"
        title="List Webhooks"
        description="Ambil semua webhook untuk session"
        auth="Both"
        scope="webhooks:read"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
        ]}
        curlExample={`curl -X GET "${baseUrl}/api/sessions/${exampleSessionId}/webhooks" \\
  -H "X-API-Key: ${exampleApiKey}"`}
        responseExample={`{
  "success": true,
  "data": [
    {
      "id": "${exampleWebhookId}",
      "sessionId": "${exampleSessionId}",
      "name": "Production Webhook",
      "url": "https://your-server.com/api/webhook/whatsapp",
      "events": ["message", "message.ack", "session.status"],
      "isActive": true,
      "secret": "***",
      "customHeaders": { "X-Custom-Header": "value" },
      "retryAttempts": 3,
      "retryDelay": 5,
      "retryPolicy": "exponential",
      "timeout": 30000,
      "createdAt": "2026-01-15T10:00:00.000Z",
      "updatedAt": "2026-01-16T08:00:00.000Z"
    }
  ]
}`}
      />

      <EndpointCard
        method="POST"
        path="/api/sessions/{sessionId}/webhooks"
        title="Create Webhook"
        description="Buat webhook baru untuk session"
        auth="Both"
        scope="webhooks:write"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
        ]}
        bodyParams={[
          { name: 'name', type: 'string', required: true, description: 'Nama webhook (1-100 karakter)' },
          { name: 'url', type: 'string', required: true, description: 'URL endpoint webhook (harus valid URL)' },
          { name: 'events', type: 'string[]', required: false, description: 'Array event yang disubscribe (default: ["*"])' },
          { name: 'headers', type: 'object', required: false, description: 'Custom headers untuk request (key-value object)' },
          { name: 'secret', type: 'string', required: false, description: 'Secret untuk HMAC signature verification (max 255 karakter)' },
          { name: 'retryCount', type: 'number', required: false, description: 'Jumlah retry jika gagal (0-15, default: 3)' },
          { name: 'timeout', type: 'number', required: false, description: 'Timeout dalam ms (1000-120000, default: 30000)' },
          { name: 'retries', type: 'object', required: false, description: 'Advanced retry config' },
          { name: 'retries.delaySeconds', type: 'number', required: false, description: 'Delay antar retry dalam detik (1-60)' },
          { name: 'retries.attempts', type: 'number', required: false, description: 'Jumlah percobaan (0-15)' },
          { name: 'retries.policy', type: 'string', required: false, description: 'Retry policy: "linear", "exponential", "constant"' },
          { name: 'customHeaders', type: 'array', required: false, description: 'Array of custom headers [{name, value}]' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/sessions/${exampleSessionId}/webhooks" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${exampleApiKey}" \\
  -d '{
    "name": "Production Webhook",
    "url": "https://your-server.com/api/webhook/whatsapp",
    "events": ["message", "message.ack", "session.status"],
    "secret": "webhook-secret-key-123",
    "retries": {
      "attempts": 5,
      "delaySeconds": 10,
      "policy": "exponential"
    },
    "customHeaders": [
      { "name": "X-Custom-Header", "value": "custom-value" }
    ],
    "timeout": 30000
  }'`}
        responseExample={`{
  "success": true,
  "message": "Webhook created",
  "data": {
    "id": "${exampleWebhookId}",
    "sessionId": "${exampleSessionId}",
    "name": "Production Webhook",
    "url": "https://your-server.com/api/webhook/whatsapp",
    "events": ["message", "message.ack", "session.status"],
    "isActive": true,
    "secret": "***",
    "customHeaders": { "X-Custom-Header": "custom-value" },
    "retryAttempts": 5,
    "retryDelay": 10,
    "retryPolicy": "exponential",
    "timeout": 30000,
    "createdAt": "2026-01-16T10:00:00.000Z"
  }
}`}
      />

      <EndpointCard
        method="PATCH"
        path="/api/sessions/{sessionId}/webhooks/{webhookId}"
        title="Update Webhook"
        description="Update konfigurasi webhook"
        auth="Both"
        scope="webhooks:write"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
          { name: 'webhookId', type: 'string', required: true, description: 'ID webhook' },
        ]}
        bodyParams={[
          { name: 'name', type: 'string', required: false, description: 'Nama webhook baru' },
          { name: 'url', type: 'string', required: false, description: 'URL endpoint baru' },
          { name: 'events', type: 'string[]', required: false, description: 'Event baru' },
          { name: 'headers', type: 'object', required: false, description: 'Custom headers baru' },
          { name: 'secret', type: 'string', required: false, description: 'Secret baru (null untuk hapus)' },
          { name: 'retryCount', type: 'number', required: false, description: 'Retry count baru' },
          { name: 'timeout', type: 'number', required: false, description: 'Timeout baru' },
          { name: 'isActive', type: 'boolean', required: false, description: 'Aktif/nonaktifkan webhook' },
        ]}
        curlExample={`curl -X PATCH "${baseUrl}/api/sessions/${exampleSessionId}/webhooks/${exampleWebhookId}" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${exampleApiKey}" \\
  -d '{
    "isActive": false,
    "events": ["message", "message.ack"]
  }'`}
        responseExample={`{
  "success": true,
  "message": "Webhook updated",
  "data": {
    "id": "${exampleWebhookId}",
    "name": "Production Webhook",
    "isActive": false,
    "events": ["message", "message.ack"],
    "updatedAt": "2026-01-16T11:00:00.000Z"
  }
}`}
      />

      <EndpointCard
        method="DELETE"
        path="/api/sessions/{sessionId}/webhooks/{webhookId}"
        title="Delete Webhook"
        description="Hapus webhook"
        auth="Both"
        scope="webhooks:write"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
          { name: 'webhookId', type: 'string', required: true, description: 'ID webhook' },
        ]}
        curlExample={`curl -X DELETE "${baseUrl}/api/sessions/${exampleSessionId}/webhooks/${exampleWebhookId}" \\
  -H "X-API-Key: ${exampleApiKey}"`}
        responseExample={`{
  "success": true,
  "message": "Webhook deleted"
}`}
      />

      <EndpointCard
        method="POST"
        path="/api/sessions/{sessionId}/webhooks/{webhookId}/test"
        title="Test Webhook"
        description="Kirim test payload ke webhook untuk verifikasi koneksi"
        auth="Both"
        scope="webhooks:write"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
          { name: 'webhookId', type: 'string', required: true, description: 'ID webhook' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/sessions/${exampleSessionId}/webhooks/${exampleWebhookId}/test" \\
  -H "X-API-Key: ${exampleApiKey}"`}
        responseExample={`{
  "success": true,
  "message": "Webhook test successful",
  "data": {
    "success": true,
    "statusCode": 200,
    "responseTime": 150,
    "response": { "received": true }
  }
}`}
      />

      <EndpointCard
        method="GET"
        path="/api/sessions/{sessionId}/webhooks/{webhookId}/logs"
        title="Get Webhook Logs"
        description="Ambil log delivery webhook untuk troubleshooting"
        auth="Both"
        scope="webhooks:read"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
          { name: 'webhookId', type: 'string', required: true, description: 'ID webhook' },
        ]}
        queryParams={[
          { name: 'limit', type: 'number', required: false, description: 'Jumlah log yang diambil (default: 50)' },
        ]}
        curlExample={`curl -X GET "${baseUrl}/api/sessions/${exampleSessionId}/webhooks/${exampleWebhookId}/logs?limit=20" \\
  -H "X-API-Key: ${exampleApiKey}"`}
        responseExample={`{
  "success": true,
  "data": [
    {
      "id": "cmkd4log00001",
      "webhookId": "${exampleWebhookId}",
      "event": "message",
      "status": "SUCCESS",
      "statusCode": 200,
      "responseTime": 150,
      "attempt": 1,
      "error": null,
      "createdAt": "2026-01-16T10:00:00.000Z"
    },
    {
      "id": "cmkd4log00002",
      "webhookId": "${exampleWebhookId}",
      "event": "message.ack",
      "status": "FAILED",
      "statusCode": 500,
      "responseTime": 30000,
      "attempt": 3,
      "error": "Connection timeout after 30000ms",
      "createdAt": "2026-01-16T09:55:00.000Z"
    }
  ]
}`}
      />
    </div>
  )
}
