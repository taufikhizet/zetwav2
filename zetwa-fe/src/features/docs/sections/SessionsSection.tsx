import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EndpointCard, CodeBlock } from '../components'

interface SessionsSectionProps {
  baseUrl: string
}

export function SessionsSection({ baseUrl }: SessionsSectionProps) {
  // Contoh ID yang konsisten untuk semua endpoint
  const exampleSessionId = 'cmkd4b4pw00034jjvcm2msjs2'
  const exampleWebhookId = 'cmkd5xyz000abcjjv123456ab'
  
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Sessions API</h2>
        <p className="text-muted-foreground mt-1">
          Endpoint untuk mengelola sesi WhatsApp. Semua endpoint memerlukan autentikasi via JWT atau API Key.
        </p>
      </div>

      {/* Session Status Reference */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-3">Session Status</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Status session menunjukkan kondisi koneksi WhatsApp. <code className="bg-muted px-1 rounded">liveStatus</code> adalah status real-time dari memory, sedangkan <code className="bg-muted px-1 rounded">status</code> adalah status terakhir yang tersimpan di database.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-gray-50">INITIALIZING</Badge>
              <span className="text-xs text-muted-foreground">Memulai</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-yellow-50">QR_READY</Badge>
              <span className="text-xs text-muted-foreground">QR siap scan</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50">AUTHENTICATING</Badge>
              <span className="text-xs text-muted-foreground">Autentikasi</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50">CONNECTED</Badge>
              <span className="text-xs text-muted-foreground">Terhubung</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-red-50">DISCONNECTED</Badge>
              <span className="text-xs text-muted-foreground">Terputus</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-red-50">FAILED</Badge>
              <span className="text-xs text-muted-foreground">Gagal</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-gray-50">LOGGED_OUT</Badge>
              <span className="text-xs text-muted-foreground">Logout</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50">STARTING</Badge>
              <span className="text-xs text-muted-foreground">Memulai ulang</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Config Reference */}
      <Card className="mb-6">
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold">Session Configuration Object</h3>
          <p className="text-sm text-muted-foreground">
            Objek <code className="bg-muted px-1 rounded">config</code> dapat digunakan saat create atau update session:
          </p>
          <CodeBlock
            code={`{
  "config": {
    // Inline webhooks (hanya untuk CREATE session)
    // Untuk update webhook gunakan Webhook API endpoints
    // Response GET session akan berisi config.webhooks (format ringkas)
    // dan webhooks[] (full objects dengan ID untuk CRUD)
    "webhooks": [
      {
        "url": "https://your-server.com/api/webhook/whatsapp",
        "events": ["message", "message.ack"],  // atau ["*"] untuk semua
        "hmac": { "key": "your-secret-key-for-signature" },
        "retries": { 
          "attempts": 3, 
          "delaySeconds": 5, 
          "policy": "exponential"  // linear | exponential | constant
        },
        "customHeaders": { "X-Custom-Header": "value" },
        "timeout": 30  // dalam detik
      }
    ],
    
    // Mode debug untuk verbose logging
    "debug": false,
    
    // Informasi perangkat yang muncul di WhatsApp
    "client": {
      "deviceName": "My Server",    // max 50 chars
      "browserName": "ZetWA API"    // max 50 chars
    },
    
    // Proxy configuration
    "proxy": {
      "server": "http://proxy.example.com:8080",
      "username": "proxyuser",
      "password": "proxypass123"
    },
    
    // Filter event yang diabaikan
    "ignore": {
      "status": true,     // Abaikan status updates
      "groups": false,    // Abaikan pesan grup
      "channels": false,  // Abaikan pesan channel
      "broadcast": true   // Abaikan broadcast lists
    },
    
    // Konfigurasi NOWEB/Baileys engine
    "noweb": {
      "store": { 
        "enabled": true,   // Simpan data session
        "fullSync": false  // Full sync saat reconnect
      },
      "markOnline": true  // Tampil online saat terhubung
    },
    
    // Custom metadata (key-value pairs)
    "metadata": {
      "userId": "user-12345",
      "department": "customer-support",
      "environment": "production"
    }
  }
}`}
            language="json"
          />
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-amber-800">⚠️ Catatan Penting</h4>
            <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
              <li><code className="bg-amber-100 px-1 rounded">config.webhooks</code> di response adalah format <strong>inline ringkas</strong> (tanpa ID, timeout dalam detik)</li>
              <li><code className="bg-amber-100 px-1 rounded">webhooks[]</code> di response adalah <strong>full database records</strong> dengan ID untuk operasi CRUD</li>
              <li>Untuk update/delete webhook, gunakan Webhook API dengan ID dari <code className="bg-amber-100 px-1 rounded">webhooks[]</code></li>
              <li><code className="bg-amber-100 px-1 rounded">config.webhooks</code> hanya untuk <strong>CREATE session</strong> - tidak bisa update via config</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <EndpointCard
        method="GET"
        path="/api/sessions"
        title="List Sessions"
        description="Ambil semua sesi WhatsApp milik user yang sedang login"
        auth="Both"
        scope="sessions:read"
        curlExample={`curl -X GET "${baseUrl}/api/sessions" \\
  -H "X-API-Key: zk_live_abc123xyz456def789"`}
        responseExample={`{
  "success": true,
  "data": [
    {
      "id": "${exampleSessionId}",
      "name": "customer-support",
      "description": "Session untuk tim customer support",
      "status": "CONNECTED",
      "phoneNumber": "628123456789",
      "pushName": "CS ZetWA",
      "profilePicUrl": "https://pps.whatsapp.net/v/t61.24694-24/123456789_n.jpg",
      "connectedAt": "2026-01-16T08:30:00.000Z",
      "createdAt": "2026-01-15T10:00:00.000Z",
      "liveStatus": "CONNECTED",
      "isOnline": true,
      "_count": {
        "webhooks": 2,
        "messages": 1250
      }
    },
    {
      "id": "cmkd27c0e000322jzeyacab6f",
      "name": "marketing-broadcast",
      "description": "Session untuk broadcast marketing",
      "status": "QR_READY",
      "phoneNumber": null,
      "pushName": null,
      "profilePicUrl": null,
      "connectedAt": null,
      "createdAt": "2026-01-16T09:00:00.000Z",
      "liveStatus": "QR_READY",
      "isOnline": false,
      "_count": {
        "webhooks": 1,
        "messages": 0
      }
    }
  ]
}`}
      />

      <EndpointCard
        method="POST"
        path="/api/sessions"
        title="Create Session"
        description="Buat sesi WhatsApp baru dengan konfigurasi opsional termasuk inline webhooks"
        auth="Both"
        scope="sessions:write"
        bodyParams={[
          { name: 'name', type: 'string', required: true, description: 'Nama session (1-50 karakter, hanya huruf, angka, underscore, hyphen)' },
          { name: 'description', type: 'string', required: false, description: 'Deskripsi session (max 255 karakter)' },
          { name: 'start', type: 'boolean', required: false, description: 'Mulai session langsung setelah dibuat (default: true)' },
          { name: 'config', type: 'object', required: false, description: 'Konfigurasi session (lihat Session Configuration Object di atas)' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/sessions" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: zk_live_abc123xyz456def789" \\
  -d '{
    "name": "customer-support",
    "description": "Session untuk tim customer support",
    "start": true,
    "config": {
      "webhooks": [
        {
          "url": "https://your-server.com/api/webhook/whatsapp",
          "events": ["message", "message.ack", "session.status"],
          "hmac": { "key": "webhook-secret-key-123" },
          "retries": { "attempts": 3, "delaySeconds": 5, "policy": "exponential" },
          "customHeaders": { "X-Custom-Header": "custom-value" },
          "timeout": 30
        }
      ],
      "debug": false,
      "client": {
        "deviceName": "ZetWA Server",
        "browserName": "Chrome"
      },
      "proxy": {
        "server": "http://proxy.example.com:8080",
        "username": "proxy_user",
        "password": "proxy_pass"
      },
      "ignore": {
        "status": true,
        "groups": false,
        "channels": false,
        "broadcast": true
      },
      "noweb": {
        "store": { "enabled": true, "fullSync": false },
        "markOnline": true
      },
      "metadata": {
        "teamId": "support-team-01",
        "department": "customer-support"
      }
    }
  }'`}
        responseExample={`{
  "success": true,
  "message": "Session created. Scan QR code to connect.",
  "data": {
    "id": "${exampleSessionId}",
    "name": "customer-support",
    "description": "Session untuk tim customer support",
    "status": "INITIALIZING",
    "userId": "cmk123abc456def789ghi",
    "phoneNumber": null,
    "pushName": null,
    "profilePicUrl": null,
    "connectedAt": null,
    "debug": false,
    "deviceName": "ZetWA Server",
    "browserName": "Chrome",
    "proxyServer": null,
    "proxyUsername": null,
    "proxyPassword": null,
    "ignoreStatus": true,
    "ignoreGroups": false,
    "ignoreChannels": false,
    "ignoreBroadcast": true,
    "nowebStoreEnabled": true,
    "nowebFullSync": false,
    "nowebMarkOnline": true,
    "metadata": {
      "teamId": "support-team-01"
    },
    "qrCode": null,
    "lastQrAt": null,
    "isActive": true,
    "createdAt": "2026-01-16T10:00:00.000Z",
    "updatedAt": "2026-01-16T10:00:00.000Z"
  }
}`}
      />

      <EndpointCard
        method="GET"
        path="/api/sessions/{sessionId}"
        title="Get Session"
        description="Ambil detail lengkap sesi berdasarkan ID, termasuk config, webhooks, dan QR code jika tersedia. Response berisi 2 representasi webhook: config.webhooks (format inline ringkas untuk kompatibilitas WAHA-style API) dan webhooks[] (full objects dengan ID untuk CRUD operations)."
        auth="Both"
        scope="sessions:read"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session (CUID format)' },
        ]}
        curlExample={`curl -X GET "${baseUrl}/api/sessions/${exampleSessionId}" \\
  -H "X-API-Key: zk_live_abc123xyz456def789"`}
        responseExample={`{
  "success": true,
  "data": {
    "id": "${exampleSessionId}",
    "name": "customer-support",
    "description": "Session untuk tim customer support",
    "status": "CONNECTED",
    "userId": "cmk123abc456def789ghi",
    "phoneNumber": "628123456789",
    "pushName": "CS ZetWA",
    "profilePicUrl": "https://pps.whatsapp.net/v/t61.24694-24/123456789_n.jpg",
    "connectedAt": "2026-01-16T08:30:00.000Z",
    "debug": false,
    "deviceName": "ZetWA Server",
    "browserName": "Chrome",
    "proxyServer": "http://proxy.example.com:8080",
    "proxyUsername": "proxy_user",
    "proxyPassword": "***",
    "ignoreStatus": true,
    "ignoreGroups": false,
    "ignoreChannels": false,
    "ignoreBroadcast": true,
    "nowebStoreEnabled": true,
    "nowebFullSync": false,
    "nowebMarkOnline": true,
    "metadata": {
      "teamId": "support-team-01",
      "department": "customer-support"
    },
    "qrCode": null,
    "lastQrAt": "2026-01-16T08:25:00.000Z",
    "isActive": true,
    "createdAt": "2026-01-15T10:00:00.000Z",
    "updatedAt": "2026-01-16T08:30:00.000Z",
    "liveStatus": "CONNECTED",
    "isOnline": true,
    
    "config": {
      "debug": false,
      "client": {
        "deviceName": "ZetWA Server",
        "browserName": "Chrome"
      },
      "proxy": {
        "server": "http://proxy.example.com:8080",
        "username": "proxy_user",
        "password": "***"
      },
      "ignore": {
        "status": true,
        "groups": false,
        "channels": false,
        "broadcast": true
      },
      "noweb": {
        "store": { "enabled": true, "fullSync": false },
        "markOnline": true
      },
      "metadata": {
        "teamId": "support-team-01",
        "department": "customer-support"
      },
      "webhooks": [
        {
          "url": "https://your-server.com/api/webhook/whatsapp",
          "events": ["message", "message.ack", "session.status"],
          "hmac": { "key": "***" },
          "retries": { "attempts": 3, "delaySeconds": 5, "policy": "exponential" },
          "customHeaders": { "X-Custom-Header": "custom-value" },
          "timeout": 30
        }
      ]
    },
    
    "webhooks": [
      {
        "id": "${exampleWebhookId}",
        "sessionId": "${exampleSessionId}",
        "name": "your-server.com",
        "url": "https://your-server.com/api/webhook/whatsapp",
        "events": ["message", "message.ack", "session.status"],
        "isActive": true,
        "secret": "***",
        "customHeaders": { "X-Custom-Header": "custom-value" },
        "retryAttempts": 3,
        "retryDelay": 5,
        "retryPolicy": "exponential",
        "timeout": 30000,
        "createdAt": "2026-01-15T10:00:00.000Z",
        "updatedAt": "2026-01-15T10:00:00.000Z"
      }
    ],
    "_count": {
      "messages": 1250,
      "chats": 89,
      "contacts": 234
    }
  }
}`}
      />

      <EndpointCard
        method="PATCH"
        path="/api/sessions/{sessionId}"
        title="Update Session"
        description="Update informasi dan konfigurasi session. Semua field bersifat opsional. Catatan: Webhook tidak bisa diupdate via config, gunakan Webhook API."
        auth="Both"
        scope="sessions:write"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session' },
        ]}
        bodyParams={[
          { name: 'name', type: 'string', required: false, description: 'Nama session baru (unik per user)' },
          { name: 'description', type: 'string', required: false, description: 'Deskripsi baru (max 255 karakter)' },
          { name: 'config', type: 'object', required: false, description: 'Update konfigurasi (debug, client, proxy, ignore, noweb, metadata). Webhook tidak termasuk.' },
        ]}
        curlExample={`curl -X PATCH "${baseUrl}/api/sessions/${exampleSessionId}" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: zk_live_abc123xyz456def789" \\
  -d '{
    "description": "Session utama customer support - updated",
    "config": {
      "debug": true,
      "ignore": {
        "status": true,
        "groups": true,
        "channels": false,
        "broadcast": true
      },
      "metadata": {
        "teamId": "support-team-01",
        "priority": "high"
      }
    }
  }'`}
        responseExample={`{
  "success": true,
  "message": "Session updated",
  "data": {
    "id": "${exampleSessionId}",
    "name": "customer-support",
    "description": "Session utama customer support - updated",
    "status": "CONNECTED",
    "userId": "cmk123abc456def789ghi",
    "phoneNumber": "628123456789",
    "pushName": "CS ZetWA",
    "profilePicUrl": "https://pps.whatsapp.net/v/t61.24694-24/123456789_n.jpg",
    "connectedAt": "2026-01-16T08:30:00.000Z",
    "debug": true,
    "deviceName": "ZetWA Server",
    "browserName": "Chrome",
    "proxyServer": null,
    "proxyUsername": null,
    "proxyPassword": null,
    "ignoreStatus": true,
    "ignoreGroups": true,
    "ignoreChannels": false,
    "ignoreBroadcast": true,
    "nowebStoreEnabled": true,
    "nowebFullSync": false,
    "nowebMarkOnline": true,
    "metadata": {
      "teamId": "support-team-01",
      "priority": "high"
    },
    "qrCode": null,
    "lastQrAt": "2026-01-16T08:25:00.000Z",
    "isActive": true,
    "createdAt": "2026-01-15T10:00:00.000Z",
    "updatedAt": "2026-01-16T11:30:00.000Z"
  }
}`}
      />

      <EndpointCard
        method="DELETE"
        path="/api/sessions/{sessionId}"
        title="Delete Session"
        description="Hapus session dan semua data terkait (webhooks, messages, chats, contacts). Operasi ini tidak dapat dibatalkan."
        auth="Both"
        scope="sessions:write"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session' },
        ]}
        curlExample={`curl -X DELETE "${baseUrl}/api/sessions/${exampleSessionId}" \\
  -H "X-API-Key: zk_live_abc123xyz456def789"`}
        responseExample={`{
  "success": true,
  "message": "Session deleted"
}`}
      />

      <EndpointCard
        method="GET"
        path="/api/sessions/{sessionId}/qr"
        title="Get QR Code (Basic)"
        description="Ambil QR code untuk scan WhatsApp. Endpoint sederhana tanpa fitur wait. Gunakan /auth/qr untuk fitur lebih lengkap."
        auth="Both"
        scope="sessions:read"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session' },
        ]}
        queryParams={[
          { name: 'format', type: 'string', required: false, description: '"image" (base64 PNG, default) atau "raw" (teks QR untuk custom rendering)' },
        ]}
        curlExample={`curl -X GET "${baseUrl}/api/sessions/${exampleSessionId}/qr?format=image" \\
  -H "X-API-Key: zk_live_abc123xyz456def789"`}
        responseExample={`{
  "success": true,
  "data": {
    "status": "SCAN_QR_CODE",
    "value": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAABGklEQVR42u3d..."
  }
}`}
      />

      <EndpointCard
        method="GET"
        path="/api/sessions/{sessionId}/auth/qr"
        title="Get Smart QR Code (Recommended)"
        description="Endpoint QR yang direkomendasikan dengan fitur wait dan status yang lebih detail. Jika session sudah CONNECTED, akan return status langsung tanpa QR."
        auth="Both"
        scope="sessions:read"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session' },
        ]}
        queryParams={[
          { name: 'wait', type: 'string', required: false, description: 'Set "true" untuk menunggu sebentar jika session masih initializing (max 5s)' },
          { name: 'timeout', type: 'number', required: false, description: 'Timeout dalam ms untuk wait (default: 5000, max: 10000)' },
          { name: 'format', type: 'string', required: false, description: '"image" (base64, default) atau "raw" (teks QR)' },
        ]}
        curlExample={`curl -X GET "${baseUrl}/api/sessions/${exampleSessionId}/auth/qr?wait=true&format=image" \\
  -H "X-API-Key: zk_live_abc123xyz456def789"`}
        responseExample={`{
  "success": true,
  "data": {
    "success": true,
    "status": "SCAN_QR_CODE",
    "qr": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAABGklEQVR42u3d...",
    "format": "image",
    "message": "Scan this QR code with WhatsApp on your phone.",
    "hint": "QR code refreshes every ~20 seconds. Subscribe to WebSocket for realtime updates."
  }
}`}
      />

      {/* Smart QR Status Reference */}
      <Card className="mb-6">
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold">Smart QR Response Status</h3>
          <p className="text-sm text-muted-foreground">
            Status yang dikembalikan oleh endpoint <code className="bg-muted px-1 rounded">/auth/qr</code>:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 border rounded-lg">
              <Badge variant="secondary" className="mb-1 bg-green-100">WORKING</Badge>
              <p className="text-xs text-muted-foreground">Session sudah terhubung, tidak perlu scan QR</p>
              <CodeBlock
                code={`{
  "success": true,
  "status": "WORKING",
  "qr": null,
  "message": "Session is already connected."
}`}
                language="json"
              />
            </div>
            <div className="p-3 border rounded-lg">
              <Badge variant="secondary" className="mb-1 bg-yellow-100">SCAN_QR_CODE</Badge>
              <p className="text-xs text-muted-foreground">QR tersedia untuk di-scan</p>
              <CodeBlock
                code={`{
  "success": true,
  "status": "SCAN_QR_CODE",
  "qr": "data:image/png;base64,...",
  "format": "image",
  "message": "Scan this QR code..."
}`}
                language="json"
              />
            </div>
            <div className="p-3 border rounded-lg">
              <Badge variant="secondary" className="mb-1 bg-blue-100">AUTHENTICATING</Badge>
              <p className="text-xs text-muted-foreground">QR sudah di-scan, menunggu autentikasi</p>
              <CodeBlock
                code={`{
  "success": true,
  "status": "AUTHENTICATING",
  "qr": null,
  "message": "QR code was scanned. Waiting..."
}`}
                language="json"
              />
            </div>
            <div className="p-3 border rounded-lg">
              <Badge variant="secondary" className="mb-1 bg-red-100">FAILED / DISCONNECTED</Badge>
              <p className="text-xs text-muted-foreground">Session perlu di-restart</p>
              <CodeBlock
                code={`{
  "success": false,
  "status": "FAILED",
  "qr": null,
  "message": "Session is failed. Please restart.",
  "action": "restart",
  "endpoint": "POST /sessions/{id}/restart"
}`}
                language="json"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <EndpointCard
        method="POST"
        path="/api/sessions/{sessionId}/auth/request-code"
        title="Request Pairing Code"
        description="Minta pairing code untuk autentikasi via nomor telepon (alternatif QR code). Kode 8 digit akan dikirim ke WhatsApp di nomor tersebut. Session harus dalam status QR_READY atau INITIALIZING."
        auth="Both"
        scope="sessions:write"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session' },
        ]}
        bodyParams={[
          { name: 'phoneNumber', type: 'string', required: true, description: 'Nomor telepon dengan kode negara tanpa + atau 0 (contoh: 628123456789, min 10, max 15 digit)' },
          { name: 'method', type: 'string', required: false, description: 'Metode pengiriman: "sms" atau "voice" (default: sms)' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/sessions/${exampleSessionId}/auth/request-code" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: zk_live_abc123xyz456def789" \\
  -d '{
    "phoneNumber": "628123456789",
    "method": "sms"
  }'`}
        responseExample={`{
  "success": true,
  "data": {
    "code": "1234-5678",
    "phoneNumber": "628123456789",
    "message": "Enter this code on your WhatsApp mobile app to link this device."
  }
}`}
      />

      <EndpointCard
        method="GET"
        path="/api/sessions/{sessionId}/me"
        title="Get Me Info"
        description="Ambil informasi akun WhatsApp yang terautentikasi. Session harus dalam status CONNECTED."
        auth="Both"
        scope="sessions:read"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session' },
        ]}
        curlExample={`curl -X GET "${baseUrl}/api/sessions/${exampleSessionId}/me" \\
  -H "X-API-Key: zk_live_abc123xyz456def789"`}
        responseExample={`{
  "success": true,
  "data": {
    "id": "628123456789@c.us",
    "phoneNumber": "628123456789",
    "pushName": "CS ZetWA",
    "profilePicUrl": "https://pps.whatsapp.net/v/t61.24694-24/123456789_n.jpg"
  }
}`}
      />

      <EndpointCard
        method="GET"
        path="/api/sessions/{sessionId}/status"
        title="Get Session Status"
        description="Ambil status terkini session secara ringkas (cocok untuk polling)"
        auth="Both"
        scope="sessions:read"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session' },
        ]}
        curlExample={`curl -X GET "${baseUrl}/api/sessions/${exampleSessionId}/status" \\
  -H "X-API-Key: zk_live_abc123xyz456def789"`}
        responseExample={`{
  "success": true,
  "data": {
    "id": "${exampleSessionId}",
    "name": "customer-support",
    "status": "CONNECTED",
    "isOnline": true,
    "phoneNumber": "628123456789",
    "pushName": "CS ZetWA"
  }
}`}
      />

      <EndpointCard
        method="POST"
        path="/api/sessions/{sessionId}/restart"
        title="Restart Session"
        description="Restart session WhatsApp. Berguna ketika session dalam status FAILED, DISCONNECTED, atau LOGGED_OUT."
        auth="Both"
        scope="sessions:write"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/sessions/${exampleSessionId}/restart" \\
  -H "X-API-Key: zk_live_abc123xyz456def789"`}
        responseExample={`{
  "success": true,
  "message": "Session is restarting",
  "data": {
    "status": "INITIALIZING"
  }
}`}
      />

      <EndpointCard
        method="POST"
        path="/api/sessions/{sessionId}/logout"
        title="Logout Session"
        description="Logout dari WhatsApp (memutuskan koneksi dan menghapus kredensial dari perangkat WhatsApp). Session perlu di-scan ulang QR code untuk reconnect."
        auth="Both"
        scope="sessions:write"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/sessions/${exampleSessionId}/logout" \\
  -H "X-API-Key: zk_live_abc123xyz456def789"`}
        responseExample={`{
  "success": true,
  "message": "Session logged out",
  "data": {
    "status": "LOGGED_OUT"
  }
}`}
      />
    </div>
  )
}
