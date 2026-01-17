
/**
 * Session Settings Tab - Edit session configuration (name, description, client, proxy, ignore, metadata)
 */

import { useState, useEffect } from 'react'
import {
  Loader2,
  Save,
  Smartphone,
  Globe,
  Filter,
  Code,
  Bug,
  Info,
  Settings2,
  Database,
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Checkbox } from '@/components/ui/checkbox'
import { FieldHelp } from '@/components/ui/field-help'
import { SESSION_HELP } from '@/lib/field-help-content'

import type { Session, SessionConfig, UpdateSessionInput } from '@/features/sessions/api/session.api'

interface SessionSettingsTabProps {
  session: Session
  onUpdate: (data: UpdateSessionInput) => Promise<void>
  isUpdating: boolean
}

export function SessionSettingsTab({ session, onUpdate, isUpdating }: SessionSettingsTabProps) {
  // Basic info
  const [name, setName] = useState(session.name)
  const [description, setDescription] = useState(session.description || '')
  
  // Debug mode
  const [debugMode, setDebugMode] = useState(session.config?.debug || false)
  
  // Client config
  const [deviceName, setDeviceName] = useState(session.config?.client?.deviceName || '')
  const [browserName, setBrowserName] = useState(session.config?.client?.browserName || '')
  
  // Proxy config
  const [useProxy, setUseProxy] = useState(!!session.config?.proxy?.server)
  const [proxyServer, setProxyServer] = useState(session.config?.proxy?.server || '')
  const [proxyUsername, setProxyUsername] = useState(session.config?.proxy?.username || '')
  const [proxyPassword, setProxyPassword] = useState(session.config?.proxy?.password || '')
  
  // Ignore config
  const [ignoreStatus, setIgnoreStatus] = useState(session.config?.ignore?.status || false)
  const [ignoreGroups, setIgnoreGroups] = useState(session.config?.ignore?.groups || false)
  const [ignoreChannels, setIgnoreChannels] = useState(session.config?.ignore?.channels || false)
  const [ignoreBroadcast, setIgnoreBroadcast] = useState(session.config?.ignore?.broadcast || false)
  
  // NOWEB engine config
  const [nowebStoreEnabled, setNowebStoreEnabled] = useState(session.config?.noweb?.store?.enabled ?? false)
  const [nowebFullSync, setNowebFullSync] = useState(session.config?.noweb?.store?.fullSync || false)
  const [nowebMarkOnline, setNowebMarkOnline] = useState(session.config?.noweb?.markOnline ?? true)
  
  // Metadata
  const [metadataJson, setMetadataJson] = useState(
    session.config?.metadata ? JSON.stringify(session.config.metadata, null, 2) : ''
  )
  
  // Track if there are changes
  const [hasChanges, setHasChanges] = useState(false)
  
  // Advanced section open
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Reset state when session changes (e.g., after refetch)
  useEffect(() => {
    setName(session.name)
    setDescription(session.description || '')
    setDebugMode(session.config?.debug || false)
    setDeviceName(session.config?.client?.deviceName || '')
    setBrowserName(session.config?.client?.browserName || '')
    setUseProxy(!!session.config?.proxy?.server)
    setProxyServer(session.config?.proxy?.server || '')
    setProxyUsername(session.config?.proxy?.username || '')
    setProxyPassword(session.config?.proxy?.password || '')
    setIgnoreStatus(session.config?.ignore?.status || false)
    setIgnoreGroups(session.config?.ignore?.groups || false)
    setIgnoreChannels(session.config?.ignore?.channels || false)
    setIgnoreBroadcast(session.config?.ignore?.broadcast || false)
    setNowebStoreEnabled(session.config?.noweb?.store?.enabled ?? false)
    setNowebFullSync(session.config?.noweb?.store?.fullSync || false)
    setNowebMarkOnline(session.config?.noweb?.markOnline ?? true)
    setMetadataJson(session.config?.metadata ? JSON.stringify(session.config.metadata, null, 2) : '')
    setHasChanges(false)
  }, [session.id]) // Only reset when session ID changes

  // Validation
  const isNameValid = /^[a-zA-Z0-9_-]+$/.test(name) || name === ''
  const isProxyValid = !useProxy || proxyServer.trim() !== ''

  // Check for changes
  useEffect(() => {
    const originalConfig = session.config || {}
    const currentConfig = buildConfig()
    
    const nameChanged = name !== session.name
    const descChanged = description !== (session.description || '')
    const configChanged = JSON.stringify(currentConfig) !== JSON.stringify(originalConfig)
    
    setHasChanges(nameChanged || descChanged || configChanged)
  }, [name, description, debugMode, deviceName, browserName, useProxy, proxyServer, proxyUsername, proxyPassword, ignoreStatus, ignoreGroups, ignoreChannels, ignoreBroadcast, nowebStoreEnabled, nowebFullSync, nowebMarkOnline, metadataJson])

  const buildConfig = (): SessionConfig => {
    const config: SessionConfig = {}
    
    // Debug mode - always include to allow toggling off
    config.debug = debugMode
    
    // Client config - always include to allow clearing
    config.client = {
      ...(deviceName && { deviceName }),
      ...(browserName && { browserName }),
    }
    
    // Proxy config - explicitly set to allow clearing
    if (useProxy && proxyServer) {
      config.proxy = {
        server: proxyServer,
        ...(proxyUsername && { username: proxyUsername }),
        ...(proxyPassword && { password: proxyPassword }),
      }
    }
    // Note: If useProxy is false, proxy will be undefined (not sent), 
    // which backend interprets as "don't change". This is intentional.
    // To clear proxy, backend should handle empty proxy object.
    
    // Ignore config - always include to allow toggling
    config.ignore = {
      status: ignoreStatus,
      groups: ignoreGroups,
      channels: ignoreChannels,
      broadcast: ignoreBroadcast,
    }
    
    // NOWEB engine config - always include to allow changing
    config.noweb = {
      store: {
        enabled: nowebStoreEnabled,
        fullSync: nowebFullSync,
      },
      markOnline: nowebMarkOnline,
    }
    
    if (metadataJson.trim()) {
      try {
        config.metadata = JSON.parse(metadataJson)
      } catch {
        // Invalid JSON, skip
      }
    }
    
    return config
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Session name is required')
      return
    }
    if (!isNameValid) {
      toast.error('Invalid session name format')
      return
    }
    if (!isProxyValid) {
      toast.error('Proxy server is required when proxy is enabled')
      return
    }
    if (metadataJson.trim()) {
      try {
        JSON.parse(metadataJson)
      } catch {
        toast.error('Invalid metadata JSON format')
        return
      }
    }

    const config = buildConfig()
    
    await onUpdate({
      name: name.trim(),
      description: description.trim() || undefined,
      config: Object.keys(config).length > 0 ? config : undefined,
    })
  }

  return (
    <div className="space-y-6">
      {/* Basic Info Card */}
      <Card className="border-0 shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Basic Information
          </CardTitle>
          <CardDescription>
            Update session name and description
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              Session Name
              <FieldHelp content={SESSION_HELP.sessionName} />
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Required</Badge>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-session"
              className={name && !isNameValid ? 'border-red-500' : ''}
            />
            {name && !isNameValid && (
              <p className="text-xs text-red-500">Only letters, numbers, hyphens and underscores allowed</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-1">
              Description
              <FieldHelp content={SESSION_HELP.description} />
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this session for?"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Debug Mode */}
      <Card className="border-0 shadow-none bg-orange-50/30 dark:bg-orange-950/10">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 shrink-0">
                <Bug className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="debugMode" className="cursor-pointer flex items-center gap-2">
                  Debug Mode
                  <FieldHelp content={SESSION_HELP.debugMode} />
                  <Badge variant="outline" className="text-[10px] border-orange-300 text-orange-600">Developer</Badge>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Enable detailed logging for troubleshooting. Not recommended for production.
                </p>
              </div>
            </div>
            <Switch id="debugMode" checked={debugMode} onCheckedChange={setDebugMode} />
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <Card className="border-0 shadow-none">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Advanced Settings</CardTitle>
                <Badge variant="outline">Optional</Badge>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6 pt-0">
              {/* Device Identification */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium flex items-center gap-2">
                      Client Information
                      <FieldHelp content={SESSION_HELP.deviceName} />
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Customize how the session appears to WhatsApp
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 pl-[52px]">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      Device Name
                      <FieldHelp content={SESSION_HELP.deviceName} />
                    </Label>
                    <Input
                      placeholder="e.g., Zetwa Server 1"
                      value={deviceName}
                      onChange={(e) => setDeviceName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      Browser Name
                      <FieldHelp content={SESSION_HELP.browserName} />
                    </Label>
                    <Input
                      placeholder="e.g., Chrome (Windows)"
                      value={browserName}
                      onChange={(e) => setBrowserName(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Proxy Configuration */}
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium flex items-center gap-2">
                        Proxy Configuration
                        <FieldHelp content={SESSION_HELP.useProxy} />
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Route traffic through a proxy server
                      </p>
                    </div>
                  </div>
                  <Switch checked={useProxy} onCheckedChange={setUseProxy} />
                </div>
                
                {useProxy && (
                  <div className="space-y-4 pl-[52px] animate-in slide-in-from-top-2 duration-200">
                    <div className="p-4 rounded-lg bg-muted/30 space-y-4 shadow-inner">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          Proxy Server URL
                          <FieldHelp content={SESSION_HELP.proxyServer} />
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Required</Badge>
                        </Label>
                        <Input
                          placeholder="http://proxy.example.com:8080"
                          value={proxyServer}
                          onChange={(e) => setProxyServer(e.target.value)}
                          className={!isProxyValid ? 'border-red-500' : ''}
                        />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-1">
                            Username
                            <FieldHelp content={SESSION_HELP.proxyUsername} />
                          </Label>
                          <Input
                            placeholder="Optional"
                            value={proxyUsername}
                            onChange={(e) => setProxyUsername(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-1">
                            Password
                            <FieldHelp content={SESSION_HELP.proxyPassword} />
                          </Label>
                          <PasswordInput
                            placeholder="Optional"
                            value={proxyPassword}
                            onChange={(e) => setProxyPassword(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Event Filters */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                    <Filter className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium flex items-center gap-1">
                      Ignore Events
                      <FieldHelp content={SESSION_HELP.ignoreEvents} />
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Reduce server load by ignoring specific updates
                    </p>
                  </div>
                </div>
                
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 pl-[52px]">
                   <div className="flex items-center space-x-2 p-3 rounded-lg bg-muted/50 shadow-inner">
                    <Checkbox 
                      id="ignoreStatus" 
                      checked={ignoreStatus}
                      onCheckedChange={(c) => setIgnoreStatus(c as boolean)}
                    />
                    <div className="flex-1 flex flex-col">
                      <Label htmlFor="ignoreStatus" className="text-sm cursor-pointer flex items-center gap-2">
                        Status
                        <FieldHelp content={SESSION_HELP.ignoreStatus} />
                      </Label>
                      <span className="text-[10px] text-muted-foreground">Stories</span>
                    </div>
                  </div>
                  
                   <div className="flex items-center space-x-2 p-3 rounded-lg bg-muted/50 shadow-inner">
                    <Checkbox 
                      id="ignoreGroups" 
                      checked={ignoreGroups}
                      onCheckedChange={(c) => setIgnoreGroups(c as boolean)}
                    />
                    <div className="flex-1 flex flex-col">
                      <Label htmlFor="ignoreGroups" className="text-sm cursor-pointer flex items-center gap-2">
                        Groups
                        <FieldHelp content={SESSION_HELP.ignoreGroups} />
                      </Label>
                      <span className="text-[10px] text-muted-foreground">Group msgs</span>
                    </div>
                  </div>
                  
                   <div className="flex items-center space-x-2 p-3 rounded-lg bg-muted/50 shadow-inner">
                    <Checkbox 
                      id="ignoreChannels" 
                      checked={ignoreChannels}
                      onCheckedChange={(c) => setIgnoreChannels(c as boolean)}
                    />
                    <div className="flex-1 flex flex-col">
                      <Label htmlFor="ignoreChannels" className="text-sm cursor-pointer flex items-center gap-2">
                        Channels
                        <FieldHelp content={SESSION_HELP.ignoreChannels} />
                      </Label>
                      <span className="text-[10px] text-muted-foreground">WA Channels</span>
                    </div>
                  </div>
                  
                   <div className="flex items-center space-x-2 p-3 rounded-lg bg-muted/50 shadow-inner">
                    <Checkbox 
                      id="ignoreBroadcast" 
                      checked={ignoreBroadcast}
                      onCheckedChange={(c) => setIgnoreBroadcast(c as boolean)}
                    />
                    <div className="flex-1 flex flex-col">
                      <Label htmlFor="ignoreBroadcast" className="text-sm cursor-pointer flex items-center gap-2">
                        Broadcast
                        <FieldHelp content={SESSION_HELP.ignoreBroadcast} />
                      </Label>
                      <span className="text-[10px] text-muted-foreground">Broadcast</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* NOWEB Engine Configuration */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium flex items-center gap-1">
                      {SESSION_HELP.nowebEngine.title}
                      <Badge variant="outline" className="text-[10px] ml-1">Advanced</Badge>
                      <FieldHelp content={SESSION_HELP.nowebEngine} />
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {SESSION_HELP.nowebEngine.description}
                    </p>
                  </div>
                </div>
                
                <div className="pl-[52px] space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 shadow-inner">
                    <div className="space-y-0.5">
                      <Label htmlFor="nowebStoreEnabled" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                        Enable Store
                        <FieldHelp content={SESSION_HELP.nowebStoreEnabled} />
                      </Label>
                      <p className="text-xs text-muted-foreground">{SESSION_HELP.nowebStoreEnabled.description}</p>
                    </div>
                    <Switch id="nowebStoreEnabled" checked={nowebStoreEnabled} onCheckedChange={setNowebStoreEnabled} />
                  </div>

                  {nowebStoreEnabled && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 shadow-inner">
                      <div className="space-y-0.5">
                        <Label htmlFor="nowebFullSync" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                          Full Sync
                          <FieldHelp content={SESSION_HELP.nowebFullSync} />
                        </Label>
                        <p className="text-xs text-muted-foreground">{SESSION_HELP.nowebFullSync.description}</p>
                      </div>
                      <Switch id="nowebFullSync" checked={nowebFullSync} onCheckedChange={setNowebFullSync} />
                    </div>
                  )}

                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 shadow-inner">
                    <div className="space-y-0.5">
                      <Label htmlFor="nowebMarkOnline" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                        Mark Online
                        <FieldHelp content={SESSION_HELP.nowebMarkOnline} />
                      </Label>
                      <p className="text-xs text-muted-foreground">{SESSION_HELP.nowebMarkOnline.description}</p>
                    </div>
                    <Switch id="nowebMarkOnline" checked={nowebMarkOnline} onCheckedChange={setNowebMarkOnline} />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Custom Metadata */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                    <Code className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium flex items-center gap-1">
                      Custom Metadata
                      <FieldHelp content={SESSION_HELP.metadata} />
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Key-value pairs included in webhook payloads
                    </p>
                  </div>
                </div>
                
                <div className="pl-[52px] space-y-2">
                  <Textarea
                    placeholder='{"customId": "123", "group": "sales"}'
                    value={metadataJson}
                    onChange={(e) => setMetadataJson(e.target.value)}
                    rows={4}
                    className="font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Must be valid JSON format
                  </p>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isUpdating || !hasChanges}>
          {isUpdating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  )
}
