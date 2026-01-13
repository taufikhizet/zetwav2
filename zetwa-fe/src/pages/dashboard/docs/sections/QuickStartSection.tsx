import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Book, Smartphone, Webhook, Shield, Key } from 'lucide-react'
import { CodeBlock } from '../components'

interface QuickStartProps {
  baseUrl: string
}

export function QuickStartSection({ baseUrl }: QuickStartProps) {
  return (
    <div className="space-y-6">
      {/* Introduction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Book className="h-5 w-5" />
            Pengenalan Zetwa API
          </CardTitle>
          <CardDescription>
            WhatsApp API Gateway untuk mengirim dan menerima pesan WhatsApp melalui REST API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Zetwa adalah WhatsApp API Gateway yang memungkinkan Anda mengintegrasikan WhatsApp ke aplikasi Anda.
            Dengan Zetwa, Anda dapat:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>Mengirim pesan teks, gambar, dokumen, dan media lainnya</li>
            <li>Menerima notifikasi pesan masuk melalui webhook</li>
            <li>Mengelola banyak akun WhatsApp dalam satu dashboard</li>
            <li>Mengakses kontak dan riwayat chat</li>
          </ul>
        </CardContent>
      </Card>

      {/* Features */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <Smartphone className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold">Multi-Session</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Hubungkan banyak akun WhatsApp dalam satu dashboard
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Webhook className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold">Webhooks</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Terima notifikasi real-time untuk pesan masuk dan event lainnya
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Shield className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold">Secure</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Autentikasi API key dengan permission granular
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Start Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Start</CardTitle>
          <CardDescription>Mulai menggunakan Zetwa API dalam 3 langkah</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                1
              </div>
              <div>
                <h4 className="font-semibold">Buat API Key</h4>
                <p className="text-sm text-muted-foreground">
                  Buka menu API Keys dan buat key baru dengan permission yang diperlukan.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                2
              </div>
              <div>
                <h4 className="font-semibold">Buat Session WhatsApp</h4>
                <p className="text-sm text-muted-foreground">
                  Buat session baru dan scan QR code dengan WhatsApp di ponsel Anda.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                3
              </div>
              <div>
                <h4 className="font-semibold">Kirim Pesan</h4>
                <p className="text-sm text-muted-foreground">
                  Gunakan API untuk mengirim pesan!
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Contoh: Kirim Pesan Pertama</h4>
            <CodeBlock
              code={`curl -X POST "${baseUrl}/api/sessions/{sessionId}/messages/send" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "to": "628123456789",
    "message": "Hello from Zetwa!"
  }'`}
            />
          </div>
        </CardContent>
      </Card>

      {/* Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Autentikasi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Zetwa mendukung dua metode autentikasi:
          </p>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">1. API Key (Untuk akses API)</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Sertakan API key di header <code className="bg-muted px-1 rounded">X-API-Key</code>:
              </p>
              <CodeBlock code={`X-API-Key: zetwa_xxxxxxxxxxxxxxxxxxxx`} />
            </div>

            <div>
              <h4 className="font-semibold mb-2">2. JWT Token (Untuk dashboard)</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Sertakan access token di header <code className="bg-muted px-1 rounded">Authorization</code>:
              </p>
              <CodeBlock code={`Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`} />
            </div>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>⚠️ Penting:</strong> Jangan pernah expose API key di client-side code. 
              Selalu panggil API dari backend server Anda.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Base URL */}
      <Card>
        <CardHeader>
          <CardTitle>Base URL</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Semua API request harus dikirim ke base URL berikut:
          </p>
          <CodeBlock code={baseUrl} />
          
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Response Format</h4>
            <p className="text-sm text-muted-foreground">
              Semua response API menggunakan format JSON dengan struktur:
            </p>
            <CodeBlock 
              code={`{
  "success": true,
  "message": "Optional message",
  "data": { ... }
}`} 
              language="json" 
            />
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Error Response</h4>
            <CodeBlock 
              code={`{
  "success": false,
  "message": "Error message",
  "error": {
    "code": "ERROR_CODE",
    "details": { ... }
  }
}`} 
              language="json" 
            />
          </div>
        </CardContent>
      </Card>

      {/* Status Codes */}
      <Card>
        <CardHeader>
          <CardTitle>HTTP Status Codes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 font-medium">Code</th>
                  <th className="text-left p-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-3"><Badge variant="outline" className="bg-green-50">200</Badge></td>
                  <td className="p-3">Request berhasil</td>
                </tr>
                <tr className="border-t">
                  <td className="p-3"><Badge variant="outline" className="bg-green-50">201</Badge></td>
                  <td className="p-3">Resource berhasil dibuat</td>
                </tr>
                <tr className="border-t">
                  <td className="p-3"><Badge variant="outline" className="bg-yellow-50">400</Badge></td>
                  <td className="p-3">Bad Request - Request tidak valid</td>
                </tr>
                <tr className="border-t">
                  <td className="p-3"><Badge variant="outline" className="bg-yellow-50">401</Badge></td>
                  <td className="p-3">Unauthorized - Autentikasi diperlukan</td>
                </tr>
                <tr className="border-t">
                  <td className="p-3"><Badge variant="outline" className="bg-yellow-50">403</Badge></td>
                  <td className="p-3">Forbidden - Tidak memiliki akses</td>
                </tr>
                <tr className="border-t">
                  <td className="p-3"><Badge variant="outline" className="bg-yellow-50">404</Badge></td>
                  <td className="p-3">Not Found - Resource tidak ditemukan</td>
                </tr>
                <tr className="border-t">
                  <td className="p-3"><Badge variant="outline" className="bg-red-50">429</Badge></td>
                  <td className="p-3">Too Many Requests - Rate limit exceeded</td>
                </tr>
                <tr className="border-t">
                  <td className="p-3"><Badge variant="outline" className="bg-red-50">500</Badge></td>
                  <td className="p-3">Internal Server Error</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
