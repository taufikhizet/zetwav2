import { Card, CardContent } from '@/components/ui/card'
import { EndpointCard } from '../components'

interface LabelsSectionProps {
  baseUrl: string
}

export function LabelsSection({ baseUrl }: LabelsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Labels API</h2>
        <p className="text-muted-foreground mt-1">
          Endpoint untuk mengelola label (khusus WhatsApp Business)
        </p>
      </div>

      {/* Labels Note */}
      <Card className="mb-6 border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2 text-yellow-800">⚠️ WhatsApp Business Only</h3>
          <p className="text-sm text-yellow-700">
            Fitur Labels hanya tersedia untuk akun WhatsApp Business. Akun WhatsApp biasa tidak dapat menggunakan fitur ini.
          </p>
        </CardContent>
      </Card>

      {/* Label Colors Reference */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-3">Warna Label</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {[
              { id: 0, color: 'bg-gray-500', name: 'Gray' },
              { id: 1, color: 'bg-green-500', name: 'Green' },
              { id: 2, color: 'bg-orange-500', name: 'Orange' },
              { id: 3, color: 'bg-blue-500', name: 'Blue' },
              { id: 4, color: 'bg-pink-500', name: 'Pink' },
            ].map((c) => (
              <div key={c.id} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${c.color}`} />
                <span className="text-sm">{c.id}: {c.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <EndpointCard
        method="GET"
        path="/api/sessions/{sessionId}/labels"
        title="List Labels"
        description="Ambil semua label"
        auth="Both"
        scope="labels:read"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
        ]}
        curlExample={`curl -X GET "${baseUrl}/api/sessions/{sessionId}/labels" \\
  -H "X-API-Key: YOUR_API_KEY"`}
        responseExample={`{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "New Customer",
      "color": 1,
      "count": 5
    },
    {
      "id": "2",
      "name": "VIP",
      "color": 3,
      "count": 10
    }
  ]
}`}
      />

      <EndpointCard
        method="POST"
        path="/api/sessions/{sessionId}/labels"
        title="Create Label"
        description="Buat label baru"
        auth="Both"
        scope="labels:write"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
        ]}
        bodyParams={[
          { name: 'name', type: 'string', required: true, description: 'Nama label (1-30 karakter)' },
          { name: 'color', type: 'number', required: false, description: 'ID warna (0-4), default: 0' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/sessions/{sessionId}/labels" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "name": "Priority Customer",
    "color": 2
  }'`}
        responseExample={`{
  "success": true,
  "message": "Label created successfully",
  "data": {
    "id": "3",
    "name": "Priority Customer",
    "color": 2
  }
}`}
      />

      <EndpointCard
        method="GET"
        path="/api/sessions/{sessionId}/labels/{labelId}"
        title="Get Label"
        description="Ambil detail label berdasarkan ID"
        auth="Both"
        scope="labels:read"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
          { name: 'labelId', type: 'string', required: true, description: 'ID label' },
        ]}
        curlExample={`curl -X GET "${baseUrl}/api/sessions/{sessionId}/labels/1" \\
  -H "X-API-Key: YOUR_API_KEY"`}
        responseExample={`{
  "success": true,
  "data": {
    "id": "1",
    "name": "New Customer",
    "color": 1
  }
}`}
      />

      <EndpointCard
        method="PATCH"
        path="/api/sessions/{sessionId}/labels/{labelId}"
        title="Update Label"
        description="Update nama atau warna label"
        auth="Both"
        scope="labels:write"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
          { name: 'labelId', type: 'string', required: true, description: 'ID label' },
        ]}
        bodyParams={[
          { name: 'name', type: 'string', required: false, description: 'Nama baru label' },
          { name: 'color', type: 'number', required: false, description: 'ID warna baru (0-4)' },
        ]}
        curlExample={`curl -X PATCH "${baseUrl}/api/sessions/{sessionId}/labels/1" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "name": "VIP Customer",
    "color": 4
  }'`}
        responseExample={`{
  "success": true,
  "message": "Label updated successfully",
  "data": {
    "id": "1",
    "name": "VIP Customer",
    "color": 4
  }
}`}
      />

      <EndpointCard
        method="DELETE"
        path="/api/sessions/{sessionId}/labels/{labelId}"
        title="Delete Label"
        description="Hapus label"
        auth="Both"
        scope="labels:write"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
          { name: 'labelId', type: 'string', required: true, description: 'ID label' },
        ]}
        curlExample={`curl -X DELETE "${baseUrl}/api/sessions/{sessionId}/labels/1" \\
  -H "X-API-Key: YOUR_API_KEY"`}
        responseExample={`{
  "success": true,
  "message": "Label deleted successfully"
}`}
      />

      <EndpointCard
        method="GET"
        path="/api/sessions/{sessionId}/labels/{labelId}/chats"
        title="Get Chats by Label"
        description="Ambil semua chat yang memiliki label tertentu"
        auth="Both"
        scope="labels:read"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
          { name: 'labelId', type: 'string', required: true, description: 'ID label' },
        ]}
        curlExample={`curl -X GET "${baseUrl}/api/sessions/{sessionId}/labels/1/chats" \\
  -H "X-API-Key: YOUR_API_KEY"`}
        responseExample={`{
  "success": true,
  "data": [
    {
      "id": "628123456789@c.us",
      "name": "John Doe",
      "isGroup": false
    },
    {
      "id": "628987654321@c.us",
      "name": "Jane Smith",
      "isGroup": false
    }
  ]
}`}
      />

      <EndpointCard
        method="POST"
        path="/api/sessions/{sessionId}/labels/assign"
        title="Assign Label to Chat"
        description="Berikan label ke chat tertentu"
        auth="Both"
        scope="labels:write"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
        ]}
        bodyParams={[
          { name: 'labelId', type: 'string', required: true, description: 'ID label' },
          { name: 'chatId', type: 'string', required: true, description: 'ID chat yang akan diberi label' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/sessions/{sessionId}/labels/assign" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "labelId": "1",
    "chatId": "628123456789@c.us"
  }'`}
        responseExample={`{
  "success": true,
  "message": "Label assigned to chat successfully"
}`}
      />

      <EndpointCard
        method="POST"
        path="/api/sessions/{sessionId}/labels/unassign"
        title="Remove Label from Chat"
        description="Hapus label dari chat tertentu"
        auth="Both"
        scope="labels:write"
        pathParams={[
          { name: 'sessionId', type: 'string', required: true, description: 'ID session WhatsApp' },
        ]}
        bodyParams={[
          { name: 'labelId', type: 'string', required: true, description: 'ID label' },
          { name: 'chatId', type: 'string', required: true, description: 'ID chat' },
        ]}
        curlExample={`curl -X POST "${baseUrl}/api/sessions/{sessionId}/labels/unassign" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "labelId": "1",
    "chatId": "628123456789@c.us"
  }'`}
        responseExample={`{
  "success": true,
  "message": "Label removed from chat successfully"
}`}
      />
    </div>
  )
}
