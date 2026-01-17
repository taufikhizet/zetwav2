import { Info, Zap } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { FieldHelp } from '@/components/ui/field-help'
import { SESSION_HELP } from '@/lib/field-help-content'

interface BasicInfoCardProps {
  name: string
  setName: (value: string) => void
  description: string
  setDescription: (value: string) => void
  autoStart: boolean
  setAutoStart: (value: boolean) => void
  isNameValid: boolean
  disabled: boolean
}

export function BasicInfoCard({
  name,
  setName,
  description,
  setDescription,
  autoStart,
  setAutoStart,
  isNameValid,
  disabled
}: BasicInfoCardProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
            1
          </div>
          <div>
            <CardTitle className="text-xl">Basic Information</CardTitle>
            <CardDescription className="mt-1">
              Configure essential session details
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Session Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
            {SESSION_HELP.sessionName.title}
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Required</Badge>
            <FieldHelp content={SESSION_HELP.sessionName} />
          </Label>
          <Input
            id="name"
            placeholder="e.g., my-business-bot"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={disabled}
            className={`h-11 text-base ${name && !isNameValid ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
          />
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              Use only letters, numbers, hyphens (-) and underscores (_). 
              Example: <code className="bg-muted px-1 py-0.5 rounded">support-bot</code>, <code className="bg-muted px-1 py-0.5 rounded">marketing_01</code>
            </span>
          </div>
          {name && !isNameValid && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <span>⚠️</span> Invalid characters detected. Only letters, numbers, hyphens, and underscores are allowed.
            </p>
          )}
        </div>
        
        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium flex items-center gap-2">
            {SESSION_HELP.description.title}
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Optional</Badge>
            <FieldHelp content={SESSION_HELP.description} />
          </Label>
          <Textarea
            id="description"
            placeholder="Describe what this session will be used for..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={disabled}
            rows={2}
            className="resize-none"
          />
        </div>
        
        <Separator />

        {/* Auto Start Toggle */}
        <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-muted/50 shadow-inner">
          <div className="flex gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 shrink-0">
              <Zap className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="autoStart" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                {SESSION_HELP.autoStart.title}
                <FieldHelp content={SESSION_HELP.autoStart} />
              </Label>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {SESSION_HELP.autoStart.description}
              </p>
            </div>
          </div>
          <Switch
            id="autoStart"
            checked={autoStart}
            onCheckedChange={setAutoStart}
            disabled={disabled}
          />
        </div>
      </CardContent>
    </Card>
  )
}
