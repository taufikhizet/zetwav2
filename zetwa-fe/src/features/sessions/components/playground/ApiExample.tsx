import { useState } from 'react'
import { Check, Copy, Terminal } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ApiExampleProps {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url: string
  body?: Record<string, any>
  description?: string
}

export function ApiExample({ method, url, body, description }: ApiExampleProps) {
  const [copied, setCopied] = useState(false)

  const getCurlCommand = () => {
    let cmd = `curl -X ${method} "${url}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY"`
    
    if (body) {
      cmd += ` \\
  -d '${JSON.stringify(body, null, 2)}'`
    }
    
    return cmd
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(getCurlCommand())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mt-6 rounded-lg border bg-muted/40 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-muted/60 border-b">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">API Usage</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
          {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
        </Button>
      </div>
      <div className="p-4 overflow-x-auto">
        {description && (
          <p className="text-xs text-muted-foreground mb-3 font-mono">{description}</p>
        )}
        <pre className="text-xs font-mono text-foreground whitespace-pre">
          {getCurlCommand()}
        </pre>
      </div>
    </div>
  )
}
