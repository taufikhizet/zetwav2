import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Loader2, 
  Smartphone,
  Globe,
  Filter,
  Code,
  Zap,
  Info,
  CheckCircle2,
  Bug,
  MessageSquare,
  Users,
  Radio,
  Tv,
  Database,
  Wifi,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { PasswordInput } from '@/components/ui/password-input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { FieldHelp } from '@/components/ui/field-help'
import { SESSION_HELP } from '@/lib/field-help-content'
import { sessionApi, type CreateSessionInput, type SessionConfig } from '@/features/sessions/api/session.api'
import { WebhookList } from '@/features/webhooks/components/WebhookList'
import type { InlineWebhookConfig } from '@/features/webhooks/types/webhook.types'

export default function NewSessionPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  // Basic info
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  
  // Configuration
  const [autoStart, setAutoStart] = useState(true)
  const [debugMode, setDebugMode] = useState(false)
  
  // Client config
  const [deviceName, setDeviceName] = useState('')
  const [browserName, setBrowserName] = useState('')
  
  // Proxy config
  const [useProxy, setUseProxy] = useState(false)
  const [proxyServer, setProxyServer] = useState('')
  const [proxyUsername, setProxyUsername] = useState('')
  const [proxyPassword, setProxyPassword] = useState('')
  
  // Ignore config
  const [ignoreStatus, setIgnoreStatus] = useState(false)
  const [ignoreGroups, setIgnoreGroups] = useState(false)
  const [ignoreChannels, setIgnoreChannels] = useState(false)
  const [ignoreBroadcast, setIgnoreBroadcast] = useState(false)
  
  // NOWEB engine config
  const [nowebStoreEnabled, setNowebStoreEnabled] = useState(true)
  const [nowebFullSync, setNowebFullSync] = useState(false)
  const [nowebMarkOnline, setNowebMarkOnline] = useState(true)
  
  // Metadata
  const [metadataJson, setMetadataJson] = useState('')
  
  // Webhooks
  const [webhooks, setWebhooks] = useState<InlineWebhookConfig[]>([])

  // Validation
  const isNameValid = /^[a-zA-Z0-9_-]+$/.test(name) || name === ''
  const isProxyValid = !useProxy || proxyServer.trim() !== ''

  const createMutation = useMutation({
    mutationFn: sessionApi.create,
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      toast.success('Session created successfully! 🎉')
      navigate(`/dashboard/sessions/${session.id}`)
    },
    onError: (error: unknown) => {
      // Extract error message from API response
      let errorMessage = 'Failed to create session'
      
      if (error && typeof error === 'object') {
        const axiosError = error as { response?: { data?: { error?: { message?: string; details?: Array<{ field: string; message: string }> } } } }
        const apiError = axiosError.response?.data?.error
        
        if (apiError) {
          if (apiError.details && Array.isArray(apiError.details) && apiError.details.length > 0) {
            // Show validation errors with field info
            const detail = apiError.details[0]
            errorMessage = `${detail.message}${detail.field ? ` (${detail.field})` : ''}`
          } else if (apiError.message) {
            errorMessage = apiError.message
          }
        } else if (error instanceof Error) {
          errorMessage = error.message
        }
      }
      
      toast.error(errorMessage)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Please enter a session name')
      return
    }
    
    if (!isNameValid) {
      toast.error('Session name can only contain letters, numbers, hyphens, and underscores')
      return
    }

    if (!isProxyValid) {
      toast.error('Please enter a proxy server address')
      return
    }
    
    // Build config object
    const config: SessionConfig = {}
    
    // Debug mode
    if (debugMode) {
      config.debug = true
    }
    
    // Client config
    if (deviceName || browserName) {
      config.client = {}
      if (deviceName) config.client.deviceName = deviceName
      if (browserName) config.client.browserName = browserName
    }
    
    // Proxy config
    if (useProxy && proxyServer) {
      config.proxy = {
        server: proxyServer,
        ...(proxyUsername && { username: proxyUsername }),
        ...(proxyPassword && { password: proxyPassword }),
      }
    }
    
    // Ignore config
    if (ignoreStatus || ignoreGroups || ignoreChannels || ignoreBroadcast) {
      config.ignore = {
        ...(ignoreStatus && { status: true }),
        ...(ignoreGroups && { groups: true }),
        ...(ignoreChannels && { channels: true }),
        ...(ignoreBroadcast && { broadcast: true }),
      }
    }
    
    // NOWEB engine config (only if non-default values)
    if (!nowebStoreEnabled || nowebFullSync || !nowebMarkOnline) {
      config.noweb = {
        store: {
          enabled: nowebStoreEnabled,
          ...(nowebFullSync && { fullSync: true }),
        },
        ...(nowebMarkOnline === false && { markOnline: false }),
      }
    }
    
    // Metadata
    if (metadataJson.trim()) {
      try {
        config.metadata = JSON.parse(metadataJson)
      } catch {
        toast.error('Invalid metadata JSON format')
        return
      }
    }
    
    // Webhooks - validate and filter
    const invalidWebhooks: number[] = []
    const validWebhooks = webhooks.filter((w, index) => {
      // Skip completely empty webhooks
      if (!w.url || w.url.trim() === '') {
        // Only flag as invalid if user started filling it but left URL empty
        if (w.events && w.events.length > 0 && !w.events.includes('*')) {
          invalidWebhooks.push(index + 1)
        }
        return false
      }
      // Validate URL format
      try {
        const url = new URL(w.url)
        if (!['http:', 'https:'].includes(url.protocol)) {
          invalidWebhooks.push(index + 1)
          return false
        }
      } catch {
        invalidWebhooks.push(index + 1)
        return false
      }
      // Must have events
      if (!w.events || w.events.length === 0) {
        invalidWebhooks.push(index + 1)
        return false
      }
      return true
    })
    
    // Show error if any webhooks are invalid
    if (invalidWebhooks.length > 0) {
      toast.error(`Invalid webhook URL at position ${invalidWebhooks.join(', ')}. Please enter a valid URL (http:// or https://).`)
      return
    }
    
    if (validWebhooks.length > 0) {
      config.webhooks = validWebhooks
    }
    
    const input: CreateSessionInput = {
      name: name.trim(),
      ...(description && { description: description.trim() }),
      ...(Object.keys(config).length > 0 && { config }),
      start: autoStart,
    }
    
    createMutation.mutate(input)
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Main Content */}
      <div className="w-full px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="grid gap-8 lg:grid-cols-2">
             {/* Left Column: Basic Info & Config */}
             <div className="space-y-8">
                {/* Step 1: Basic Information */}
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        1
                      </div>
                      <div>
                        <CardTitle className="text-xl">Session Details</CardTitle>
                        <CardDescription className="mt-1">
                          Give your session a unique name to identify it easily
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Session Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                        Session Name
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Required</Badge>
                        <FieldHelp content={SESSION_HELP.sessionName} />
                      </Label>
                      <Input
                        id="name"
                        placeholder="e.g., my-business-bot"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={createMutation.isPending}
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
                        Description
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Optional</Badge>
                        <FieldHelp content={SESSION_HELP.description} />
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="Describe what this session will be used for..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={createMutation.isPending}
                        rows={2}
                        className="resize-none"
                      />
                    </div>
                    
                    <Separator />

                    {/* Auto Start Toggle */}
                    <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-muted/50 border">
                      <div className="flex gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 shrink-0">
                          <Zap className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="autoStart" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                            Start Session Immediately
                            <FieldHelp content={SESSION_HELP.autoStart} />
                          </Label>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            When enabled, WhatsApp initialization will begin right after creation. 
                          </p>
                        </div>
                      </div>
                      <Switch
                        id="autoStart"
                        checked={autoStart}
                        onCheckedChange={setAutoStart}
                        disabled={createMutation.isPending}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Step 2: Advanced Configuration */}
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        2
                      </div>
                      <div>
                        <CardTitle className="text-xl">Advanced Config</CardTitle>
                        <CardDescription className="mt-1">
                          Proxy, device info, and event filters
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Debug Mode Section */}
                    <div className="flex items-start justify-between gap-4 p-4 rounded-lg border bg-orange-50/50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900">
                      <div className="flex gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 shrink-0">
                          <Bug className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="debugMode" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                            Debug Mode
                            <FieldHelp content={SESSION_HELP.debugMode} />
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Enable detailed logging for troubleshooting.
                          </p>
                        </div>
                      </div>
                      <Switch
                        id="debugMode"
                        checked={debugMode}
                        onCheckedChange={setDebugMode}
                        disabled={createMutation.isPending}
                      />
                    </div>

                    <Separator />

                    {/* Proxy Configuration Section */}
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 shrink-0">
                            <Globe className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-medium flex items-center gap-2">
                              Proxy Configuration
                              <FieldHelp content={SESSION_HELP.useProxy} />
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              Route traffic through a proxy
                            </p>
                          </div>
                        </div>
                        <Switch
                          id="useProxy"
                          checked={useProxy}
                          onCheckedChange={setUseProxy}
                          disabled={createMutation.isPending}
                        />
                      </div>
                      
                      {useProxy && (
                        <div className="space-y-4 pl-[52px] animate-in slide-in-from-top-2 duration-200">
                          <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="proxyServer" className="text-sm flex items-center gap-2">
                                Proxy Server URL
                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Required</Badge>
                                <FieldHelp content={SESSION_HELP.proxyServer} />
                              </Label>
                              <Input
                                id="proxyServer"
                                placeholder="http://proxy.example.com:8080"
                                value={proxyServer}
                                onChange={(e) => setProxyServer(e.target.value)}
                                disabled={createMutation.isPending}
                                className={!isProxyValid ? 'border-red-500' : ''}
                              />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label htmlFor="proxyUsername" className="text-sm">Username</Label>
                                <Input
                                  id="proxyUsername"
                                  placeholder="Optional"
                                  value={proxyUsername}
                                  onChange={(e) => setProxyUsername(e.target.value)}
                                  disabled={createMutation.isPending}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="proxyPassword" className="text-sm">Password</Label>
                                <PasswordInput
                                  id="proxyPassword"
                                  placeholder="Optional"
                                  value={proxyPassword}
                                  onChange={(e) => setProxyPassword(e.target.value)}
                                  disabled={createMutation.isPending}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator />
                    
                    {/* Device & Browser */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0">
                            <Smartphone className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-medium">Device Info</h3>
                            <p className="text-xs text-muted-foreground">Customize appearance in Linked Devices</p>
                          </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 pl-[52px]">
                          <div className="space-y-2">
                            <Label htmlFor="deviceName" className="text-sm">Device Name</Label>
                            <Input
                              id="deviceName"
                              placeholder="e.g., Linux"
                              value={deviceName}
                              onChange={(e) => setDeviceName(e.target.value)}
                              disabled={createMutation.isPending}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="browserName" className="text-sm">Browser Name</Label>
                            <Input
                              id="browserName"
                              placeholder="e.g., Chrome"
                              value={browserName}
                              onChange={(e) => setBrowserName(e.target.value)}
                              disabled={createMutation.isPending}
                            />
                          </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Event Filters Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 shrink-0">
                          <Filter className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-medium">Event Filters</h3>
                          <p className="text-xs text-muted-foreground">
                            Choose which types of messages and events to ignore.
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid gap-3 sm:grid-cols-2 pl-[52px]">
                        {/* Ignore Status */}
                        <div className={`flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors ${ignoreStatus ? 'bg-muted/50 border-primary/30' : 'bg-background'}`}>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400">
                              <Radio className="h-4 w-4" />
                            </div>
                            <Label htmlFor="ignoreStatus" className="text-sm cursor-pointer">Status</Label>
                          </div>
                          <Switch
                            id="ignoreStatus"
                            checked={ignoreStatus}
                            onCheckedChange={setIgnoreStatus}
                            disabled={createMutation.isPending}
                          />
                        </div>

                        {/* Ignore Groups */}
                        <div className={`flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors ${ignoreGroups ? 'bg-muted/50 border-primary/30' : 'bg-background'}`}>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                              <Users className="h-4 w-4" />
                            </div>
                            <Label htmlFor="ignoreGroups" className="text-sm cursor-pointer">Groups</Label>
                          </div>
                          <Switch
                            id="ignoreGroups"
                            checked={ignoreGroups}
                            onCheckedChange={setIgnoreGroups}
                            disabled={createMutation.isPending}
                          />
                        </div>

                        {/* Ignore Channels */}
                        <div className={`flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors ${ignoreChannels ? 'bg-muted/50 border-primary/30' : 'bg-background'}`}>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                              <Tv className="h-4 w-4" />
                            </div>
                            <Label htmlFor="ignoreChannels" className="text-sm cursor-pointer">Channels</Label>
                          </div>
                          <Switch
                            id="ignoreChannels"
                            checked={ignoreChannels}
                            onCheckedChange={setIgnoreChannels}
                            disabled={createMutation.isPending}
                          />
                        </div>

                        {/* Ignore Broadcast */}
                        <div className={`flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors ${ignoreBroadcast ? 'bg-muted/50 border-primary/30' : 'bg-background'}`}>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400">
                              <MessageSquare className="h-4 w-4" />
                            </div>
                            <Label htmlFor="ignoreBroadcast" className="text-sm cursor-pointer">Broadcast</Label>
                          </div>
                          <Switch
                            id="ignoreBroadcast"
                            checked={ignoreBroadcast}
                            onCheckedChange={setIgnoreBroadcast}
                            disabled={createMutation.isPending}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* NOWEB Engine Configuration */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 shrink-0">
                          <Database className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-medium">Engine Config</h3>
                          <p className="text-xs text-muted-foreground">
                            Advanced settings for WhatsApp engine
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid gap-3 sm:grid-cols-2 pl-[52px]">
                        {/* Store Enabled */}
                        <div className={`flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors ${nowebStoreEnabled ? 'bg-muted/50 border-primary/30' : 'bg-background'}`}>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400">
                              <Database className="h-4 w-4" />
                            </div>
                            <Label htmlFor="nowebStoreEnabled" className="text-sm cursor-pointer">Store</Label>
                          </div>
                          <Switch
                            id="nowebStoreEnabled"
                            checked={nowebStoreEnabled}
                            onCheckedChange={setNowebStoreEnabled}
                            disabled={createMutation.isPending}
                          />
                        </div>

                        {/* Full Sync */}
                        <div className={`flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors ${nowebFullSync ? 'bg-muted/50 border-primary/30' : 'bg-background'}`}>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                              <Loader2 className="h-4 w-4" />
                            </div>
                            <Label htmlFor="nowebFullSync" className="text-sm cursor-pointer">Full Sync</Label>
                          </div>
                          <Switch
                            id="nowebFullSync"
                            checked={nowebFullSync}
                            onCheckedChange={setNowebFullSync}
                            disabled={createMutation.isPending}
                          />
                        </div>

                        {/* Mark Online */}
                        <div className={`flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors ${nowebMarkOnline ? 'bg-muted/50 border-primary/30' : 'bg-background'}`}>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                              <Wifi className="h-4 w-4" />
                            </div>
                            <Label htmlFor="nowebMarkOnline" className="text-sm cursor-pointer">Online</Label>
                          </div>
                          <Switch
                            id="nowebMarkOnline"
                            checked={nowebMarkOnline}
                            onCheckedChange={setNowebMarkOnline}
                            disabled={createMutation.isPending}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Custom Metadata Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 shrink-0">
                          <Code className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-medium flex items-center gap-2">
                            Custom Metadata
                            <FieldHelp content={SESSION_HELP.metadata} />
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Add custom key-value pairs
                          </p>
                        </div>
                      </div>
                      
                      <div className="pl-[52px] space-y-2">
                        <Textarea
                          id="metadata"
                          placeholder={`{ "user_id": "123" }`}
                          value={metadataJson}
                          onChange={(e) => setMetadataJson(e.target.value)}
                          disabled={createMutation.isPending}
                          rows={3}
                          className="font-mono text-sm"
                        />
                      </div>
                    </div>

                  </CardContent>
                </Card>
             </div>

             {/* Right Column: Webhooks & Actions */}
             <div className="space-y-8">
                 {/* Webhook Configuration */}
                 <Card>
                   <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                         <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                            3
                         </div>
                         <div>
                            <CardTitle className="text-xl">Webhooks</CardTitle>
                            <CardDescription className="mt-1">
                               Configure where to receive real-time events
                            </CardDescription>
                         </div>
                      </div>
                   </CardHeader>
                   <CardContent>
                     <WebhookList 
                        webhooks={webhooks} 
                        onChange={setWebhooks} 
                        disabled={createMutation.isPending}
                     />
                  </CardContent>
                 </Card>

                 {/* Submit Actions */}
                 <Card className="bg-muted/30 border-dashed border-2">
                    <CardContent className="pt-6">
                       <div className="flex flex-col gap-3">
                          <Button
                             type="submit"
                             size="lg"
                             className="w-full font-semibold shadow-lg shadow-primary/20"
                             disabled={createMutation.isPending || !name.trim() || !isNameValid || !isProxyValid}
                          >
                             {createMutation.isPending ? (
                                <>
                                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                   Creating Session...
                                </>
                             ) : (
                                <>
                                   <CheckCircle2 className="mr-2 h-5 w-5" />
                                   Create Session
                                </>
                             )}
                          </Button>
                          <Button
                             type="button"
                             variant="outline"
                             size="lg"
                             onClick={() => navigate(-1)}
                             disabled={createMutation.isPending}
                             className="w-full"
                          >
                             Cancel
                          </Button>
                       </div>
                    </CardContent>
                 </Card>
             </div>
          </div>
        </form>
      </div>
    </div>
  )
}
