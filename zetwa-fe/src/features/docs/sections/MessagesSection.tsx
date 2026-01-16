import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EndpointCard } from '../components'

interface MessagesSectionProps {
  baseUrl: string
}

export function MessagesSection({ baseUrl }: MessagesSectionProps) {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Messages API</h2>
        <p className="text-muted-foreground mt-1">
          Endpoint untuk mengirim dan mengambil pesan WhatsApp
        </p>
      </div>

      {/* Message Types Reference */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-3">Tipe Pesan yang Didukung</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">TEXT</Badge>
            <Badge variant="secondary">IMAGE</Badge>
            <Badge variant="secondary">VIDEO</Badge>
            <Badge variant="secondary">AUDIO</Badge>
            <Badge variant="secondary">DOCUMENT</Badge>
            <Badge variant="secondary">STICKER</Badge>
            <Badge variant="secondary">LOCATION</Badge>
            <Badge variant="secondary">CONTACT</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Phone Number Format */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-3">Format Nomor Telepon</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Gunakan kode negara tanpa simbol <code className="bg-muted px-1 rounded">+</code>:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-muted rounded-lg">
              <div className="font-medium">Indonesia</div>
              <code>628123456789</code>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="font-medium">USA</div>
              <code>14155551234</code>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="font-medium">UK</div>
              <code>447911123456</code>
            </div>
          </div>
        </CardContent>
      </Card>

      <EndpointCard
        method="POST"
        path="/api/sessions/{sessionId}/messages/send"
        title="Send Text Message"
        description="Kirim pesan teks ke nomor WhatsApp"
        auth="Both"
        scope="messages:send"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
        ]}
        bodyParams={[
          { name: 'to', type: 'string', required: true, description: 'Nomor tujuan (dengan kode negara, tanpa +)' },
          { name: 'message', type: 'string', required: true, description: 'Isi pesan (max 65536 karakter)' },
          { name: 'quotedMessageId', type: 'string', required: false, description: 'ID pesan yang ingin di-reply' },
          { name: 'mentions', type: 'string[]', required: false, description: 'Array nomor yang di-mention (untuk grup)' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/sessions/cmkd4b4pw00034jjvcm2msjs2/messages/send" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: zk_live_abc123xyz456def789" \\
  -d '{
    "to": "628123456789",
    "message": "Hello World!"
  }'`}
        responseExample={`{
  "success": true,
  "message": "Message sent",
  "data": {
    "messageId": "true_628123456789@c.us_ABCD1234567890",
    "to": "628123456789@c.us",
    "timestamp": 1705226400
  }
}`}
      />

      <EndpointCard
        method="POST"
        path="/api/sessions/{sessionId}/messages/send"
        title="Send Reply Message"
        description="Kirim pesan sebagai reply ke pesan tertentu"
        auth="Both"
        scope="messages:send"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
        ]}
        bodyParams={[
          { name: 'to', type: 'string', required: true, description: 'Nomor tujuan' },
          { name: 'message', type: 'string', required: true, description: 'Isi pesan' },
          { name: 'quotedMessageId', type: 'string', required: true, description: 'ID pesan yang di-reply' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/sessions/{sessionId}/messages/send" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "to": "628123456789",
    "message": "This is a reply!",
    "quotedMessageId": "true_628123456789@c.us_ABCD1234567890"
  }'`}
        responseExample={`{
  "success": true,
  "message": "Message sent",
  "data": {
    "messageId": "true_628123456789@c.us_XYZ9876543210",
    "to": "628123456789@c.us",
    "timestamp": 1705226500
  }
}`}
      />

      <EndpointCard
        method="POST"
        path="/api/sessions/{sessionId}/messages/send-media"
        title="Send Media (Image/Video/Document)"
        description="Kirim media (gambar, video, dokumen) via URL. Membutuhkan scope messages:send DAN media:write."
        auth="Both"
        scope="messages:send, media:write"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
        ]}
        bodyParams={[
          { name: 'to', type: 'string', required: true, description: 'Nomor tujuan' },
          { name: 'mediaUrl', type: 'string', required: false, description: 'URL media yang akan dikirim (gunakan salah satu: mediaUrl atau mediaBase64)' },
          { name: 'mediaBase64', type: 'string', required: false, description: 'Base64 encoded media' },
          { name: 'mimetype', type: 'string', required: false, description: 'MIME type (required jika pakai mediaBase64). Contoh: image/jpeg, video/mp4, application/pdf' },
          { name: 'filename', type: 'string', required: false, description: 'Nama file (untuk dokumen)' },
          { name: 'caption', type: 'string', required: false, description: 'Caption/keterangan (max 1024 karakter)' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/sessions/{sessionId}/messages/send-media" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "to": "628123456789",
    "mediaUrl": "https://example.com/image.jpg",
    "caption": "Check this out!"
  }'`}
        responseExample={`{
  "success": true,
  "message": "Media sent",
  "data": {
    "messageId": "true_628123456789@c.us_MEDIA123456",
    "to": "628123456789@c.us",
    "timestamp": 1705226600
  }
}`}
      />

      <EndpointCard
        method="POST"
        path="/api/sessions/{sessionId}/messages/send-media"
        title="Send Document"
        description="Kirim dokumen (PDF, Word, Excel, dll). Membutuhkan scope messages:send DAN media:write."
        auth="Both"
        scope="messages:send, media:write"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
        ]}
        bodyParams={[
          { name: 'to', type: 'string', required: true, description: 'Nomor tujuan' },
          { name: 'mediaUrl', type: 'string', required: true, description: 'URL dokumen' },
          { name: 'filename', type: 'string', required: true, description: 'Nama file yang ditampilkan' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/sessions/{sessionId}/messages/send-media" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "to": "628123456789",
    "mediaUrl": "https://example.com/report.pdf",
    "filename": "Laporan-Januari-2026.pdf"
  }'`}
        responseExample={`{
  "success": true,
  "message": "Media sent",
  "data": {
    "messageId": "true_628123456789@c.us_DOC123456",
    "to": "628123456789@c.us",
    "timestamp": 1705226700
  }
}`}
      />

      <EndpointCard
        method="POST"
        path="/api/sessions/{sessionId}/messages/send-media"
        title="Send Media with Base64"
        description="Kirim media menggunakan Base64 encoded data. Membutuhkan scope messages:send DAN media:write."
        auth="Both"
        scope="messages:send, media:write"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
        ]}
        bodyParams={[
          { name: 'to', type: 'string', required: true, description: 'Nomor tujuan' },
          { name: 'mediaBase64', type: 'string', required: true, description: 'Base64 encoded media (tanpa prefix data:...)' },
          { name: 'mimetype', type: 'string', required: true, description: 'MIME type file' },
          { name: 'filename', type: 'string', required: false, description: 'Nama file' },
          { name: 'caption', type: 'string', required: false, description: 'Caption' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/sessions/{sessionId}/messages/send-media" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "to": "628123456789",
    "mediaBase64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ...",
    "mimetype": "image/png",
    "caption": "Image from Base64"
  }'`}
        responseExample={`{
  "success": true,
  "message": "Media sent",
  "data": {
    "messageId": "true_628123456789@c.us_BASE64IMG",
    "to": "628123456789@c.us",
    "timestamp": 1705226800
  }
}`}
      />

      <EndpointCard
        method="GET"
        path="/api/sessions/{sessionId}/messages"
        title="Get Messages"
        description="Ambil riwayat pesan dengan filter dan pagination"
        auth="Both"
        scope="messages:read"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
        ]}
        queryParams={[
          { name: 'page', type: 'number', required: false, description: 'Halaman (default: 1)' },
          { name: 'limit', type: 'number', required: false, description: 'Jumlah per halaman (default: 50)' },
          { name: 'direction', type: 'string', required: false, description: 'Filter: INCOMING atau OUTGOING' },
          { name: 'type', type: 'string', required: false, description: 'Filter tipe: TEXT, IMAGE, VIDEO, AUDIO, DOCUMENT, STICKER, LOCATION, CONTACT' },
          { name: 'chatId', type: 'string', required: false, description: 'Filter berdasarkan chat ID' },
          { name: 'startDate', type: 'string', required: false, description: 'Filter dari tanggal (ISO 8601)' },
          { name: 'endDate', type: 'string', required: false, description: 'Filter sampai tanggal (ISO 8601)' },
        ]}
        curlExample={`curl -X GET "${baseUrl}/api/sessions/{sessionId}/messages?page=1&limit=20&direction=INCOMING" \\
  -H "X-API-Key: YOUR_API_KEY"`}
        responseExample={`{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "clxxx...",
        "messageId": "true_628123456789@c.us_ABC123",
        "from": "628123456789@c.us",
        "to": "628987654321@c.us",
        "body": "Hello!",
        "type": "TEXT",
        "direction": "INCOMING",
        "timestamp": "2026-01-14T10:00:00.000Z",
        "chat": {
          "id": "clxxx...",
          "name": "John Doe",
          "isGroup": false
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}`}
      />
    </div>
  )
}
