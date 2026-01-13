import { EndpointCard } from '../components'

interface AuthSectionProps {
  baseUrl: string
}

export function AuthSection({ baseUrl }: AuthSectionProps) {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Authentication API</h2>
        <p className="text-muted-foreground mt-1">
          Endpoint untuk registrasi, login, dan manajemen user
        </p>
      </div>

      <EndpointCard
        method="POST"
        path="/api/auth/register"
        title="Register User"
        description="Daftar user baru ke sistem"
        auth="JWT"
        bodyParams={[
          { name: 'email', type: 'string', required: true, description: 'Email user (harus valid dan unik)' },
          { name: 'password', type: 'string', required: true, description: 'Password minimal 8 karakter' },
          { name: 'name', type: 'string', required: true, description: 'Nama lengkap (2-100 karakter)' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/auth/register" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'`}
        responseExample={`{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "clxxx...",
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2026-01-14T10:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}`}
      />

      <EndpointCard
        method="POST"
        path="/api/auth/login"
        title="Login User"
        description="Login dengan email dan password"
        auth="JWT"
        bodyParams={[
          { name: 'email', type: 'string', required: true, description: 'Email user' },
          { name: 'password', type: 'string', required: true, description: 'Password user' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/auth/login" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'`}
        responseExample={`{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "clxxx...",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}`}
      />

      <EndpointCard
        method="POST"
        path="/api/auth/refresh"
        title="Refresh Token"
        description="Refresh access token menggunakan refresh token"
        auth="JWT"
        bodyParams={[
          { name: 'refreshToken', type: 'string', required: true, description: 'Refresh token dari login' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/auth/refresh" \\
  -H "Content-Type: application/json" \\
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }'`}
        responseExample={`{
  "success": true,
  "message": "Token refreshed",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}`}
      />

      <EndpointCard
        method="POST"
        path="/api/auth/logout"
        title="Logout"
        description="Logout user dan revoke refresh token"
        auth="JWT"
        bodyParams={[
          { name: 'refreshToken', type: 'string', required: false, description: 'Refresh token yang akan direvoke' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/auth/logout" \\
  -H "Content-Type: application/json" \\
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }'`}
        responseExample={`{
  "success": true,
  "message": "Logged out successfully"
}`}
      />

      <EndpointCard
        method="POST"
        path="/api/auth/logout-all"
        title="Logout All Devices"
        description="Logout dari semua device (revoke semua refresh token)"
        auth="JWT"
        curlExample={`curl -X POST "${baseUrl}/api/auth/logout-all" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"`}
        responseExample={`{
  "success": true,
  "message": "Logged out from all devices"
}`}
      />

      <EndpointCard
        method="GET"
        path="/api/auth/profile"
        title="Get Profile"
        description="Ambil data profil user yang sedang login"
        auth="JWT"
        curlExample={`curl -X GET "${baseUrl}/api/auth/profile" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"`}
        responseExample={`{
  "success": true,
  "data": {
    "id": "clxxx...",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar": null,
    "createdAt": "2026-01-14T10:00:00.000Z",
    "updatedAt": "2026-01-14T10:00:00.000Z"
  }
}`}
      />

      <EndpointCard
        method="PATCH"
        path="/api/auth/profile"
        title="Update Profile"
        description="Update data profil user"
        auth="JWT"
        bodyParams={[
          { name: 'name', type: 'string', required: false, description: 'Nama baru (2-100 karakter)' },
          { name: 'avatar', type: 'string', required: false, description: 'URL avatar baru' },
        ]}
        curlExample={`curl -X PATCH "${baseUrl}/api/auth/profile" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -d '{
    "name": "John Updated"
  }'`}
        responseExample={`{
  "success": true,
  "message": "Profile updated",
  "data": {
    "id": "clxxx...",
    "email": "user@example.com",
    "name": "John Updated"
  }
}`}
      />

      <EndpointCard
        method="POST"
        path="/api/auth/change-password"
        title="Change Password"
        description="Ganti password user"
        auth="JWT"
        bodyParams={[
          { name: 'currentPassword', type: 'string', required: true, description: 'Password saat ini' },
          { name: 'newPassword', type: 'string', required: true, description: 'Password baru (minimal 8 karakter)' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/auth/change-password" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -d '{
    "currentPassword": "password123",
    "newPassword": "newpassword123"
  }'`}
        responseExample={`{
  "success": true,
  "message": "Password changed successfully"
}`}
      />
    </div>
  )
}
