import { Card, CardContent } from '@/components/ui/card'
import { EndpointCard } from '../components'

interface StatusSectionProps {
  baseUrl: string
}

export function StatusSection({ baseUrl }: StatusSectionProps) {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Status API</h2>
        <p className="text-muted-foreground mt-1">
          Endpoint untuk mengelola status/story WhatsApp
        </p>
      </div>

      {/* Status Info */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-3">Tentang Status WhatsApp</h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Status bertahan selama 24 jam</li>
            <li>Bisa berupa teks atau media (gambar/video)</li>
            <li>Status teks bisa memiliki background color dan font style</li>
            <li>Anda bisa melihat status kontak dan memposting status sendiri</li>
          </ul>
        </CardContent>
      </Card>

      <EndpointCard
        method="GET"
        path="/api/sessions/{sessionId}/status"
        title="Get My Statuses"
        description="Ambil status yang saya posting"
        auth="Both"
        scope="status:read"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
        ]}
        curlExample={`curl -X GET "${baseUrl}/api/sessions/{sessionId}/status" \\
  -H "X-API-Key: YOUR_API_KEY"`}
        responseExample={`{
  "success": true,
  "data": [
    {
      "id": "status_123456",
      "type": "text",
      "content": "Hello World!",
      "backgroundColor": "#25D366",
      "timestamp": "2026-01-14T10:00:00.000Z",
      "views": 15
    }
  ]
}`}
      />

      <EndpointCard
        method="GET"
        path="/api/sessions/{sessionId}/status/contacts"
        title="Get Contact Statuses"
        description="Ambil status dari semua kontak"
        auth="Both"
        scope="status:read"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
        ]}
        curlExample={`curl -X GET "${baseUrl}/api/sessions/{sessionId}/status/contacts" \\
  -H "X-API-Key: YOUR_API_KEY"`}
        responseExample={`{
  "success": true,
  "data": [
    {
      "contactId": "628123456789@c.us",
      "contactName": "John Doe",
      "statuses": [
        {
          "id": "status_789",
          "type": "image",
          "caption": "Beautiful day!",
          "timestamp": "2026-01-14T09:00:00.000Z"
        }
      ]
    }
  ]
}`}
      />

      <EndpointCard
        method="GET"
        path="/api/sessions/{sessionId}/status/contact/{contactId}"
        title="Get Specific Contact Status"
        description="Ambil status dari kontak tertentu"
        auth="Both"
        scope="status:read"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
          { name: 'contactId', type: 'string', required: true, description: 'ID kontak' },
        ]}
        curlExample={`curl -X GET "${baseUrl}/api/sessions/{sessionId}/status/contact/628123456789@c.us" \\
  -H "X-API-Key: YOUR_API_KEY"`}
        responseExample={`{
  "success": true,
  "data": [
    {
      "id": "status_789",
      "type": "image",
      "caption": "Beautiful day!",
      "timestamp": "2026-01-14T09:00:00.000Z"
    }
  ]
}`}
      />

      <EndpointCard
        method="POST"
        path="/api/sessions/{sessionId}/status/text"
        title="Post Text Status"
        description="Posting status teks"
        auth="Both"
        scope="status:write"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
        ]}
        bodyParams={[
          { name: 'text', type: 'string', required: true, description: 'Teks status (max 700 karakter)' },
          { name: 'backgroundColor', type: 'string', required: false, description: 'Warna background (hex, contoh: #25D366)' },
          { name: 'font', type: 'number', required: false, description: 'ID font (0-5)' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/sessions/{sessionId}/status/text" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "text": "Hello from Zetwa API! 🚀",
    "backgroundColor": "#128C7E",
    "font": 2
  }'`}
        responseExample={`{
  "success": true,
  "message": "Status posted successfully",
  "data": {
    "id": "status_new123"
  }
}`}
      />

      <EndpointCard
        method="POST"
        path="/api/sessions/{sessionId}/status/media"
        title="Post Media Status"
        description="Posting status gambar atau video"
        auth="Both"
        scope="status:write"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
        ]}
        bodyParams={[
          { name: 'mediaUrl', type: 'string', required: false, description: 'URL media (gunakan salah satu)' },
          { name: 'mediaBase64', type: 'string', required: false, description: 'Base64 media (gunakan salah satu)' },
          { name: 'mimetype', type: 'string', required: false, description: 'MIME type (required jika base64). Contoh: image/jpeg, video/mp4' },
          { name: 'caption', type: 'string', required: false, description: 'Caption status (max 700 karakter)' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/sessions/{sessionId}/status/media" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "mediaUrl": "https://example.com/image.jpg",
    "caption": "Check this out! 📸"
  }'`}
        responseExample={`{
  "success": true,
  "message": "Media status posted successfully",
  "data": {
    "id": "status_media456"
  }
}`}
      />

      <EndpointCard
        method="DELETE"
        path="/api/sessions/{sessionId}/status/{statusId}"
        title="Delete Status"
        description="Hapus status"
        auth="Both"
        scope="status:write"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
          { name: 'statusId', type: 'string', required: true, description: 'ID status yang akan dihapus' },
        ]}
        curlExample={`curl -X DELETE "${baseUrl}/api/sessions/{sessionId}/status/status_123456" \\
  -H "X-API-Key: YOUR_API_KEY"`}
        responseExample={`{
  "success": true,
  "message": "Status deleted successfully"
}`}
      />

      <EndpointCard
        method="POST"
        path="/api/sessions/{sessionId}/status/{statusId}/seen"
        title="Mark Status as Seen"
        description="Tandai status kontak sebagai sudah dilihat"
        auth="Both"
        scope="status:write"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
          { name: 'statusId', type: 'string', required: true, description: 'ID status' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/sessions/{sessionId}/status/status_789/seen" \\
  -H "X-API-Key: YOUR_API_KEY"`}
        responseExample={`{
  "success": true,
  "message": "Status marked as seen"
}`}
      />
    </div>
  )
}
