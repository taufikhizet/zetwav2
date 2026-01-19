import { useState } from 'react'
import { Check, Copy, Terminal, Info, Code2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export interface ApiParameter {
  name: string
  type: string
  required?: boolean
  description: string
}

interface ApiExampleProps {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url: string
  body?: Record<string, any>
  description?: string
  parameters?: ApiParameter[]
  responseExample?: Record<string, any> | any[] | null
  responseDescription?: string
}

export function ApiExample({ method, url, body, description, parameters, responseExample, responseDescription }: ApiExampleProps) {
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
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5" />
          <CardTitle>API Reference</CardTitle>
        </div>
        {description && <CardDescription className="font-mono text-xs mt-1">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* API Usage Section - Inside an inner card style */}
        <div className="space-y-3">
          <div className="text-sm font-medium flex items-center gap-2">
            <Code2 className="h-4 w-4 text-muted-foreground" />
            Request Example
          </div>
          <div className="rounded-lg border bg-muted/40 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-muted/60 border-b">
              <span className="text-xs font-mono text-muted-foreground">cURL</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
                {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
            <div className="p-4 overflow-x-auto">
              <pre className="text-xs font-mono text-foreground whitespace-pre">
                {getCurlCommand()}
              </pre>
            </div>
          </div>
        </div>

        {/* Response Example Section */}
        {(responseExample !== undefined || responseDescription) && (
          <div className="space-y-3">
            <div className="text-sm font-medium flex items-center gap-2">
              <Code2 className="h-4 w-4 text-muted-foreground" />
              Response Example
            </div>
            {responseDescription && (
              <p className="text-xs text-muted-foreground">{responseDescription}</p>
            )}
            {responseExample !== undefined && (
              <div className="rounded-lg border bg-muted/40 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-muted/60 border-b">
                  <span className="text-xs font-mono text-muted-foreground">JSON</span>
                </div>
                <div className="p-4 overflow-x-auto">
                  <pre className="text-xs font-mono text-foreground whitespace-pre">
                    {JSON.stringify(responseExample, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Parameters Section - Not in a card, just a table */}
        {parameters && parameters.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Parameters</h3>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Name</TableHead>
                    <TableHead className="w-[100px]">Type</TableHead>
                    <TableHead className="w-[80px]">Required</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parameters.map((param) => (
                    <TableRow key={param.name}>
                      <TableCell className="font-mono text-xs font-medium">{param.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{param.type}</TableCell>
                      <TableCell>
                        {param.required ? (
                          <Badge variant="default" className="text-[10px] h-5 px-1.5">Required</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] h-5 px-1.5">Optional</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{param.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
