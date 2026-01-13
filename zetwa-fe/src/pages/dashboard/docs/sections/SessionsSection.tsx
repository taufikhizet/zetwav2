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
        description="Buat sesi WhatsApp baru"
        auth="Both"
        bodyParams={[
          { name: 'name', type: 'string', required: true, description: 'Nama session (hanya huruf, angka, underscore, hyphen)' },
          { name: 'description', type: 'string', required: false, description: 'Deskripsi session (max 255 karakter)' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/sessions" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "name": "my-session",
    "description": "Session untuk bisnis"
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
        curlExample={`curl -X GET "${baseUrl}/api/sessions/clxxx.../qr" \\
  -H "X-API-Key: YOUR_API_KEY"`}
        responseExample={`{
  "success": true,
  "data": {
    "qr": "data:image/png;base64,iVBORw0KGgo...",
    "status": "QR_READY"
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
