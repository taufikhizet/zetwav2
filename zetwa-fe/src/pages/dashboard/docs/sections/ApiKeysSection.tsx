import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EndpointCard } from '../components'

interface ApiKeysSectionProps {
  baseUrl: string
}

export function ApiKeysSection({ baseUrl }: ApiKeysSectionProps) {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">API Keys</h2>
        <p className="text-muted-foreground mt-1">
          Endpoint untuk mengelola API keys
        </p>
      </div>

      {/* API Key Permissions Reference */}
      <Card className="mb-6">
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold">Permissions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 border rounded-lg">
              <Badge variant="secondary" className="mb-2">read</Badge>
              <p className="text-sm text-muted-foreground">
                Akses untuk membaca data: list sessions, get messages, get contacts, dll.
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <Badge variant="secondary" className="mb-2">write</Badge>
              <p className="text-sm text-muted-foreground">
                Akses untuk menulis data: create session, send message, create webhook, dll.
              </p>
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
              <li>Gunakan permission minimal yang diperlukan</li>
              <li>Set expiration date untuk API key jika memungkinkan</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <EndpointCard
        method="GET"
        path="/api/api-keys"
        title="List API Keys"
        description="Ambil semua API keys milik user (hanya metadata, bukan key asli)"
        auth="JWT"
        curlExample={`curl -X GET "${baseUrl}/api/api-keys" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"`}
        responseExample={`{
  "success": true,
  "data": [
    {
      "id": "clxxx...",
      "name": "Production API Key",
      "keyPreview": "zetwa_abc...xyz",
      "permissions": ["read", "write"],
      "isActive": true,
      "lastUsed": "2026-01-14T10:00:00.000Z",
      "expiresAt": null,
      "createdAt": "2026-01-10T10:00:00.000Z"
    }
  ]
}`}
      />

      <EndpointCard
        method="POST"
        path="/api/api-keys"
        title="Create API Key"
        description="Buat API key baru. Key hanya ditampilkan sekali saat pembuatan!"
        auth="JWT"
        bodyParams={[
          { name: 'name', type: 'string', required: true, description: 'Nama API key (1-100 karakter)' },
          { name: 'permissions', type: 'string[]', required: false, description: 'Array permissions: ["read", "write"] (default: keduanya)' },
          { name: 'expiresAt', type: 'string', required: false, description: 'Tanggal kadaluarsa (ISO 8601 datetime)' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/api-keys" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -d '{
    "name": "Production API Key",
    "permissions": ["read", "write"],
    "expiresAt": "2027-01-14T00:00:00.000Z"
  }'`}
        responseExample={`{
  "success": true,
  "message": "API key created. Save the key now, it will not be shown again.",
  "data": {
    "id": "clxxx...",
    "name": "Production API Key",
    "key": "zetwa_1234567890abcdefghijklmnopqrstuvwxyz",
    "keyPreview": "zetwa_123...xyz",
    "permissions": ["read", "write"],
    "isActive": true,
    "expiresAt": "2027-01-14T00:00:00.000Z",
    "createdAt": "2026-01-14T10:00:00.000Z"
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
        curlExample={`curl -X GET "${baseUrl}/api/api-keys/clxxx..." \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"`}
        responseExample={`{
  "success": true,
  "data": {
    "id": "clxxx...",
    "name": "Production API Key",
    "keyPreview": "zetwa_123...xyz",
    "permissions": ["read", "write"],
    "isActive": true,
    "lastUsed": "2026-01-14T10:00:00.000Z",
    "expiresAt": "2027-01-14T00:00:00.000Z",
    "createdAt": "2026-01-10T10:00:00.000Z",
    "updatedAt": "2026-01-14T10:00:00.000Z"
  }
}`}
      />

      <EndpointCard
        method="PATCH"
        path="/api/api-keys/{keyId}"
        title="Update API Key"
        description="Update nama atau status API key"
        auth="JWT"
        pathParams={[
          { name: 'keyId', type: 'string', required: true, description: 'ID API key' },
        ]}
        bodyParams={[
          { name: 'name', type: 'string', required: false, description: 'Nama baru' },
          { name: 'isActive', type: 'boolean', required: false, description: 'Aktifkan/nonaktifkan API key' },
        ]}
        curlExample={`curl -X PATCH "${baseUrl}/api/api-keys/clxxx..." \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -d '{
    "name": "Renamed API Key",
    "isActive": false
  }'`}
        responseExample={`{
  "success": true,
  "message": "API key updated",
  "data": {
    "id": "clxxx...",
    "name": "Renamed API Key",
    "isActive": false
  }
}`}
      />

      <EndpointCard
        method="DELETE"
        path="/api/api-keys/{keyId}"
        title="Delete API Key"
        description="Hapus API key secara permanen"
        auth="JWT"
        pathParams={[
          { name: 'keyId', type: 'string', required: true, description: 'ID API key' },
        ]}
        curlExample={`curl -X DELETE "${baseUrl}/api/api-keys/clxxx..." \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"`}
        responseExample={`{
  "success": true,
  "message": "API key deleted"
}`}
      />

      <EndpointCard
        method="POST"
        path="/api/api-keys/{keyId}/regenerate"
        title="Regenerate API Key"
        description="Generate API key baru untuk ID yang sama. Key lama tidak akan berfungsi lagi."
        auth="JWT"
        pathParams={[
          { name: 'keyId', type: 'string', required: true, description: 'ID API key' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/api-keys/clxxx.../regenerate" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"`}
        responseExample={`{
  "success": true,
  "message": "API key regenerated. Save the new key now, it will not be shown again.",
  "data": {
    "id": "clxxx...",
    "name": "Production API Key",
    "key": "zetwa_newkey1234567890abcdefghijklmnop",
    "keyPreview": "zetwa_new...nop",
    "permissions": ["read", "write"],
    "isActive": true,
    "createdAt": "2026-01-10T10:00:00.000Z",
    "updatedAt": "2026-01-14T10:00:00.000Z"
  }
}`}
      />
    </div>
  )
}
