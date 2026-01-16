import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EndpointCard, CodeBlock } from '../components'

interface ApiKeysSectionProps {
  baseUrl: string
}

const exampleKeyId = 'cmkd4apikey00034jjvcm2msjs2'
const exampleAccessToken = 'eyJhbGciOiJIUzI1NiIs...'

export function ApiKeysSection({ baseUrl }: ApiKeysSectionProps) {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">API Keys</h2>
        <p className="text-muted-foreground mt-1">
          Endpoint untuk mengelola API keys dengan granular scope-based access control
        </p>
      </div>

      {/* Scopes Reference */}
      <Card className="mb-6">
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold">Available Scopes</h3>
          <p className="text-sm text-muted-foreground">
            API keys menggunakan granular scope untuk kontrol akses. Setiap scope mengizinkan operasi tertentu.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Sessions</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono">sessions:read</Badge>
                  <span className="text-xs text-muted-foreground">List & get sessions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono">sessions:write</Badge>
                  <span className="text-xs text-muted-foreground">Create, update, delete sessions</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Messages</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono">messages:read</Badge>
                  <span className="text-xs text-muted-foreground">Read messages & chats</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono">messages:send</Badge>
                  <span className="text-xs text-muted-foreground">Send messages</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Contacts</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono">contacts:read</Badge>
                  <span className="text-xs text-muted-foreground">Read contacts</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono">contacts:write</Badge>
                  <span className="text-xs text-muted-foreground">Manage contacts</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Groups</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono">groups:read</Badge>
                  <span className="text-xs text-muted-foreground">Read groups</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono">groups:write</Badge>
                  <span className="text-xs text-muted-foreground">Manage groups</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Media</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono">media:read</Badge>
                  <span className="text-xs text-muted-foreground">Download media</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono">media:write</Badge>
                  <span className="text-xs text-muted-foreground">Send media files</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Webhooks</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono">webhooks:read</Badge>
                  <span className="text-xs text-muted-foreground">Read webhooks & logs</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono">webhooks:write</Badge>
                  <span className="text-xs text-muted-foreground">Manage webhooks</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Labels</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono">labels:read</Badge>
                  <span className="text-xs text-muted-foreground">Read labels</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono">labels:write</Badge>
                  <span className="text-xs text-muted-foreground">Manage labels</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Status</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono">status:read</Badge>
                  <span className="text-xs text-muted-foreground">Read status updates</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono">status:write</Badge>
                  <span className="text-xs text-muted-foreground">Post status updates</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Presence</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono">presence:read</Badge>
                  <span className="text-xs text-muted-foreground">Read presence status</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono">presence:write</Badge>
                  <span className="text-xs text-muted-foreground">Update presence</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Profile</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono">profile:read</Badge>
                  <span className="text-xs text-muted-foreground">Read WA profile</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono">profile:write</Badge>
                  <span className="text-xs text-muted-foreground">Update WA profile</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>⚠️ Security Best Practices:</strong>
            </p>
            <ul className="text-sm text-amber-800 dark:text-amber-200 list-disc list-inside mt-2 space-y-1">
              <li>Jangan expose API key di client-side code</li>
              <li>Selalu gunakan HTTPS di production</li>
              <li>Rotate API key secara berkala</li>
              <li>Gunakan scope minimal yang diperlukan (principle of least privilege)</li>
              <li>Set expiration date untuk API key</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* API Key Format */}
      <Card className="mb-6">
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold">Format API Key</h3>
          <CodeBlock
            code={`// API Key Format
zk_live_abc123xyz456def789ghi012jkl345

// Prefix breakdown:
// zk_      = ZetWA Key prefix
// live_    = Environment (live/test)
// ...      = Random unique identifier

// Usage in header:
X-API-Key: zk_live_abc123xyz456def789ghi012jkl345`}
            language="bash"
          />
        </CardContent>
      </Card>

      <EndpointCard
        method="GET"
        path="/api/api-keys"
        title="List API Keys"
        description="Ambil semua API keys milik user (hanya metadata, bukan key asli)"
        auth="JWT"
        curlExample={`curl -X GET "${baseUrl}/api/api-keys" \\
  -H "Authorization: Bearer ${exampleAccessToken}"`}
        responseExample={`{
  "success": true,
  "data": [
    {
      "id": "${exampleKeyId}",
      "name": "Production API Key",
      "keyPreview": "zk_live_abc...xyz",
      "scopes": ["sessions:read", "sessions:write", "messages:send"],
      "isActive": true,
      "lastUsedAt": "2026-01-16T10:00:00.000Z",
      "expiresAt": "2027-01-16T00:00:00.000Z",
      "createdAt": "2026-01-10T10:00:00.000Z",
      "updatedAt": "2026-01-16T10:00:00.000Z"
    }
  ]
}`}
      />

      <EndpointCard
        method="GET"
        path="/api/api-keys/scopes"
        title="Get Available Scopes"
        description="Ambil daftar semua scope yang tersedia untuk API key beserta deskripsi dan kategori"
        auth="JWT"
        curlExample={`curl -X GET "${baseUrl}/api/api-keys/scopes" \\
  -H "Authorization: Bearer ${exampleAccessToken}"`}
        responseExample={`{
  "success": true,
  "data": {
    "scopes": [
      "sessions:read",
      "sessions:write",
      "messages:send",
      "messages:read",
      "contacts:read",
      "contacts:write",
      "groups:read",
      "groups:write",
      "media:read",
      "media:write",
      "webhooks:read",
      "webhooks:write"
    ],
    "descriptions": {
      "sessions:read": "Read session data and status",
      "sessions:write": "Create, update, and delete sessions",
      "messages:send": "Send text and media messages",
      "messages:read": "Read messages and chat history",
      "contacts:read": "Read contact information",
      "contacts:write": "Manage contacts",
      "groups:read": "Read group information",
      "groups:write": "Create and manage groups",
      "media:read": "Download media files",
      "media:write": "Upload and send media",
      "webhooks:read": "Read webhook configurations and logs",
      "webhooks:write": "Create and manage webhooks"
    },
    "categories": {
      "sessions": ["sessions:read", "sessions:write"],
      "messages": ["messages:send", "messages:read"],
      "contacts": ["contacts:read", "contacts:write"],
      "groups": ["groups:read", "groups:write"],
      "media": ["media:read", "media:write"],
      "webhooks": ["webhooks:read", "webhooks:write"]
    }
  }
}`}
      />

      <EndpointCard
        method="GET"
        path="/api/api-keys/stats"
        title="Get API Key Statistics"
        description="Ambil statistik penggunaan API keys"
        auth="JWT"
        curlExample={`curl -X GET "${baseUrl}/api/api-keys/stats" \\
  -H "Authorization: Bearer ${exampleAccessToken}"`}
        responseExample={`{
  "success": true,
  "data": {
    "total": 5,
    "active": 3,
    "inactive": 1,
    "expired": 1
  }
}`}
      />

      <EndpointCard
        method="POST"
        path="/api/api-keys"
        title="Create API Key"
        description="Buat API key baru dengan scope tertentu. Key hanya ditampilkan sekali saat pembuatan!"
        auth="JWT"
        bodyParams={[
          { name: 'name', type: 'string', required: true, description: 'Nama API key (3-100 karakter)' },
          { name: 'description', type: 'string', required: false, description: 'Deskripsi (max 500 karakter)' },
          { name: 'scopes', type: 'string[]', required: false, description: 'Array scopes (default: sessions:read, sessions:write, messages:send)' },
          { name: 'expiresAt', type: 'string', required: false, description: 'Tanggal kadaluarsa (ISO 8601 datetime)' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/api-keys" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${exampleAccessToken}" \\
  -d '{
    "name": "Production API Key",
    "description": "API key untuk production server",
    "scopes": [
      "sessions:read",
      "sessions:write",
      "messages:send",
      "messages:read",
      "webhooks:read",
      "webhooks:write"
    ],
    "expiresAt": "2027-01-16T00:00:00.000Z"
  }'`}
        responseExample={`{
  "success": true,
  "message": "API key created. Save the key now, it will not be shown again.",
  "data": {
    "id": "${exampleKeyId}",
    "name": "Production API Key",
    "description": "API key untuk production server",
    "key": "zk_live_abc123xyz456def789ghi012jkl345mno678",
    "keyPreview": "zk_live_abc...678",
    "scopes": [
      "sessions:read",
      "sessions:write",
      "messages:send",
      "messages:read",
      "webhooks:read",
      "webhooks:write"
    ],
    "isActive": true,
    "expiresAt": "2027-01-16T00:00:00.000Z",
    "createdAt": "2026-01-16T10:00:00.000Z"
  }
}`}
      />

      <EndpointCard
        method="GET"
        path="/api/api-keys/{keyId}"
        title="Get API Key"
        description="Ambil detail API key berdasarkan ID"
        auth="JWT"
        pathParams={[
          { name: 'keyId', type: 'string', required: true, description: 'ID API key' },
        ]}
        curlExample={`curl -X GET "${baseUrl}/api/api-keys/${exampleKeyId}" \\
  -H "Authorization: Bearer ${exampleAccessToken}"`}
        responseExample={`{
  "success": true,
  "data": {
    "id": "${exampleKeyId}",
    "name": "Production API Key",
    "description": "API key untuk production server",
    "keyPreview": "zk_live_abc...678",
    "scopes": [
      "sessions:read",
      "sessions:write",
      "messages:send",
      "messages:read",
      "webhooks:read",
      "webhooks:write"
    ],
    "isActive": true,
    "lastUsedAt": "2026-01-16T10:00:00.000Z",
    "expiresAt": "2027-01-16T00:00:00.000Z",
    "createdAt": "2026-01-10T10:00:00.000Z",
    "updatedAt": "2026-01-16T10:00:00.000Z"
  }
}`}
      />

      <EndpointCard
        method="PATCH"
        path="/api/api-keys/{keyId}"
        title="Update API Key"
        description="Update nama, deskripsi, atau status API key. Untuk update scopes, gunakan endpoint khusus."
        auth="JWT"
        pathParams={[
          { name: 'keyId', type: 'string', required: true, description: 'ID API key' },
        ]}
        bodyParams={[
          { name: 'name', type: 'string', required: false, description: 'Nama baru (3-100 karakter)' },
          { name: 'description', type: 'string', required: false, description: 'Deskripsi baru (null untuk hapus)' },
          { name: 'isActive', type: 'boolean', required: false, description: 'Aktifkan/nonaktifkan API key' },
        ]}
        curlExample={`curl -X PATCH "${baseUrl}/api/api-keys/${exampleKeyId}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${exampleAccessToken}" \\
  -d '{
    "name": "Production Key - Updated",
    "isActive": true
  }'`}
        responseExample={`{
  "success": true,
  "message": "API key updated",
  "data": {
    "id": "${exampleKeyId}",
    "name": "Production Key - Updated",
    "isActive": true,
    "updatedAt": "2026-01-16T11:00:00.000Z"
  }
}`}
      />

      <EndpointCard
        method="PATCH"
        path="/api/api-keys/{keyId}/scopes"
        title="Update API Key Scopes"
        description="Update scopes API key. Minimal satu scope harus dipilih."
        auth="JWT"
        pathParams={[
          { name: 'keyId', type: 'string', required: true, description: 'ID API key' },
        ]}
        bodyParams={[
          { name: 'scopes', type: 'string[]', required: true, description: 'Array scope baru (min 1 scope)' },
        ]}
        curlExample={`curl -X PATCH "${baseUrl}/api/api-keys/${exampleKeyId}/scopes" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${exampleAccessToken}" \\
  -d '{
    "scopes": [
      "sessions:read",
      "messages:read",
      "messages:send"
    ]
  }'`}
        responseExample={`{
  "success": true,
  "message": "API key scopes updated",
  "data": {
    "id": "${exampleKeyId}",
    "scopes": [
      "sessions:read",
      "messages:read",
      "messages:send"
    ],
    "updatedAt": "2026-01-16T11:00:00.000Z"
  }
}`}
      />

      <EndpointCard
        method="DELETE"
        path="/api/api-keys/{keyId}"
        title="Delete API Key"
        description="Hapus API key secara permanen. Operasi ini tidak dapat dibatalkan."
        auth="JWT"
        pathParams={[
          { name: 'keyId', type: 'string', required: true, description: 'ID API key' },
        ]}
        curlExample={`curl -X DELETE "${baseUrl}/api/api-keys/${exampleKeyId}" \\
  -H "Authorization: Bearer ${exampleAccessToken}"`}
        responseExample={`{
  "success": true,
  "message": "API key deleted"
}`}
      />

      <EndpointCard
        method="POST"
        path="/api/api-keys/{keyId}/regenerate"
        title="Regenerate API Key"
        description="Generate ulang API key dengan secret baru. Key lama akan langsung tidak valid. PENTING: Simpan key baru segera karena tidak akan ditampilkan lagi."
        auth="JWT"
        pathParams={[
          { name: 'keyId', type: 'string', required: true, description: 'ID API key' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/api-keys/${exampleKeyId}/regenerate" \\
  -H "Authorization: Bearer ${exampleAccessToken}"`}
        responseExample={`{
  "success": true,
  "message": "API key regenerated. Save the new key now, it will not be shown again.",
  "data": {
    "id": "${exampleKeyId}",
    "name": "Production API Key",
    "key": "zk_live_NEW_abc123xyz456def789ghi012jkl345",
    "keyPreview": "zk_live_NEW...345",
    "scopes": [
      "sessions:read",
      "sessions:write",
      "messages:send"
    ],
    "isActive": true,
    "expiresAt": "2027-01-16T00:00:00.000Z",
    "createdAt": "2026-01-10T10:00:00.000Z",
    "updatedAt": "2026-01-16T12:00:00.000Z"
  }
}`}
      />

      <EndpointCard
        method="POST"
        path="/api/api-keys/revoke-all"
        title="Revoke All API Keys"
        description="Revoke (nonaktifkan) semua API keys milik user. Berguna untuk keamanan darurat jika ada kemungkinan key bocor. Key yang direvoke tidak bisa digunakan lagi tapi masih bisa dilihat di list."
        auth="JWT"
        curlExample={`curl -X POST "${baseUrl}/api/api-keys/revoke-all" \\
  -H "Authorization: Bearer ${exampleAccessToken}"`}
        responseExample={`{
  "success": true,
  "message": "3 API key(s) revoked",
  "data": {
    "revokedCount": 3
  }
}`}
      />
    </div>
  )
}
