import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CodeBlock } from './CodeBlock'

interface Parameter {
  name: string
  type: string
  required: boolean
  description: string
}

interface EndpointCardProps {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  path: string
  title: string
  description: string
  auth?: 'JWT' | 'API Key' | 'Both'
  pathParams?: Parameter[]
  queryParams?: Parameter[]
  bodyParams?: Parameter[]
  curlExample: string
  responseExample?: string
}

const methodColors: Record<string, string> = {
  GET: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  POST: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  PUT: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  PATCH: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

export function EndpointCard({
  method,
  path,
  title,
  description,
  auth = 'API Key',
  pathParams,
  queryParams,
  bodyParams,
  curlExample,
  responseExample,
}: EndpointCardProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <Badge className={`${methodColors[method]} font-mono`}>{method}</Badge>
          <code className="text-sm bg-muted px-2 py-1 rounded">{path}</code>
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Authentication */}
        <div>
          <h4 className="font-semibold text-sm mb-2">Autentikasi</h4>
          <Badge variant="outline">{auth === 'Both' ? 'JWT Token atau API Key' : auth === 'JWT' ? 'JWT Token' : 'API Key (X-API-Key header)'}</Badge>
        </div>

        {/* Path Parameters */}
        {pathParams && pathParams.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2">Path Parameters</h4>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2 font-medium">Parameter</th>
                    <th className="text-left p-2 font-medium">Type</th>
                    <th className="text-left p-2 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {pathParams.map((param) => (
                    <tr key={param.name} className="border-t">
                      <td className="p-2">
                        <code className="text-primary">{param.name}</code>
                        {param.required && <span className="text-red-500 ml-1">*</span>}
                      </td>
                      <td className="p-2 text-muted-foreground">{param.type}</td>
                      <td className="p-2">{param.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Query Parameters */}
        {queryParams && queryParams.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2">Query Parameters</h4>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2 font-medium">Parameter</th>
                    <th className="text-left p-2 font-medium">Type</th>
                    <th className="text-left p-2 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {queryParams.map((param) => (
                    <tr key={param.name} className="border-t">
                      <td className="p-2">
                        <code className="text-primary">{param.name}</code>
                        {param.required && <span className="text-red-500 ml-1">*</span>}
                      </td>
                      <td className="p-2 text-muted-foreground">{param.type}</td>
                      <td className="p-2">{param.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Body Parameters */}
        {bodyParams && bodyParams.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2">Request Body</h4>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2 font-medium">Parameter</th>
                    <th className="text-left p-2 font-medium">Type</th>
                    <th className="text-left p-2 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {bodyParams.map((param) => (
                    <tr key={param.name} className="border-t">
                      <td className="p-2">
                        <code className="text-primary">{param.name}</code>
                        {param.required && <span className="text-red-500 ml-1">*</span>}
                      </td>
                      <td className="p-2 text-muted-foreground">{param.type}</td>
                      <td className="p-2">{param.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* cURL Example */}
        <div>
          <h4 className="font-semibold text-sm mb-2">Contoh Request (cURL)</h4>
          <CodeBlock code={curlExample} language="bash" />
        </div>

        {/* Response Example */}
        {responseExample && (
          <div>
            <h4 className="font-semibold text-sm mb-2">Contoh Response</h4>
            <CodeBlock code={responseExample} language="json" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
