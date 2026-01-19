import { Code2 } from 'lucide-react'

interface ResponseDisplayProps {
  data: any
  title?: string
}

export function ResponseDisplay({ data, title = "Response" }: ResponseDisplayProps) {
  if (!data) return null

  return (
    <div className="rounded-lg border bg-muted/50 mt-4">
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/60">
        <Code2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
      </div>
      <div className="p-4 overflow-auto max-h-[300px]">
        <pre className="text-xs font-mono whitespace-pre-wrap">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  )
}
