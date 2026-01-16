import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EndpointCard } from '../components'

interface PresenceSectionProps {
  baseUrl: string
}

export function PresenceSection({ baseUrl }: PresenceSectionProps) {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Presence API</h2>
        <p className="text-muted-foreground mt-1">
          Endpoint untuk mengelola status kehadiran dan indikator aktivitas
        </p>
      </div>

      {/* Presence Status Reference */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-3">Presence Status</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">available</Badge>
            <Badge variant="secondary">unavailable</Badge>
            <Badge variant="secondary">composing</Badge>
            <Badge variant="secondary">recording</Badge>
            <Badge variant="secondary">paused</Badge>
          </div>
        </CardContent>
      </Card>

      <EndpointCard
        method="POST"
        path="/api/sessions/{sessionId}/presence"
        title="Set Presence"
        description="Set status kehadiran (online/offline)"
        auth="Both"
        scope="presence:write"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
        ]}
        bodyParams={[
          { name: 'presence', type: 'string', required: true, description: 'Status: available, unavailable, composing, recording, paused' },
          { name: 'chatId', type: 'string', required: false, description: 'Chat ID (opsional, untuk typing di chat tertentu)' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/sessions/{sessionId}/presence" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "presence": "available"
  }'`}
        responseExample={`{
  "success": true,
  "message": "Presence set to available"
}`}
      />

      <EndpointCard
        method="POST"
        path="/api/sessions/{sessionId}/presence/subscribe"
        title="Subscribe to Presence"
        description="Subscribe ke update kehadiran kontak tertentu"
        auth="Both"
        scope="presence:read"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
        ]}
        bodyParams={[
          { name: 'contactId', type: 'string', required: true, description: 'ID kontak yang ingin di-subscribe' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/sessions/{sessionId}/presence/subscribe" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "contactId": "628123456789@c.us"
  }'`}
        responseExample={`{
  "success": true,
  "message": "Subscribed to presence updates"
}`}
      />

      <EndpointCard
        method="GET"
        path="/api/sessions/{sessionId}/presence/{contactId}"
        title="Get Presence"
        description="Ambil status kehadiran kontak"
        auth="Both"
        scope="presence:read"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
          { name: 'contactId', type: 'string', required: true, description: 'ID kontak' },
        ]}
        curlExample={`curl -X GET "${baseUrl}/api/sessions/{sessionId}/presence/628123456789@c.us" \\
  -H "X-API-Key: YOUR_API_KEY"`}
        responseExample={`{
  "success": true,
  "data": {
    "id": "628123456789@c.us",
    "presence": "available",
    "lastSeen": "2026-01-14T10:00:00.000Z"
  }
}`}
      />

      <EndpointCard
        method="POST"
        path="/api/sessions/{sessionId}/presence/typing/{chatId}"
        title="Send Typing Indicator"
        description="Kirim indikator sedang mengetik"
        auth="Both"
        scope="presence:write"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
          { name: 'chatId', type: 'string', required: true, description: 'ID chat tujuan' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/sessions/{sessionId}/presence/typing/628123456789@c.us" \\
  -H "X-API-Key: YOUR_API_KEY"`}
        responseExample={`{
  "success": true,
  "message": "Typing indicator sent"
}`}
      />

      <EndpointCard
        method="DELETE"
        path="/api/sessions/{sessionId}/presence/typing/{chatId}"
        title="Stop Typing Indicator"
        description="Hentikan indikator sedang mengetik"
        auth="Both"
        scope="presence:write"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
          { name: 'chatId', type: 'string', required: true, description: 'ID chat' },
        ]}
        curlExample={`curl -X DELETE "${baseUrl}/api/sessions/{sessionId}/presence/typing/628123456789@c.us" \\
  -H "X-API-Key: YOUR_API_KEY"`}
        responseExample={`{
  "success": true,
  "message": "Typing indicator stopped"
}`}
      />

      <EndpointCard
        method="POST"
        path="/api/sessions/{sessionId}/presence/recording/{chatId}"
        title="Send Recording Indicator"
        description="Kirim indikator sedang merekam audio"
        auth="Both"
        scope="presence:write"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
          { name: 'chatId', type: 'string', required: true, description: 'ID chat tujuan' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/sessions/{sessionId}/presence/recording/628123456789@c.us" \\
  -H "X-API-Key: YOUR_API_KEY"`}
        responseExample={`{
  "success": true,
  "message": "Recording indicator sent"
}`}
      />

      <EndpointCard
        method="DELETE"
        path="/api/sessions/{sessionId}/presence/recording/{chatId}"
        title="Stop Recording Indicator"
        description="Hentikan indikator sedang merekam"
        auth="Both"
        scope="presence:write"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
          { name: 'chatId', type: 'string', required: true, description: 'ID chat' },
        ]}
        curlExample={`curl -X DELETE "${baseUrl}/api/sessions/{sessionId}/presence/recording/628123456789@c.us" \\
  -H "X-API-Key: YOUR_API_KEY"`}
        responseExample={`{
  "success": true,
  "message": "Recording indicator stopped"
}`}
      />

      <EndpointCard
        method="POST"
        path="/api/sessions/{sessionId}/presence/seen/{chatId}"
        title="Mark as Seen"
        description="Tandai pesan di chat sebagai sudah dibaca"
        auth="Both"
        scope="presence:write"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
          { name: 'chatId', type: 'string', required: true, description: 'ID chat' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/sessions/{sessionId}/presence/seen/628123456789@c.us" \\
  -H "X-API-Key: YOUR_API_KEY"`}
        responseExample={`{
  "success": true,
  "message": "Messages marked as seen"
}`}
      />
    </div>
  )
}
