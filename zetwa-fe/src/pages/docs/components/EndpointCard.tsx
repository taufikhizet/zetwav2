import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
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
  scope?: string
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

const methodBorderColors: Record<string, string> = {
  GET: 'border-l-green-500',
  POST: 'border-l-blue-500',
  PUT: 'border-l-amber-500',
  PATCH: 'border-l-orange-500',
  DELETE: 'border-l-red-500',
}

export function EndpointCard({
  method,
  path,
  title,
  description,
  auth = 'API Key',
  scope,
  pathParams,
  queryParams,
  bodyParams,
  curlExample,
  responseExample,
}: EndpointCardProps) {
  // Generate unique ID for accordion
  const accordionId = `${method}-${path}`.replace(/[^a-zA-Z0-9]/g, '-')

  return (
    <Accordion type="single" collapsible className="mb-3">
      <AccordionItem 
        value={accordionId} 
        className={`border rounded-lg overflow-hidden border-l-4 ${methodBorderColors[method]}`}
      >
        <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 [&[data-state=open]]:bg-muted/30">
          <div className="flex items-center gap-3 text-left flex-1 min-w-0">
            <Badge className={`${methodColors[method]} font-mono shrink-0 text-xs`}>
              {method}
            </Badge>
            <code className="text-xs md:text-sm bg-muted px-2 py-0.5 rounded truncate max-w-[200px] md:max-w-none">
              {path}
            </code>
            <span className="hidden sm:inline text-sm text-muted-foreground">—</span>
            <span className="hidden sm:inline text-sm font-medium truncate">{title}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          {/* Title and Description (visible on mobile since hidden in header) */}
          <div className="sm:hidden mb-4 pt-2">
            <h4 className="font-semibold">{title}</h4>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          
          {/* Description (desktop) */}
          <p className="hidden sm:block text-sm text-muted-foreground mb-4 pt-2">{description}</p>

          <div className="space-y-4">
            {/* Authentication & Scope */}
            <div className="flex flex-wrap gap-4">
              <div>
                <h4 className="font-semibold text-sm mb-2">Autentikasi</h4>
                <Badge variant="outline" className="text-xs">
                  {auth === 'Both' ? 'JWT Token atau API Key' : auth === 'JWT' ? 'JWT Token' : 'API Key (X-API-Key header)'}
                </Badge>
              </div>
              {scope && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Required Scope</h4>
                  <Badge variant="secondary" className="text-xs font-mono">
                    {scope}
                  </Badge>
                </div>
              )}
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
                        <th className="text-left p-2 font-medium hidden sm:table-cell">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pathParams.map((param) => (
                        <tr key={param.name} className="border-t">
                          <td className="p-2">
                            <code className="text-primary text-xs">{param.name}</code>
                            {param.required && <span className="text-red-500 ml-1">*</span>}
                          </td>
                          <td className="p-2 text-muted-foreground text-xs">{param.type}</td>
                          <td className="p-2 text-xs hidden sm:table-cell">{param.description}</td>
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
                        <th className="text-left p-2 font-medium hidden sm:table-cell">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {queryParams.map((param) => (
                        <tr key={param.name} className="border-t">
                          <td className="p-2">
                            <code className="text-primary text-xs">{param.name}</code>
                            {param.required && <span className="text-red-500 ml-1">*</span>}
                          </td>
                          <td className="p-2 text-muted-foreground text-xs">{param.type}</td>
                          <td className="p-2 text-xs hidden sm:table-cell">{param.description}</td>
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
                        <th className="text-left p-2 font-medium hidden sm:table-cell">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bodyParams.map((param) => (
                        <tr key={param.name} className="border-t">
                          <td className="p-2">
                            <code className="text-primary text-xs">{param.name}</code>
                            {param.required && <span className="text-red-500 ml-1">*</span>}
                          </td>
                          <td className="p-2 text-muted-foreground text-xs">{param.type}</td>
                          <td className="p-2 text-xs hidden sm:table-cell">{param.description}</td>
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
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
