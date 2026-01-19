import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EndpointCard } from '../components'

interface ExtendedMessagesSectionProps {
  baseUrl: string
}

export function ExtendedMessagesSection({ baseUrl }: ExtendedMessagesSectionProps) {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Extended Messages API</h2>
        <p className="text-muted-foreground mt-1">
          Endpoint untuk fitur pesan lanjutan: reactions, location, contact, poll, forward, dll
        </p>
      </div>

      {/* Supported Features */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-3">Fitur yang Didukung</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Reactions 👍</Badge>
            <Badge variant="secondary">Location 📍</Badge>
            <Badge variant="secondary">Contact/vCard 👤</Badge>
            <Badge variant="secondary">Poll 📊</Badge>
            <Badge variant="secondary">Forward ➡️</Badge>
            <Badge variant="secondary">Edit ✏️</Badge>
            <Badge variant="secondary">Delete 🗑️</Badge>
            <Badge variant="secondary">Star ⭐</Badge>
            <Badge variant="secondary">Download 📥</Badge>
          </div>
        </CardContent>
      </Card>

      <EndpointCard
        method="POST"
        path="/api/sessions/{sessionId}/messages/reaction"
        title="Send Reaction"
        description="Kirim reaksi emoji ke pesan"
        auth="Both"
        scope="messages:send"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
        ]}
        bodyParams={[
          { name: 'messageId', type: 'string', required: true, description: 'ID pesan yang akan diberi reaksi' },
          { name: 'reaction', type: 'string', required: true, description: 'Emoji reaksi (contoh: 👍, ❤️, 😂, 😮, 😢, 🙏)' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/sessions/{sessionId}/messages/reaction" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "messageId": "true_628123456789@c.us_ABC123",
    "reaction": "👍"
  }'`}
        responseExample={`{
  "success": true,
  "message": "Reaction sent"
}`}
      />

      <EndpointCard
        method="DELETE"
        path="/api/sessions/{sessionId}/messages/reaction"
        title="Remove Reaction"
        description="Hapus reaksi dari pesan"
        auth="Both"
        scope="messages:send"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
        ]}
        bodyParams={[
          { name: 'messageId', type: 'string', required: true, description: 'ID pesan' },
        ]}
        curlExample={`curl -X DELETE "${baseUrl}/api/sessions/{sessionId}/messages/reaction" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "messageId": "true_628123456789@c.us_ABC123"
  }'`}
        responseExample={`{
  "success": true,
  "message": "Reaction removed"
}`}
      />

      <EndpointCard
        method="POST"
        path="/api/sessions/{sessionId}/messages/send-location"
        title="Send Location"
        description="Kirim pesan lokasi"
        auth="Both"
        scope="messages:send"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
        ]}
        bodyParams={[
          { name: 'to', type: 'string', required: true, description: 'Nomor tujuan' },
          { name: 'latitude', type: 'number', required: true, description: 'Latitude koordinat (-90 sampai 90)' },
          { name: 'longitude', type: 'number', required: true, description: 'Longitude koordinat (-180 sampai 180)' },
          { name: 'description', type: 'string', required: false, description: 'Nama/deskripsi lokasi' },
          { name: 'url', type: 'string', required: false, description: 'URL lokasi (misalnya Google Maps link)' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/sessions/{sessionId}/messages/send-location" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "to": "628123456789",
    "latitude": -6.2088,
    "longitude": 106.8456,
    "description": "Monas, Jakarta"
  }'`}
        responseExample={`{
  "success": true,
  "message": "Location sent",
  "data": {
    "messageId": "true_628123456789@c.us_LOC123",
    "to": "628123456789@c.us",
    "timestamp": 1705226400
  }
}`}
      />

      <EndpointCard
        method="POST"
        path="/api/sessions/{sessionId}/messages/send-contact"
        title="Send Contact/vCard"
        description="Kirim kartu kontak"
        auth="Both"
        scope="messages:send"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
        ]}
        bodyParams={[
          { name: 'to', type: 'string', required: true, description: 'Nomor tujuan' },
          { name: 'contact', type: 'object', required: true, description: 'Data kontak' },
          { name: 'contact.name', type: 'string', required: true, description: 'Nama kontak' },
          { name: 'contact.phone', type: 'string', required: true, description: 'Nomor telepon' },
          { name: 'contact.organization', type: 'string', required: false, description: 'Organisasi/perusahaan' },
          { name: 'contact.email', type: 'string', required: false, description: 'Email' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/sessions/{sessionId}/messages/send-contact" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "to": "628123456789",
    "contact": {
      "name": "John Support",
      "phone": "628111222333",
      "organization": "Zetwa Inc",
      "email": "support@zetwa.com"
    }
  }'`}
        responseExample={`{
  "success": true,
  "message": "Contact sent",
  "data": {
    "messageId": "true_628123456789@c.us_VCARD123",
    "to": "628123456789@c.us",
    "timestamp": 1705226400
  }
}`}
      />

      <EndpointCard
        method="POST"
        path="/api/sessions/{sessionId}/messages/send-poll"
        title="Send Poll"
        description="Kirim polling/survey"
        auth="Both"
        scope="messages:send"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
        ]}
        bodyParams={[
          { name: 'to', type: 'string', required: true, description: 'Nomor tujuan atau ID grup' },
          { name: 'name', type: 'string', required: true, description: 'Judul/pertanyaan poll' },
          { name: 'options', type: 'string[]', required: true, description: 'Opsi jawaban (min 2, max 12)' },
          { name: 'allowMultipleAnswers', type: 'boolean', required: false, description: 'Izinkan pilih lebih dari satu (default: false)' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/sessions/{sessionId}/messages/send-poll" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "to": "120363123456789@g.us",
    "name": "Kapan meeting berikutnya?",
    "options": ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"],
    "allowMultipleAnswers": false
  }'`}
        responseExample={`{
  "success": true,
  "message": "Poll sent",
  "data": {
    "messageId": "true_120363123456789@g.us_POLL123",
    "to": "120363123456789@g.us",
    "timestamp": 1705226400
  }
}`}
      />

      <EndpointCard
        method="POST"
        path="/api/sessions/{sessionId}/messages/forward"
        title="Forward Message"
        description="Teruskan pesan ke chat lain"
        auth="Both"
        scope="messages:send"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
        ]}
        bodyParams={[
          { name: 'messageId', type: 'string', required: true, description: 'ID pesan yang akan diteruskan' },
          { name: 'to', type: 'string', required: true, description: 'Nomor/ID chat tujuan' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/sessions/{sessionId}/messages/forward" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "messageId": "true_628123456789@c.us_ABC123",
    "to": "628987654321"
  }'`}
        responseExample={`{
  "success": true,
  "message": "Message forwarded"
}`}
      />

      <EndpointCard
        method="DELETE"
        path="/api/sessions/{sessionId}/messages/{messageId}"
        title="Delete Message"
        description="Hapus pesan (untuk saya atau untuk semua)"
        auth="Both"
        scope="messages:send"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
          { name: 'messageId', type: 'string', required: true, description: 'ID pesan' },
        ]}
        queryParams={[
          { name: 'forEveryone', type: 'boolean', required: false, description: 'true = hapus untuk semua, false = hapus untuk saya saja' },
        ]}
        curlExample={`curl -X DELETE "${baseUrl}/api/sessions/{sessionId}/messages/true_628123456789@c.us_ABC123?forEveryone=true" \\
  -H "X-API-Key: YOUR_API_KEY"`}
        responseExample={`{
  "success": true,
  "message": "Message deleted for everyone"
}`}
      />

      <EndpointCard
        method="PATCH"
        path="/api/sessions/{sessionId}/messages/{messageId}"
        title="Edit Message"
        description="Edit isi pesan yang sudah terkirim"
        auth="Both"
        scope="messages:send"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
          { name: 'messageId', type: 'string', required: true, description: 'ID pesan' },
        ]}
        bodyParams={[
          { name: 'newContent', type: 'string', required: true, description: 'Isi pesan baru' },
        ]}
        curlExample={`curl -X PATCH "${baseUrl}/api/sessions/{sessionId}/messages/true_628123456789@c.us_ABC123" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "newContent": "Pesan yang sudah diedit"
  }'`}
        responseExample={`{
  "success": true,
  "message": "Message edited successfully"
}`}
      />

      <EndpointCard
        method="POST"
        path="/api/sessions/{sessionId}/messages/{messageId}/star"
        title="Star Message"
        description="Beri bintang atau hapus bintang dari pesan"
        auth="Both"
        scope="messages:send"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
          { name: 'messageId', type: 'string', required: true, description: 'ID pesan' },
        ]}
        bodyParams={[
          { name: 'star', type: 'boolean', required: false, description: 'true = beri bintang, false = hapus bintang (default: true)' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/sessions/{sessionId}/messages/true_628123456789@c.us_ABC123/star" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "star": true
  }'`}
        responseExample={`{
  "success": true,
  "message": "Message starred"
}`}
      />

      <EndpointCard
        method="GET"
        path="/api/sessions/{sessionId}/messages/starred"
        title="Get Starred Messages"
        description="Ambil semua pesan yang diberi bintang"
        auth="Both"
        scope="messages:read"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
        ]}
        curlExample={`curl -X GET "${baseUrl}/api/sessions/{sessionId}/messages/starred" \\
  -H "X-API-Key: YOUR_API_KEY"`}
        responseExample={`{
  "success": true,
  "data": [
    {
      "id": "true_628123456789@c.us_ABC123",
      "body": "Pesan penting",
      "from": "628123456789@c.us",
      "timestamp": 1705226400
    }
  ]
}`}
      />

      <EndpointCard
        method="GET"
        path="/api/sessions/{sessionId}/messages/{messageId}/download"
        title="Download Media"
        description="Download media dari pesan (gambar, video, dokumen, dll)"
        auth="Both"
        scope="media:read"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
          { name: 'messageId', type: 'string', required: true, description: 'ID pesan yang mengandung media' },
        ]}
        curlExample={`curl -X GET "${baseUrl}/api/sessions/{sessionId}/messages/true_628123456789@c.us_MEDIA123/download" \\
  -H "X-API-Key: YOUR_API_KEY"`}
        responseExample={`{
  "success": true,
  "data": {
    "mimetype": "image/jpeg",
    "data": "base64_encoded_data...",
    "filename": "image.jpg"
  }
}`}
      />

      <EndpointCard
        method="GET"
        path="/api/sessions/{sessionId}/messages/{messageId}/info"
        title="Get Message Info"
        description="Ambil info pesan (siapa yang baca, delivered, dll)"
        auth="Both"
        scope="messages:read"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
          { name: 'messageId', type: 'string', required: true, description: 'ID pesan' },
        ]}
        curlExample={`curl -X GET "${baseUrl}/api/sessions/{sessionId}/messages/true_628123456789@c.us_ABC123/info" \\
  -H "X-API-Key: YOUR_API_KEY"`}
        responseExample={`{
  "success": true,
  "data": {
    "delivery": [
      { "id": "628123456789@c.us", "t": 1705226401 }
    ],
    "read": [
      { "id": "628123456789@c.us", "t": 1705226410 }
    ],
    "played": []
  }
}`}
      />
    </div>
  )
}
