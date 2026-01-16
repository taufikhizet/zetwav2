import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ExternalLink, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface ApiGuideCardProps {
  baseUrl?: string
  className?: string
}

export function ApiGuideCard({ baseUrl = 'https://api.zetwa.com', className }: ApiGuideCardProps) {
  const [copied, setCopied] = useState(false)

  const exampleCode = `curl -X POST "${baseUrl}/api/sessions/{sessionId}/messages/send" \\
  -H "X-API-Key: your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{"to": "628123456789", "message": "Hello from Zetwa!"}'`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(exampleCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">API Integration</CardTitle>
            <CardDescription>Quick start guide for developers</CardDescription>
          </div>
          <Link to="/docs">
            <Button variant="outline" size="sm" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Full Docs
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Steps */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex gap-3">
            <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">1</span>
            </div>
            <div>
              <h4 className="font-medium text-sm">Create Session</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Connect WhatsApp by scanning QR
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">2</span>
            </div>
            <div>
              <h4 className="font-medium text-sm">Generate API Key</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Create key with proper scopes
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">3</span>
            </div>
            <div>
              <h4 className="font-medium text-sm">Start Building</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Send messages via REST API
              </p>
            </div>
          </div>
        </div>

        {/* Code Example */}
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Example: Send Message</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={copyToClipboard}
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <pre className="p-4 rounded-lg bg-muted text-xs overflow-x-auto font-mono">
            {exampleCode}
          </pre>
        </div>

        {/* Auth Info */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900">
          <div className="shrink-0 mt-0.5">
            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">i</span>
            </div>
          </div>
          <div className="text-sm">
            <p className="font-medium text-blue-900 dark:text-blue-100">Authentication</p>
            <p className="text-xs text-blue-800 dark:text-blue-200 mt-0.5">
              Use <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">X-API-Key</code> header
              or <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">Authorization: Bearer</code> token
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
