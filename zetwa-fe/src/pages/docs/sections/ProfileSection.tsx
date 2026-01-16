import { EndpointCard } from '../components'

interface ProfileSectionProps {
  baseUrl: string
}

export function ProfileSection({ baseUrl }: ProfileSectionProps) {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Profile API</h2>
        <p className="text-muted-foreground mt-1">
          Endpoint untuk mengelola profil WhatsApp (nama, about, foto profil)
        </p>
      </div>

      <EndpointCard
        method="GET"
        path="/api/sessions/{sessionId}/profile"
        title="Get Profile"
        description="Ambil informasi profil WhatsApp"
        auth="Both"
        scope="profile:read"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
        ]}
        curlExample={`curl -X GET "${baseUrl}/api/sessions/{sessionId}/profile" \\
  -H "X-API-Key: YOUR_API_KEY"`}
        responseExample={`{
  "success": true,
  "data": {
    "id": "628123456789@c.us",
    "pushName": "John Doe",
    "about": "Hello, I'm using WhatsApp!",
    "profilePicUrl": "https://...",
    "phoneNumber": "628123456789"
  }
}`}
      />

      <EndpointCard
        method="PATCH"
        path="/api/sessions/{sessionId}/profile/name"
        title="Update Display Name"
        description="Update nama tampilan WhatsApp"
        auth="Both"
        scope="profile:write"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
        ]}
        bodyParams={[
          { name: 'name', type: 'string', required: true, description: 'Nama baru (1-25 karakter)' },
        ]}
        curlExample={`curl -X PATCH "${baseUrl}/api/sessions/{sessionId}/profile/name" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "name": "John Business"
  }'`}
        responseExample={`{
  "success": true,
  "message": "Profile name updated successfully"
}`}
      />

      <EndpointCard
        method="PATCH"
        path="/api/sessions/{sessionId}/profile/about"
        title="Update About"
        description="Update status/about WhatsApp"
        auth="Both"
        scope="profile:write"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
        ]}
        bodyParams={[
          { name: 'about', type: 'string', required: true, description: 'Teks about baru (max 139 karakter)' },
        ]}
        curlExample={`curl -X PATCH "${baseUrl}/api/sessions/{sessionId}/profile/about" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "about": "Available for business inquiries 📧"
  }'`}
        responseExample={`{
  "success": true,
  "message": "Profile about updated successfully"
}`}
      />

      <EndpointCard
        method="PATCH"
        path="/api/sessions/{sessionId}/profile/picture"
        title="Update Profile Picture"
        description="Update foto profil WhatsApp"
        auth="Both"
        scope="profile:write"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
        ]}
        bodyParams={[
          { name: 'imageUrl', type: 'string', required: false, description: 'URL gambar (gunakan salah satu)' },
          { name: 'imageBase64', type: 'string', required: false, description: 'Base64 gambar (gunakan salah satu)' },
        ]}
        curlExample={`curl -X PATCH "${baseUrl}/api/sessions/{sessionId}/profile/picture" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "imageUrl": "https://example.com/my-photo.jpg"
  }'`}
        responseExample={`{
  "success": true,
  "message": "Profile picture updated successfully"
}`}
      />

      <EndpointCard
        method="DELETE"
        path="/api/sessions/{sessionId}/profile/picture"
        title="Remove Profile Picture"
        description="Hapus foto profil WhatsApp"
        auth="Both"
        scope="profile:write"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
        ]}
        curlExample={`curl -X DELETE "${baseUrl}/api/sessions/{sessionId}/profile/picture" \\
  -H "X-API-Key: YOUR_API_KEY"`}
        responseExample={`{
  "success": true,
  "message": "Profile picture removed successfully"
}`}
      />

      <EndpointCard
        method="GET"
        path="/api/sessions/{sessionId}/profile/business"
        title="Get Business Profile"
        description="Ambil profil bisnis WhatsApp (khusus akun Business)"
        auth="Both"
        scope="profile:read"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
        ]}
        curlExample={`curl -X GET "${baseUrl}/api/sessions/{sessionId}/profile/business" \\
  -H "X-API-Key: YOUR_API_KEY"`}
        responseExample={`{
  "success": true,
  "data": {
    "address": "Jl. Contoh No. 123",
    "description": "Toko online terpercaya",
    "email": "contact@business.com",
    "website": ["https://mybusiness.com"],
    "category": "Retail",
    "businessHours": {
      "monday": "09:00-17:00",
      "tuesday": "09:00-17:00"
    }
  }
}`}
      />
    </div>
  )
}
