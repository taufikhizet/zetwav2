import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EndpointCard, CodeBlock } from '../components'

interface WebhooksSectionProps {
  baseUrl: string
}

export function WebhooksSection({ baseUrl }: WebhooksSectionProps) {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Webhooks API</h2>
        <p className="text-muted-foreground mt-1">
          Endpoint untuk mengelola webhook dan menerima notifikasi real-time
        </p>
      </div>

      {/* Webhook Events Reference */}
      <Card className="mb-6">
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold">Event yang Tersedia</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="p-3 border rounded-lg">
              <Badge variant="secondary" className="mb-1">MESSAGE_RECEIVED</Badge>
              <p className="text-xs text-muted-foreground">Pesan masuk diterima</p>
            </div>
            <div className="p-3 border rounded-lg">
              <Badge variant="secondary" className="mb-1">MESSAGE_SENT</Badge>
              <p className="text-xs text-muted-foreground">Pesan terkirim</p>
            </div>
            <div className="p-3 border rounded-lg">
              <Badge variant="secondary" className="mb-1">MESSAGE_ACK</Badge>
              <p className="text-xs text-muted-foreground">Status pesan berubah</p>
            </div>
            <div className="p-3 border rounded-lg">
              <Badge variant="secondary" className="mb-1">MESSAGE_REVOKED</Badge>
              <p className="text-xs text-muted-foreground">Pesan dihapus</p>
            </div>
            <div className="p-3 border rounded-lg">
              <Badge variant="secondary" className="mb-1">QR_RECEIVED</Badge>
              <p className="text-xs text-muted-foreground">QR code baru</p>
            </div>
            <div className="p-3 border rounded-lg">
              <Badge variant="secondary" className="mb-1">AUTHENTICATED</Badge>
              <p className="text-xs text-muted-foreground">Berhasil autentikasi</p>
            </div>
            <div className="p-3 border rounded-lg">
              <Badge variant="secondary" className="mb-1">AUTH_FAILURE</Badge>
              <p className="text-xs text-muted-foreground">Autentikasi gagal</p>
            </div>
            <div className="p-3 border rounded-lg">
              <Badge variant="secondary" className="mb-1">READY</Badge>
              <p className="text-xs text-muted-foreground">Session siap</p>
            </div>
            <div className="p-3 border rounded-lg">
              <Badge variant="secondary" className="mb-1">DISCONNECTED</Badge>
              <p className="text-xs text-muted-foreground">Session terputus</p>
            </div>
            <div className="p-3 border rounded-lg">
              <Badge variant="secondary" className="mb-1">STATE_CHANGE</Badge>
              <p className="text-xs text-muted-foreground">Status berubah</p>
            </div>
            <div className="p-3 border rounded-lg">
              <Badge variant="secondary" className="mb-1">GROUP_JOIN</Badge>
              <p className="text-xs text-muted-foreground">Member bergabung grup</p>
            </div>
            <div className="p-3 border rounded-lg">
              <Badge variant="secondary" className="mb-1">GROUP_LEAVE</Badge>
              <p className="text-xs text-muted-foreground">Member keluar grup</p>
            </div>
            <div className="p-3 border rounded-lg">
              <Badge variant="secondary" className="mb-1">GROUP_UPDATE</Badge>
              <p className="text-xs text-muted-foreground">Info grup diupdate</p>
            </div>
            <div className="p-3 border rounded-lg">
              <Badge variant="secondary" className="mb-1">CALL_RECEIVED</Badge>
              <p className="text-xs text-muted-foreground">Panggilan masuk</p>
            </div>
            <div className="p-3 border rounded-lg">
              <Badge variant="secondary" className="mb-1">ALL</Badge>
              <p className="text-xs text-muted-foreground">Semua event</p>
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
  "event": "MESSAGE_RECEIVED",
  "sessionId": "clxxx...",
  "timestamp": 1705226400000,
  "data": {
    "message": {
      "id": "true_628123456789@c.us_ABCD1234",
      "from": "628123456789@c.us",
      "to": "628987654321@c.us",
      "body": "Hello!",
      "type": "TEXT",
      "timestamp": 1705226400,
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
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
        ]}
        curlExample={`curl -X GET "${baseUrl}/api/sessions/{sessionId}/webhooks" \\
  -H "X-API-Key: YOUR_API_KEY"`}
        responseExample={`{
  "success": true,
  "data": [
    {
      "id": "clxxx...",
      "name": "My Webhook",
      "url": "https://your-server.com/webhook",
      "events": ["MESSAGE_RECEIVED", "MESSAGE_SENT"],
      "isActive": true,
      "retryCount": 3,
      "timeout": 30000,
      "createdAt": "2026-01-14T10:00:00.000Z"
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
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
        ]}
        bodyParams={[
          { name: 'name', type: 'string', required: true, description: 'Nama webhook (1-100 karakter)' },
          { name: 'url', type: 'string', required: true, description: 'URL endpoint webhook (harus valid URL)' },
          { name: 'events', type: 'string[]', required: false, description: 'Array event yang disubscribe (default: ["ALL"])' },
          { name: 'headers', type: 'object', required: false, description: 'Custom headers untuk request' },
          { name: 'secret', type: 'string', required: false, description: 'Secret untuk signature verification (max 255 karakter)' },
          { name: 'retryCount', type: 'number', required: false, description: 'Jumlah retry jika gagal (0-10, default: 3)' },
          { name: 'timeout', type: 'number', required: false, description: 'Timeout dalam ms (1000-60000, default: 30000)' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/sessions/{sessionId}/webhooks" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "name": "My Webhook",
    "url": "https://your-server.com/webhook",
    "events": ["MESSAGE_RECEIVED", "MESSAGE_SENT"],
    "secret": "my_secret_key",
    "retryCount": 3,
    "timeout": 30000
  }'`}
        responseExample={`{
  "success": true,
  "message": "Webhook created",
  "data": {
    "id": "clxxx...",
    "name": "My Webhook",
    "url": "https://your-server.com/webhook",
    "events": ["MESSAGE_RECEIVED", "MESSAGE_SENT"],
    "isActive": true,
    "retryCount": 3,
    "timeout": 30000,
    "createdAt": "2026-01-14T10:00:00.000Z"
  }
}`}
      />

      <EndpointCard
        method="PATCH"
        path="/api/sessions/{sessionId}/webhooks/{webhookId}"
        title="Update Webhook"
        description="Update konfigurasi webhook"
        auth="Both"
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
        curlExample={`curl -X PATCH "${baseUrl}/api/sessions/{sessionId}/webhooks/{webhookId}" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "isActive": false
  }'`}
        responseExample={`{
  "success": true,
  "message": "Webhook updated",
  "data": {
    "id": "clxxx...",
    "name": "My Webhook",
    "isActive": false
  }
}`}
      />

      <EndpointCard
        method="DELETE"
        path="/api/sessions/{sessionId}/webhooks/{webhookId}"
        title="Delete Webhook"
        description="Hapus webhook"
        auth="Both"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
          { name: 'webhookId', type: 'string', required: true, description: 'ID webhook' },
        ]}
        curlExample={`curl -X DELETE "${baseUrl}/api/sessions/{sessionId}/webhooks/{webhookId}" \\
  -H "X-API-Key: YOUR_API_KEY"`}
        responseExample={`{
  "success": true,
  "message": "Webhook deleted"
}`}
      />

      <EndpointCard
        method="POST"
        path="/api/sessions/{sessionId}/webhooks/{webhookId}/test"
        title="Test Webhook"
        description="Kirim test payload ke webhook untuk verifikasi"
        auth="Both"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
          { name: 'webhookId', type: 'string', required: true, description: 'ID webhook' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/sessions/{sessionId}/webhooks/{webhookId}/test" \\
  -H "X-API-Key: YOUR_API_KEY"`}
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
        description="Ambil log delivery webhook"
        auth="Both"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
          { name: 'webhookId', type: 'string', required: true, description: 'ID webhook' },
        ]}
        queryParams={[
          { name: 'limit', type: 'number', required: false, description: 'Jumlah log (default: 50)' },
        ]}
        curlExample={`curl -X GET "${baseUrl}/api/sessions/{sessionId}/webhooks/{webhookId}/logs?limit=20" \\
  -H "X-API-Key: YOUR_API_KEY"`}
        responseExample={`{
  "success": true,
  "data": [
    {
      "id": "clxxx...",
      "event": "MESSAGE_RECEIVED",
      "status": "SUCCESS",
      "statusCode": 200,
      "responseTime": 150,
      "attempt": 1,
      "error": null,
      "createdAt": "2026-01-14T10:00:00.000Z"
    },
    {
      "id": "clyyy...",
      "event": "MESSAGE_SENT",
      "status": "FAILED",
      "statusCode": 500,
      "responseTime": 30000,
      "attempt": 3,
      "error": "Connection timeout",
      "createdAt": "2026-01-14T09:55:00.000Z"
    }
  ]
}`}
      />
    </div>
  )
}
