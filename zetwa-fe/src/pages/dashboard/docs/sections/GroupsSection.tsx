import { EndpointCard } from '../components'

interface GroupsSectionProps {
  baseUrl: string
}

export function GroupsSection({ baseUrl }: GroupsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Groups API</h2>
        <p className="text-muted-foreground mt-1">
          Endpoint untuk mengelola grup WhatsApp
        </p>
      </div>

      <EndpointCard
        method="GET"
        path="/api/sessions/{sessionId}/groups"
        title="List Groups"
        description="Ambil semua grup yang diikuti"
        auth="Both"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
        ]}
        curlExample={`curl -X GET "${baseUrl}/api/sessions/{sessionId}/groups" \\
  -H "X-API-Key: YOUR_API_KEY"`}
        responseExample={`{
  "success": true,
  "data": [
    {
      "id": "120363123456789@g.us",
      "name": "Family Group",
      "description": "Family chat",
      "isGroup": true,
      "participantsCount": 10,
      "owner": "628123456789@c.us",
      "createdAt": "2026-01-14T10:00:00.000Z"
    }
  ]
}`}
      />

      <EndpointCard
        method="POST"
        path="/api/sessions/{sessionId}/groups"
        title="Create Group"
        description="Buat grup WhatsApp baru"
        auth="Both"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
        ]}
        bodyParams={[
          { name: 'name', type: 'string', required: true, description: 'Nama grup (3-25 karakter)' },
          { name: 'participants', type: 'string[]', required: true, description: 'Array nomor peserta (min 1)' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/sessions/{sessionId}/groups" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "name": "My New Group",
    "participants": ["628123456789", "628987654321"]
  }'`}
        responseExample={`{
  "success": true,
  "message": "Group created successfully",
  "data": {
    "id": "120363987654321@g.us",
    "name": "My New Group"
  }
}`}
      />

      <EndpointCard
        method="GET"
        path="/api/sessions/{sessionId}/groups/{groupId}"
        title="Get Group Info"
        description="Ambil detail informasi grup"
        auth="Both"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
          { name: 'groupId', type: 'string', required: true, description: 'ID grup (format: xxx@g.us)' },
        ]}
        curlExample={`curl -X GET "${baseUrl}/api/sessions/{sessionId}/groups/120363123456789@g.us" \\
  -H "X-API-Key: YOUR_API_KEY"`}
        responseExample={`{
  "success": true,
  "data": {
    "id": "120363123456789@g.us",
    "name": "Family Group",
    "description": "Family chat group",
    "owner": "628123456789@c.us",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "participants": [
      { "id": "628123456789@c.us", "isAdmin": true, "isSuperAdmin": true },
      { "id": "628987654321@c.us", "isAdmin": false, "isSuperAdmin": false }
    ]
  }
}`}
      />

      <EndpointCard
        method="PATCH"
        path="/api/sessions/{sessionId}/groups/{groupId}"
        title="Update Group"
        description="Update nama atau deskripsi grup"
        auth="Both"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
          { name: 'groupId', type: 'string', required: true, description: 'ID grup' },
        ]}
        bodyParams={[
          { name: 'name', type: 'string', required: false, description: 'Nama baru grup' },
          { name: 'description', type: 'string', required: false, description: 'Deskripsi baru grup' },
        ]}
        curlExample={`curl -X PATCH "${baseUrl}/api/sessions/{sessionId}/groups/120363123456789@g.us" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "name": "New Group Name",
    "description": "Updated description"
  }'`}
        responseExample={`{
  "success": true,
  "message": "Group updated successfully"
}`}
      />

      <EndpointCard
        method="PATCH"
        path="/api/sessions/{sessionId}/groups/{groupId}/settings"
        title="Update Group Settings"
        description="Update pengaturan grup (announce mode, restrict)"
        auth="Both"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
          { name: 'groupId', type: 'string', required: true, description: 'ID grup' },
        ]}
        bodyParams={[
          { name: 'announce', type: 'boolean', required: false, description: 'Mode pengumuman (hanya admin yang bisa kirim pesan)' },
          { name: 'restrict', type: 'boolean', required: false, description: 'Restrict mode (hanya admin yang bisa edit info grup)' },
        ]}
        curlExample={`curl -X PATCH "${baseUrl}/api/sessions/{sessionId}/groups/120363123456789@g.us/settings" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "announce": true,
    "restrict": true
  }'`}
        responseExample={`{
  "success": true,
  "message": "Group settings updated successfully"
}`}
      />

      <EndpointCard
        method="GET"
        path="/api/sessions/{sessionId}/groups/{groupId}/participants"
        title="Get Group Participants"
        description="Ambil daftar peserta grup"
        auth="Both"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
          { name: 'groupId', type: 'string', required: true, description: 'ID grup' },
        ]}
        curlExample={`curl -X GET "${baseUrl}/api/sessions/{sessionId}/groups/120363123456789@g.us/participants" \\
  -H "X-API-Key: YOUR_API_KEY"`}
        responseExample={`{
  "success": true,
  "data": [
    { "id": "628123456789@c.us", "isAdmin": true, "isSuperAdmin": true },
    { "id": "628987654321@c.us", "isAdmin": false, "isSuperAdmin": false }
  ]
}`}
      />

      <EndpointCard
        method="POST"
        path="/api/sessions/{sessionId}/groups/{groupId}/participants/add"
        title="Add Participants"
        description="Tambah peserta ke grup"
        auth="Both"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
          { name: 'groupId', type: 'string', required: true, description: 'ID grup' },
        ]}
        bodyParams={[
          { name: 'participants', type: 'string[]', required: true, description: 'Array nomor peserta yang akan ditambahkan' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/sessions/{sessionId}/groups/120363123456789@g.us/participants/add" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "participants": ["628111222333", "628444555666"]
  }'`}
        responseExample={`{
  "success": true,
  "message": "Participants added successfully"
}`}
      />

      <EndpointCard
        method="POST"
        path="/api/sessions/{sessionId}/groups/{groupId}/participants/remove"
        title="Remove Participants"
        description="Hapus peserta dari grup"
        auth="Both"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
          { name: 'groupId', type: 'string', required: true, description: 'ID grup' },
        ]}
        bodyParams={[
          { name: 'participants', type: 'string[]', required: true, description: 'Array nomor peserta yang akan dihapus' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/sessions/{sessionId}/groups/120363123456789@g.us/participants/remove" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "participants": ["628111222333"]
  }'`}
        responseExample={`{
  "success": true,
  "message": "Participants removed successfully"
}`}
      />

      <EndpointCard
        method="POST"
        path="/api/sessions/{sessionId}/groups/{groupId}/participants/promote"
        title="Promote to Admin"
        description="Jadikan peserta sebagai admin grup"
        auth="Both"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
          { name: 'groupId', type: 'string', required: true, description: 'ID grup' },
        ]}
        bodyParams={[
          { name: 'participants', type: 'string[]', required: true, description: 'Array nomor peserta yang akan dijadikan admin' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/sessions/{sessionId}/groups/120363123456789@g.us/participants/promote" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "participants": ["628987654321"]
  }'`}
        responseExample={`{
  "success": true,
  "message": "Participants promoted to admin"
}`}
      />

      <EndpointCard
        method="POST"
        path="/api/sessions/{sessionId}/groups/{groupId}/participants/demote"
        title="Demote from Admin"
        description="Hapus status admin dari peserta"
        auth="Both"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
          { name: 'groupId', type: 'string', required: true, description: 'ID grup' },
        ]}
        bodyParams={[
          { name: 'participants', type: 'string[]', required: true, description: 'Array nomor peserta yang akan dihapus status adminnya' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/sessions/{sessionId}/groups/120363123456789@g.us/participants/demote" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "participants": ["628987654321"]
  }'`}
        responseExample={`{
  "success": true,
  "message": "Participants demoted from admin"
}`}
      />

      <EndpointCard
        method="POST"
        path="/api/sessions/{sessionId}/groups/{groupId}/leave"
        title="Leave Group"
        description="Keluar dari grup"
        auth="Both"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
          { name: 'groupId', type: 'string', required: true, description: 'ID grup' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/sessions/{sessionId}/groups/120363123456789@g.us/leave" \\
  -H "X-API-Key: YOUR_API_KEY"`}
        responseExample={`{
  "success": true,
  "message": "Left group successfully"
}`}
      />

      <EndpointCard
        method="GET"
        path="/api/sessions/{sessionId}/groups/{groupId}/invite-code"
        title="Get Invite Link"
        description="Ambil link undangan grup"
        auth="Both"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
          { name: 'groupId', type: 'string', required: true, description: 'ID grup' },
        ]}
        curlExample={`curl -X GET "${baseUrl}/api/sessions/{sessionId}/groups/120363123456789@g.us/invite-code" \\
  -H "X-API-Key: YOUR_API_KEY"`}
        responseExample={`{
  "success": true,
  "data": {
    "inviteCode": "ABCxyz123",
    "inviteLink": "https://chat.whatsapp.com/ABCxyz123"
  }
}`}
      />

      <EndpointCard
        method="POST"
        path="/api/sessions/{sessionId}/groups/{groupId}/revoke-invite"
        title="Revoke Invite Link"
        description="Revoke dan generate link undangan baru"
        auth="Both"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
          { name: 'groupId', type: 'string', required: true, description: 'ID grup' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/sessions/{sessionId}/groups/120363123456789@g.us/revoke-invite" \\
  -H "X-API-Key: YOUR_API_KEY"`}
        responseExample={`{
  "success": true,
  "message": "Invite link revoked successfully",
  "data": {
    "inviteCode": "NEWxyz456",
    "inviteLink": "https://chat.whatsapp.com/NEWxyz456"
  }
}`}
      />

      <EndpointCard
        method="POST"
        path="/api/sessions/{sessionId}/groups/join/{inviteCode}"
        title="Join Group via Invite"
        description="Gabung ke grup menggunakan kode undangan"
        auth="Both"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
          { name: 'inviteCode', type: 'string', required: true, description: 'Kode undangan (dari link whatsapp.com/xxx)' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/sessions/{sessionId}/groups/join/ABCxyz123" \\
  -H "X-API-Key: YOUR_API_KEY"`}
        responseExample={`{
  "success": true,
  "message": "Joined group successfully",
  "data": {
    "groupId": "120363123456789@g.us"
  }
}`}
      />

      <EndpointCard
        method="PATCH"
        path="/api/sessions/{sessionId}/groups/{groupId}/picture"
        title="Update Group Picture"
        description="Update foto profil grup"
        auth="Both"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
          { name: 'groupId', type: 'string', required: true, description: 'ID grup' },
        ]}
        bodyParams={[
          { name: 'imageUrl', type: 'string', required: false, description: 'URL gambar (gunakan salah satu)' },
          { name: 'imageBase64', type: 'string', required: false, description: 'Base64 gambar (gunakan salah satu)' },
        ]}
        curlExample={`curl -X PATCH "${baseUrl}/api/sessions/{sessionId}/groups/120363123456789@g.us/picture" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "imageUrl": "https://example.com/group-pic.jpg"
  }'`}
        responseExample={`{
  "success": true,
  "message": "Group picture updated successfully"
}`}
      />
    </div>
  )
}
