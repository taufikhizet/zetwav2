import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EndpointCard } from '../components'

interface SessionsSectionProps {
  baseUrl: string
}

export function SessionsSection({ baseUrl }: SessionsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Sessions API</h2>
        <p className="text-muted-foreground mt-1">
          Endpoint untuk mengelola sesi WhatsApp
        </p>
      </div>

      {/* Session Status Reference */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-3">Session Status</h3>
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
          </div>
        </CardContent>
      </Card>

      <EndpointCard
        method="GET"
        path="/api/sessions"
        title="List Sessions"
        description="Ambil semua sesi WhatsApp milik user"
        auth="Both"
        curlExample={`curl -X GET "${baseUrl}/api/sessions" \\
  -H "X-API-Key: YOUR_API_KEY"`}
        responseExample={`{
  "success": true,
  "data": [
    {
      "id": "clxxx...",
      "name": "my-session",
      "description": "Session utama",
      "status": "CONNECTED",
      "phone": "628123456789",
      "isOnline": true,
      "lastSeen": "2026-01-14T10:00:00.000Z",
      "createdAt": "2026-01-14T09:00:00.000Z"
    }
  ]
}`}
      />

      <EndpointCard
        method="POST"
        path="/api/sessions"
        title="Create Session"
        description="Buat sesi WhatsApp baru dengan konfigurasi opsional"
        auth="Both"
        bodyParams={[
          { name: 'name', type: 'string', required: true, description: 'Nama session (hanya huruf, angka, underscore, hyphen)' },
          { name: 'description', type: 'string', required: false, description: 'Deskripsi session (max 255 karakter)' },
          { name: 'start', type: 'boolean', required: false, description: 'Mulai session langsung setelah dibuat (default: true)' },
          { name: 'config', type: 'object', required: false, description: 'Konfigurasi session (lihat contoh)' },
          { name: 'config.debug', type: 'boolean', required: false, description: 'Aktifkan mode debug' },
          { name: 'config.proxy', type: 'object', required: false, description: 'Konfigurasi proxy (server, username, password)' },
          { name: 'config.client', type: 'object', required: false, description: 'Info perangkat (deviceName, browserName)' },
          { name: 'config.ignore', type: 'object', required: false, description: 'Filter event (status, groups, broadcast)' },
          { name: 'config.metadata', type: 'object', required: false, description: 'Custom metadata untuk webhook' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/sessions" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "name": "my-session",
    "description": "Session untuk bisnis",
    "start": true,
    "config": {
      "debug": false,
      "client": {
        "deviceName": "Windows",
        "browserName": "Chrome"
      },
      "proxy": {
        "server": "http://proxy.example.com:8080",
        "username": "user",
        "password": "pass"
      },
      "ignore": {
        "status": true,
        "groups": false,
        "broadcast": true
      },
      "metadata": {
        "user.id": "123",
        "user.email": "user@example.com"
      }
    }
  }'`}
        responseExample={`{
  "success": true,
  "message": "Session created. Scan QR code to connect.",
  "data": {
    "id": "clxxx...",
    "name": "my-session",
    "description": "Session untuk bisnis",
    "status": "INITIALIZING",
    "createdAt": "2026-01-14T10:00:00.000Z"
  }
}`}
      />

      <EndpointCard
        method="GET"
        path="/api/sessions/{sessionId}"
        title="Get Session"
        description="Ambil detail sesi berdasarkan ID"
        auth="Both"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session' },
        ]}
        curlExample={`curl -X GET "${baseUrl}/api/sessions/clxxx..." \\
  -H "X-API-Key: YOUR_API_KEY"`}
        responseExample={`{
  "success": true,
  "data": {
    "id": "clxxx...",
    "name": "my-session",
    "description": "Session untuk bisnis",
    "status": "CONNECTED",
    "phone": "628123456789",
    "isOnline": true,
    "lastSeen": "2026-01-14T10:00:00.000Z",
    "createdAt": "2026-01-14T09:00:00.000Z",
    "updatedAt": "2026-01-14T10:00:00.000Z"
  }
}`}
      />

      <EndpointCard
        method="PATCH"
        path="/api/sessions/{sessionId}"
        title="Update Session"
        description="Update informasi session"
        auth="Both"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session' },
        ]}
        bodyParams={[
          { name: 'name', type: 'string', required: false, description: 'Nama session baru' },
          { name: 'description', type: 'string', required: false, description: 'Deskripsi baru' },
        ]}
        curlExample={`curl -X PATCH "${baseUrl}/api/sessions/clxxx..." \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "description": "Updated description"
  }'`}
        responseExample={`{
  "success": true,
  "message": "Session updated",
  "data": {
    "id": "clxxx...",
    "name": "my-session",
    "description": "Updated description"
  }
}`}
      />

      <EndpointCard
        method="DELETE"
        path="/api/sessions/{sessionId}"
        title="Delete Session"
        description="Hapus session dan semua data terkait"
        auth="Both"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session' },
        ]}
        curlExample={`curl -X DELETE "${baseUrl}/api/sessions/clxxx..." \\
  -H "X-API-Key: YOUR_API_KEY"`}
        responseExample={`{
  "success": true,
  "message": "Session deleted"
}`}
      />

      <EndpointCard
        method="GET"
        path="/api/sessions/{sessionId}/qr"
        title="Get QR Code"
        description="Ambil QR code untuk scan WhatsApp"
        auth="Both"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session' },
        ]}
        queryParams={[
          { name: 'format', type: 'string', required: false, description: 'Format output: "image" (base64) atau "raw" (teks QR)' },
        ]}
        curlExample={`curl -X GET "${baseUrl}/api/sessions/clxxx.../qr?format=image" \\
  -H "X-API-Key: YOUR_API_KEY"`}
        responseExample={`{
  "success": true,
  "data": {
    "qrCode": "data:image/png;base64,iVBORw0KGgo...",
    "status": "QR_READY"
  }
}`}
      />

      <EndpointCard
        method="POST"
        path="/api/sessions/{sessionId}/auth/request-code"
        title="Request Pairing Code"
        description="Minta pairing code untuk autentikasi via nomor telepon (alternatif QR code)"
        auth="Both"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session' },
        ]}
        bodyParams={[
          { name: 'phoneNumber', type: 'string', required: true, description: 'Nomor telepon dengan kode negara tanpa + atau 0 (contoh: 628123456789)' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/sessions/clxxx.../auth/request-code" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "phoneNumber": "628123456789"
  }'`}
        responseExample={`{
  "success": true,
  "data": {
    "code": "12345678",
    "phoneNumber": "628123456789",
    "message": "Pairing code generated. Enter it in your WhatsApp app."
  }
}`}
      />

      <EndpointCard
        method="GET"
        path="/api/sessions/{sessionId}/me"
        title="Get Me Info"
        description="Ambil informasi akun WhatsApp yang terautentikasi"
        auth="Both"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session' },
        ]}
        curlExample={`curl -X GET "${baseUrl}/api/sessions/clxxx.../me" \\
  -H "X-API-Key: YOUR_API_KEY"`}
        responseExample={`{
  "success": true,
  "data": {
    "id": "628123456789@c.us",
    "phoneNumber": "628123456789",
    "pushName": "John Doe",
    "profilePicUrl": "https://..."
  }
}`}
      />

      <EndpointCard
        method="GET"
        path="/api/sessions/{sessionId}/status"
        title="Get Session Status"
        description="Ambil status terkini session"
        auth="Both"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session' },
        ]}
        curlExample={`curl -X GET "${baseUrl}/api/sessions/clxxx.../status" \\
  -H "X-API-Key: YOUR_API_KEY"`}
        responseExample={`{
  "success": true,
  "data": {
    "status": "CONNECTED",
    "isOnline": true,
    "phone": "628123456789",
    "name": "John Doe",
    "profilePicUrl": "https://..."
  }
}`}
      />

      <EndpointCard
        method="POST"
        path="/api/sessions/{sessionId}/restart"
        title="Restart Session"
        description="Restart session WhatsApp"
        auth="Both"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/sessions/clxxx.../restart" \\
  -H "X-API-Key: YOUR_API_KEY"`}
        responseExample={`{
  "success": true,
  "message": "Session restarting",
  "data": {
    "status": "INITIALIZING"
  }
}`}
      />

      <EndpointCard
        method="POST"
        path="/api/sessions/{sessionId}/logout"
        title="Logout Session"
        description="Logout dari WhatsApp (memutuskan koneksi)"
        auth="Both"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/sessions/clxxx.../logout" \\
  -H "X-API-Key: YOUR_API_KEY"`}
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
