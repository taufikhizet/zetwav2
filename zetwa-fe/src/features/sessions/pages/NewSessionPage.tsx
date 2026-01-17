import { useNewSession } from '../hooks/useNewSession'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { WebhookList } from '@/features/webhooks/components/WebhookList'
import { BasicInfoCard } from '../components/new-session/BasicInfoCard'
import { AdvancedConfigCard } from '../components/new-session/AdvancedConfigCard'

export default function NewSessionPage() {
  const navigate = useNavigate()
  const {
    // State
    name, setName,
    description, setDescription,
    autoStart, setAutoStart,
    debugMode, setDebugMode,
    deviceName, setDeviceName,
    browserName, setBrowserName,
    useProxy, setUseProxy,
    proxyServer, setProxyServer,
    proxyUsername, setProxyUsername,
    proxyPassword, setProxyPassword,
    ignoreStatus, setIgnoreStatus,
    ignoreGroups, setIgnoreGroups,
    ignoreChannels, setIgnoreChannels,
    ignoreBroadcast, setIgnoreBroadcast,
    nowebStoreEnabled, setNowebStoreEnabled,
    nowebFullSync, setNowebFullSync,
    nowebMarkOnline, setNowebMarkOnline,
    metadataJson, setMetadataJson,
    webhooks, setWebhooks,
    
    // Validation
    isNameValid,
    isProxyValid,
    
    // Actions
    handleSubmit,
    createMutation,
  } = useNewSession()

  return (
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

                 {/* Action Buttons */}
                 <div className="flex items-center justify-end gap-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => navigate('/dashboard/sessions')}
                      disabled={createMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending || !name.trim()}
                    >
                      {createMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Create Session
                    </Button>
                 </div>
             </div>
      </div>
    </form>
  )
}
