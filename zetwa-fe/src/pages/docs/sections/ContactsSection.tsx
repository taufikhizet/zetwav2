import { EndpointCard } from '../components'

interface ContactsSectionProps {
  baseUrl: string
}

export function ContactsSection({ baseUrl }: ContactsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Contacts & Chats API</h2>
        <p className="text-muted-foreground mt-1">
          Endpoint untuk mengambil kontak, chat, dan verifikasi nomor WhatsApp
        </p>
      </div>

      <EndpointCard
        method="GET"
        path="/api/sessions/{sessionId}/contacts"
        title="Get Contacts (Database)"
        description="Ambil daftar kontak yang tersimpan di database"
        auth="Both"
        scope="contacts:read"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
        ]}
        curlExample={`curl -X GET "${baseUrl}/api/sessions/{sessionId}/contacts" \\
  -H "X-API-Key: YOUR_API_KEY"`}
        responseExample={`{
  "success": true,
  "data": [
    {
      "id": "clxxx...",
      "contactId": "628123456789@c.us",
      "name": "John Doe",
      "pushname": "John",
      "number": "628123456789",
      "isMyContact": true,
      "isBusiness": false,
      "sessionId": "clxxx..."
    }
  ]
}`}
      />

      <EndpointCard
        method="GET"
        path="/api/sessions/{sessionId}/contacts/live"
        title="Get Contacts (Live)"
        description="Ambil daftar kontak langsung dari WhatsApp (real-time)"
        auth="Both"
        scope="contacts:read"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
        ]}
        curlExample={`curl -X GET "${baseUrl}/api/sessions/{sessionId}/contacts/live" \\
  -H "X-API-Key: YOUR_API_KEY"`}
        responseExample={`{
  "success": true,
  "data": [
    {
      "id": "628123456789@c.us",
      "name": "John Doe",
      "pushname": "John",
      "number": "628123456789",
      "isMyContact": true,
      "isBusiness": false
    },
    {
      "id": "628987654321@c.us",
      "name": "Jane Smith",
      "pushname": "Jane",
      "number": "628987654321",
      "isMyContact": true,
      "isBusiness": true
    }
  ]
}`}
      />

      <EndpointCard
        method="GET"
        path="/api/sessions/{sessionId}/chats"
        title="Get Chats (Database)"
        description="Ambil daftar chat yang tersimpan di database"
        auth="Both"
        scope="messages:read"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
        ]}
        curlExample={`curl -X GET "${baseUrl}/api/sessions/{sessionId}/chats" \\
  -H "X-API-Key: YOUR_API_KEY"`}
        responseExample={`{
  "success": true,
  "data": [
    {
      "id": "clxxx...",
      "chatId": "628123456789@c.us",
      "name": "John Doe",
      "isGroup": false,
      "unreadCount": 0,
      "lastMessageAt": "2026-01-14T10:00:00.000Z",
      "sessionId": "clxxx..."
    }
  ]
}`}
      />

      <EndpointCard
        method="GET"
        path="/api/sessions/{sessionId}/chats/live"
        title="Get Chats (Live)"
        description="Ambil daftar chat langsung dari WhatsApp (real-time)"
        auth="Both"
        scope="messages:read"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
        ]}
        curlExample={`curl -X GET "${baseUrl}/api/sessions/{sessionId}/chats/live" \\
  -H "X-API-Key: YOUR_API_KEY"`}
        responseExample={`{
  "success": true,
  "data": [
    {
      "id": "628123456789@c.us",
      "name": "John Doe",
      "isGroup": false,
      "isMuted": false,
      "unreadCount": 2,
      "timestamp": 1705226400
    },
    {
      "id": "120363xxx@g.us",
      "name": "Family Group",
      "isGroup": true,
      "isMuted": false,
      "unreadCount": 10,
      "timestamp": 1705226300
    }
  ]
}`}
      />

      <EndpointCard
        method="GET"
        path="/api/sessions/{sessionId}/check-number/{number}"
        title="Check WhatsApp Number"
        description="Cek apakah nomor telepon terdaftar di WhatsApp"
        auth="Both"
        scope="contacts:read"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
          { name: 'number', type: 'string', required: true, description: 'Nomor telepon yang ingin dicek (dengan kode negara)' },
        ]}
        curlExample={`curl -X GET "${baseUrl}/api/sessions/{sessionId}/check-number/628123456789" \\
  -H "X-API-Key: YOUR_API_KEY"`}
        responseExample={`{
  "success": true,
  "data": {
    "number": "628123456789",
    "isRegistered": true
  }
}`}
      />

      <EndpointCard
        method="GET"
        path="/api/sessions/{sessionId}/profile-pic/{contactId}"
        title="Get Profile Picture"
        description="Ambil URL foto profil kontak"
        auth="Both"
        scope="contacts:read"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
          { name: 'contactId', type: 'string', required: true, description: 'ID kontak (format: 628xxx@c.us)' },
        ]}
        curlExample={`curl -X GET "${baseUrl}/api/sessions/{sessionId}/profile-pic/628123456789@c.us" \\
  -H "X-API-Key: YOUR_API_KEY"`}
        responseExample={`{
  "success": true,
  "data": {
    "contactId": "628123456789@c.us",
    "profilePicUrl": "https://pps.whatsapp.net/v/..."
  }
}`}
      />
    </div>
  )
}
