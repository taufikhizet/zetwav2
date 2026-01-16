import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Loader2, 
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { sessionApi, type CreateSessionInput, type SessionConfig } from '@/features/sessions/api/session.api'
import { WebhookList } from '@/features/webhooks/components/WebhookList'
import type { InlineWebhookConfig } from '@/features/webhooks/types/webhook.types'

import { BasicInfoCard } from '../components/new-session/BasicInfoCard'
import { AdvancedConfigCard } from '../components/new-session/AdvancedConfigCard'

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
                
                <BasicInfoCard 
                  name={name}
                  setName={setName}
                  description={description}
                  setDescription={setDescription}
                  autoStart={autoStart}
                  setAutoStart={setAutoStart}
                  isNameValid={isNameValid}
                  disabled={createMutation.isPending}
                />

                <AdvancedConfigCard 
                  debugMode={debugMode}
                  setDebugMode={setDebugMode}
                  useProxy={useProxy}
                  setUseProxy={setUseProxy}
                  proxyServer={proxyServer}
                  setProxyServer={setProxyServer}
                  proxyUsername={proxyUsername}
                  setProxyUsername={setProxyUsername}
                  proxyPassword={proxyPassword}
                  setProxyPassword={setProxyPassword}
                  isProxyValid={isProxyValid}
                  deviceName={deviceName}
                  setDeviceName={setDeviceName}
                  browserName={browserName}
                  setBrowserName={setBrowserName}
                  ignoreStatus={ignoreStatus}
                  setIgnoreStatus={setIgnoreStatus}
                  ignoreGroups={ignoreGroups}
                  setIgnoreGroups={setIgnoreGroups}
                  ignoreChannels={ignoreChannels}
                  setIgnoreChannels={setIgnoreChannels}
                  ignoreBroadcast={ignoreBroadcast}
                  setIgnoreBroadcast={setIgnoreBroadcast}
                  nowebStoreEnabled={nowebStoreEnabled}
                  setNowebStoreEnabled={setNowebStoreEnabled}
                  nowebFullSync={nowebFullSync}
                  setNowebFullSync={setNowebFullSync}
                  nowebMarkOnline={nowebMarkOnline}
                  setNowebMarkOnline={setNowebMarkOnline}
                  metadataJson={metadataJson}
                  setMetadataJson={setMetadataJson}
                  disabled={createMutation.isPending}
                />

             </div>

             {/* Right Column: Webhooks & Actions */}
             <div className="space-y-8">
                
                 {/* Step 3: Webhooks */}
                 <Card className="h-fit">
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
