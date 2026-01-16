import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  ArrowLeft, 
  Loader2, 
  Settings2, 
  ChevronDown, 
  ChevronUp,
  Smartphone,
  Globe,
  Filter,
  Code,
  Zap,
  Info,
  CheckCircle2,
  Shield,
  Bug,
  MessageSquare,
  Users,
  Radio,
  Webhook,
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { FieldHelp } from '@/components/ui/field-help'
import { SESSION_HELP } from '@/lib/field-help-content'
import { sessionApi, type CreateSessionInput, type SessionConfig, type InlineWebhookConfig } from '@/api/session.api'
import { WebhookList } from '@/components/webhook'

export default function NewSessionPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  // Basic info
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  
  // Configuration
  const [showAdvanced, setShowAdvanced] = useState(false)
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
  const [showWebhooks, setShowWebhooks] = useState(false)

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
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-background to-muted/30">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)}
              className="shrink-0 hover:bg-background"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Create New Session</h1>
              <p className="text-muted-foreground text-sm md:text-base">
                Set up a new WhatsApp connection for your application
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
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
                <p className="text-xs text-muted-foreground">
                  Add a description to help you remember the purpose of this session.
                </p>
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
                      You'll see a QR code to scan with your phone.
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
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <Card className="border-2 shadow-sm overflow-hidden">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${showAdvanced ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        2
                      </div>
                      <div className="flex items-center gap-2">
                        <Settings2 className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <CardTitle className="text-xl">Advanced Configuration</CardTitle>
                          <CardDescription className="mt-1">
                            Optional settings for proxy, device info, and event filters
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Optional</Badge>
                      {showAdvanced ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="space-y-8 border-t pt-6">
                  
                  {/* Debug Mode Section */}
                  <div className="flex items-start justify-between gap-4 p-4 rounded-lg border bg-orange-50/50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900">
                    <div className="flex gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 shrink-0">
                        <Bug className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="debugMode" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                          Debug Mode
                          <Badge variant="outline" className="text-[10px] border-orange-300 text-orange-600 dark:border-orange-700 dark:text-orange-400">
                            Developer
                          </Badge>
                          <FieldHelp content={SESSION_HELP.debugMode} />
                        </Label>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Enable detailed logging for troubleshooting connection issues. 
                          Not recommended for production use.
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

                  {/* Device Identification Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0">
                        <Smartphone className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium">Device Identification</h3>
                        <p className="text-xs text-muted-foreground">
                          Customize how this session appears in WhatsApp's "Linked Devices" list on your phone
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid gap-4 sm:grid-cols-2 pl-[52px]">
                      <div className="space-y-2">
                        <Label htmlFor="deviceName" className="text-sm flex items-center gap-2">
                          Device Name
                          <FieldHelp content={SESSION_HELP.deviceName} />
                        </Label>
                        <Input
                          id="deviceName"
                          placeholder="e.g., Windows, macOS, Linux"
                          value={deviceName}
                          onChange={(e) => setDeviceName(e.target.value)}
                          disabled={createMutation.isPending}
                        />
                        <p className="text-xs text-muted-foreground">
                          The operating system name shown to WhatsApp
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="browserName" className="text-sm flex items-center gap-2">
                          Browser Name
                          <FieldHelp content={SESSION_HELP.browserName} />
                        </Label>
                        <Input
                          id="browserName"
                          placeholder="e.g., Chrome, Firefox, Safari"
                          value={browserName}
                          onChange={(e) => setBrowserName(e.target.value)}
                          disabled={createMutation.isPending}
                        />
                        <p className="text-xs text-muted-foreground">
                          The browser name shown to WhatsApp
                        </p>
                      </div>
                    </div>
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
                            <Shield className="h-4 w-4 text-muted-foreground" />
                            <FieldHelp content={SESSION_HELP.useProxy} />
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Route WhatsApp traffic through a proxy server for enhanced privacy or to bypass restrictions
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
                            <p className="text-xs text-muted-foreground">
                              Enter the full proxy URL including protocol and port
                            </p>
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="proxyUsername" className="text-sm flex items-center gap-2">
                                Username
                                <FieldHelp content={SESSION_HELP.proxyUsername} />
                              </Label>
                              <Input
                                id="proxyUsername"
                                placeholder="Optional"
                                value={proxyUsername}
                                onChange={(e) => setProxyUsername(e.target.value)}
                                disabled={createMutation.isPending}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="proxyPassword" className="text-sm flex items-center gap-2">
                                Password
                                <FieldHelp content={SESSION_HELP.proxyPassword} />
                              </Label>
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

                  {/* Event Filters Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 shrink-0">
                        <Filter className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium">Event Filters</h3>
                        <p className="text-xs text-muted-foreground">
                          Choose which types of messages and events to ignore. This reduces noise and improves performance.
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 pl-[52px]">
                      {/* Ignore Status */}
                      <div className={`flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors ${ignoreStatus ? 'bg-muted/50 border-primary/30' : 'bg-background'}`}>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400">
                            <Radio className="h-4 w-4" />
                          </div>
                          <div className="flex items-center gap-1">
                            <Label htmlFor="ignoreStatus" className="text-sm cursor-pointer">Status</Label>
                            <FieldHelp content={SESSION_HELP.ignoreStatus} />
                          </div>
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
                          <div className="flex items-center gap-1">
                            <Label htmlFor="ignoreGroups" className="text-sm cursor-pointer">Groups</Label>
                            <FieldHelp content={SESSION_HELP.ignoreGroups} />
                          </div>
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
                          <div className="flex items-center gap-1">
                            <Label htmlFor="ignoreChannels" className="text-sm cursor-pointer">Channels</Label>
                            <FieldHelp content={SESSION_HELP.ignoreChannels} />
                          </div>
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
                          <div className="flex items-center gap-1">
                            <Label htmlFor="ignoreBroadcast" className="text-sm cursor-pointer">Broadcast</Label>
                            <FieldHelp content={SESSION_HELP.ignoreBroadcast} />
                          </div>
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
                        <h3 className="font-medium">Engine Configuration</h3>
                        <p className="text-xs text-muted-foreground">
                          Advanced settings for the WhatsApp engine behavior
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid gap-3 sm:grid-cols-3 pl-[52px]">
                      {/* Store Enabled */}
                      <div className={`flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors ${nowebStoreEnabled ? 'bg-muted/50 border-primary/30' : 'bg-background'}`}>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400">
                            <Database className="h-4 w-4" />
                          </div>
                          <div className="flex items-center gap-1">
                            <Label htmlFor="nowebStoreEnabled" className="text-sm cursor-pointer">Store</Label>
                            <FieldHelp content={SESSION_HELP.nowebStoreEnabled} />
                          </div>
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
                          <div className="flex items-center gap-1">
                            <Label htmlFor="nowebFullSync" className="text-sm cursor-pointer">Full Sync</Label>
                            <FieldHelp content={SESSION_HELP.nowebFullSync} />
                          </div>
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
                          <div className="flex items-center gap-1">
                            <Label htmlFor="nowebMarkOnline" className="text-sm cursor-pointer">Online</Label>
                            <FieldHelp content={SESSION_HELP.nowebMarkOnline} />
                          </div>
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
                          Add custom key-value pairs that will be included in all webhook payloads
                        </p>
                      </div>
                    </div>
                    
                    <div className="pl-[52px] space-y-2">
                      <Textarea
                        id="metadata"
                        placeholder={`{
  "user_id": "123",
  "team": "support",
  "environment": "production"
}`}
                        value={metadataJson}
                        onChange={(e) => setMetadataJson(e.target.value)}
                        disabled={createMutation.isPending}
                        rows={4}
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        Must be valid JSON format. These values will be sent with every webhook event.
                      </p>
                    </div>
                  </div>

                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Step 3: Webhooks Configuration */}
          <Collapsible open={showWebhooks} onOpenChange={setShowWebhooks}>
            <Card className="border-2 shadow-sm overflow-hidden">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${showWebhooks ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        3
                      </div>
                      <div className="flex items-center gap-2">
                        <Webhook className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <CardTitle className="text-xl">Webhooks</CardTitle>
                          <CardDescription className="mt-1">
                            Configure webhooks to receive real-time event notifications
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {webhooks.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {webhooks.length} configured
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">Optional</Badge>
                      {showWebhooks ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="space-y-4 border-t pt-6">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium text-foreground mb-1">What are webhooks?</p>
                      <p>
                        Webhooks allow your application to receive HTTP POST notifications when events occur 
                        (e.g., new messages, status updates). Configure multiple webhooks with different 
                        event subscriptions, HMAC security, retry policies, and custom headers.
                      </p>
                    </div>
                  </div>
                  
                  <WebhookList
                    webhooks={webhooks}
                    onChange={setWebhooks}
                    disabled={createMutation.isPending}
                    maxWebhooks={10}
                  />
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-center gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => navigate('/dashboard/sessions')}
              disabled={createMutation.isPending}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              size="lg"
              disabled={createMutation.isPending || !name.trim() || !isNameValid || !isProxyValid}
              className="w-full sm:w-auto gap-2"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Session...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Create Session
                </>
              )}
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-center text-xs text-muted-foreground space-y-1 pt-4">
            <p>After creating the session, you'll need to scan a QR code with your WhatsApp mobile app.</p>
            <p>Or use phone number pairing as an alternative authentication method.</p>
          </div>

        </form>
      </div>
    </div>
  )
}
