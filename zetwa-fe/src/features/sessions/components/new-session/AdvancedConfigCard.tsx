
import { 
  Bug, 
  Globe, 
  Smartphone, 
  Filter, 
  Database, 
  Code 
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { PasswordInput } from '@/components/ui/password-input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { FieldHelp } from '@/components/ui/field-help'
import { SESSION_HELP } from '@/lib/field-help-content'

interface AdvancedConfigCardProps {
  debugMode: boolean
  setDebugMode: (val: boolean) => void
  
  useProxy: boolean
  setUseProxy: (val: boolean) => void
  proxyServer: string
  setProxyServer: (val: string) => void
  proxyUsername: string
  setProxyUsername: (val: string) => void
  proxyPassword: string
  setProxyPassword: (val: string) => void
  isProxyValid: boolean

  deviceName: string
  setDeviceName: (val: string) => void
  browserName: string
  setBrowserName: (val: string) => void

  ignoreStatus: boolean
  setIgnoreStatus: (val: boolean) => void
  ignoreGroups: boolean
  setIgnoreGroups: (val: boolean) => void
  ignoreChannels: boolean
  setIgnoreChannels: (val: boolean) => void
  ignoreBroadcast: boolean
  setIgnoreBroadcast: (val: boolean) => void

  nowebStoreEnabled: boolean
  setNowebStoreEnabled: (val: boolean) => void
  nowebFullSync: boolean
  setNowebFullSync: (val: boolean) => void
  nowebMarkOnline: boolean
  setNowebMarkOnline: (val: boolean) => void

  metadataJson: string
  setMetadataJson: (val: string) => void

  disabled: boolean
}

export function AdvancedConfigCard({
  debugMode, setDebugMode,
  useProxy, setUseProxy, proxyServer, setProxyServer, proxyUsername, setProxyUsername, proxyPassword, setProxyPassword, isProxyValid,
  deviceName, setDeviceName, browserName, setBrowserName,
  ignoreStatus, setIgnoreStatus, ignoreGroups, setIgnoreGroups, ignoreChannels, setIgnoreChannels, ignoreBroadcast, setIgnoreBroadcast,
  nowebStoreEnabled, setNowebStoreEnabled, nowebFullSync, setNowebFullSync, nowebMarkOnline, setNowebMarkOnline,
  metadataJson, setMetadataJson,
  disabled
}: AdvancedConfigCardProps) {
  return (
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
                {SESSION_HELP.debugMode.title}
                <FieldHelp content={SESSION_HELP.debugMode} />
              </Label>
              <p className="text-xs text-muted-foreground">
                {SESSION_HELP.debugMode.description}
              </p>
            </div>
          </div>
          <Switch
            id="debugMode"
            checked={debugMode}
            onCheckedChange={setDebugMode}
            disabled={disabled}
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
                  {SESSION_HELP.useProxy.title}
                  <FieldHelp content={SESSION_HELP.useProxy} />
                </h3>
                <p className="text-xs text-muted-foreground">
                  {SESSION_HELP.useProxy.description}
                </p>
              </div>
            </div>
            <Switch
              id="useProxy"
              checked={useProxy}
              onCheckedChange={setUseProxy}
              disabled={disabled}
            />
          </div>
          
          {useProxy && (
            <div className="space-y-4 pl-[52px] animate-in slide-in-from-top-2 duration-200">
              <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="proxyServer" className="text-sm flex items-center gap-2">
                    {SESSION_HELP.proxyServer.title}
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Required</Badge>
                    <FieldHelp content={SESSION_HELP.proxyServer} />
                  </Label>
                  <Input
                    id="proxyServer"
                    placeholder="http://proxy.example.com:8080"
                    value={proxyServer}
                    onChange={(e) => setProxyServer(e.target.value)}
                    disabled={disabled}
                    className={!isProxyValid ? 'border-red-500' : ''}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="proxyUsername" className="text-sm flex items-center gap-1">
                      {SESSION_HELP.proxyUsername.title}
                      <FieldHelp content={SESSION_HELP.proxyUsername} />
                    </Label>
                    <Input
                      id="proxyUsername"
                      placeholder="Optional"
                      value={proxyUsername}
                      onChange={(e) => setProxyUsername(e.target.value)}
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="proxyPassword" className="text-sm flex items-center gap-1">
                      {SESSION_HELP.proxyPassword.title}
                      <FieldHelp content={SESSION_HELP.proxyPassword} />
                    </Label>
                    <PasswordInput
                      id="proxyPassword"
                      placeholder="Optional"
                      value={proxyPassword}
                      onChange={(e) => setProxyPassword(e.target.value)}
                      disabled={disabled}
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
              <h3 className="font-medium flex items-center gap-2">
                Client Information
                <FieldHelp content={SESSION_HELP.deviceName} />
              </h3>
              <p className="text-xs text-muted-foreground">
                Customize how the session appears to WhatsApp
              </p>
            </div>
          </div>
          
          <div className="pl-[52px] grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="deviceName" className="text-sm flex items-center gap-2">
                {SESSION_HELP.deviceName.title}
                <FieldHelp content={SESSION_HELP.deviceName} />
              </Label>
              <Input
                id="deviceName"
                placeholder="e.g., Zetwa Server 1"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="browserName" className="text-sm flex items-center gap-2">
                {SESSION_HELP.browserName.title}
                <FieldHelp content={SESSION_HELP.browserName} />
              </Label>
              <Input
                id="browserName"
                placeholder="e.g., Chrome (Windows)"
                value={browserName}
                onChange={(e) => setBrowserName(e.target.value)}
                disabled={disabled}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Ignore Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 shrink-0">
              <Filter className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium flex items-center gap-2">
                {SESSION_HELP.ignoreEvents.title}
                <FieldHelp content={SESSION_HELP.ignoreEvents} />
              </h3>
              <p className="text-xs text-muted-foreground">
                {SESSION_HELP.ignoreEvents.description}
              </p>
            </div>
          </div>

          <div className="pl-[52px] grid gap-4 sm:grid-cols-2">
            <div className="flex items-center space-x-2 p-3 rounded-lg bg-muted/50 shadow-inner">
              <Checkbox 
                id="ignoreStatus" 
                checked={ignoreStatus}
                onCheckedChange={(c) => setIgnoreStatus(c as boolean)}
                disabled={disabled}
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
                disabled={disabled}
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
                disabled={disabled}
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
                disabled={disabled}
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

        {/* NOWEB Engine */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shrink-0">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium flex items-center gap-2">
                {SESSION_HELP.nowebEngine.title}
                <Badge variant="outline" className="text-[10px]">Advanced</Badge>
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
                <Label htmlFor="nowebStore" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                  Enable Store
                  <FieldHelp content={SESSION_HELP.nowebStoreEnabled} />
                </Label>
                <p className="text-xs text-muted-foreground">{SESSION_HELP.nowebStoreEnabled.description}</p>
              </div>
              <Switch
                id="nowebStore"
                checked={nowebStoreEnabled}
                onCheckedChange={setNowebStoreEnabled}
                disabled={disabled}
              />
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
                <Switch
                  id="nowebFullSync"
                  checked={nowebFullSync}
                  onCheckedChange={setNowebFullSync}
                  disabled={disabled}
                />
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
              <Switch
                id="nowebMarkOnline"
                checked={nowebMarkOnline}
                onCheckedChange={setNowebMarkOnline}
                disabled={disabled}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Metadata */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 shrink-0">
              <Code className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium flex items-center gap-2">
                {SESSION_HELP.metadata.title}
                <FieldHelp content={SESSION_HELP.metadata} />
              </h3>
              <p className="text-xs text-muted-foreground">
                {SESSION_HELP.metadata.description}
              </p>
            </div>
          </div>

          <div className="pl-[52px]">
            <Textarea
              placeholder='{"customId": "123", "group": "sales"}'
              value={metadataJson}
              onChange={(e) => setMetadataJson(e.target.value)}
              disabled={disabled}
              className="font-mono text-xs"
              rows={3}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
