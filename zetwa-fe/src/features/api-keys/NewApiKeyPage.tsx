/**
 * New API Key Page
 * 
 * Dedicated page for creating a new API key with comprehensive help
 * and modern, user-friendly design.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Loader2,
  KeyRound,
  Shield,
  Calendar,
  Copy,
  Check,
  AlertTriangle,
  Eye,
  EyeOff,
  Info,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { FieldHelp } from '@/components/ui/field-help'

import {
  API_KEY_SCOPES,
  SCOPE_CATEGORIES,
  SCOPE_DESCRIPTIONS,
  SCOPE_ICONS,
  DEFAULT_SCOPES,
  type ApiKey,
  type ApiKeyScope,
} from './types'
import { useCreateApiKey } from './hooks'
import { API_KEY_HELP, SCOPE_CATEGORY_HELP } from './help-content'

export function NewApiKeyPage() {
  const navigate = useNavigate()

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [selectedScopes, setSelectedScopes] = useState<string[]>([...DEFAULT_SCOPES])

  // Success state
  const [createdKey, setCreatedKey] = useState<ApiKey | null>(null)
  const [copied, setCopied] = useState(false)
  const [showKey, setShowKey] = useState(true)

  // Validation
  const isNameValid = name.trim().length >= 3 && name.trim().length <= 100
  const isNameEmpty = name.trim().length === 0
  const hasMinScopes = selectedScopes.length > 0

  // Get minimum date for expiration (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().slice(0, 16)
  }

  // Mutation
  const createMutation = useCreateApiKey({
    onSuccess: (data) => {
      setCreatedKey(data)
    },
  })

  // Scroll to top when key is created
  useEffect(() => {
    if (createdKey) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [createdKey])

  // Toggle scope
  const toggleScope = (scope: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    )
  }

  // Toggle category
  const toggleCategory = (categoryScopes: readonly string[]) => {
    const allSelected = categoryScopes.every((s) => selectedScopes.includes(s))
    if (allSelected) {
      setSelectedScopes((prev) => prev.filter((s) => !categoryScopes.includes(s)))
    } else {
      const newScopes = new Set([...selectedScopes, ...categoryScopes])
      setSelectedScopes([...newScopes])
    }
  }

  // Select/deselect all
  const selectAllScopes = () => setSelectedScopes([...API_KEY_SCOPES])
  const clearAllScopes = () => setSelectedScopes([])

  // Copy key to clipboard
  const copyKey = async () => {
    if (!createdKey?.key) return
    try {
      await navigator.clipboard.writeText(createdKey.key)
      setCopied(true)
      toast.success('API key copied to clipboard!')
      setTimeout(() => setCopied(false), 3000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!isNameValid) {
      toast.error('Name must be between 3 and 100 characters')
      return
    }

    if (!hasMinScopes) {
      toast.error('Please select at least one permission')
      return
    }

    createMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      scopes: selectedScopes,
    })
  }

  // Success view
  if (createdKey) {
    return (
      <div className="min-h-screen pb-12">
        {/* Header */}
        <div className="border-b bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-green-700 dark:text-green-300">
                  API Key Created Successfully! 🎉
                </h1>
                <p className="text-muted-foreground max-w-md">
                  Your new API key <strong>"{createdKey.name}"</strong> is ready to use.
                  Make sure to copy it now!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          {/* Warning Banner */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-amber-800 dark:text-amber-200">
                Important: Save Your API Key
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                This is the only time you'll see the full API key. Store it securely - you won't
                be able to view it again after leaving this page.
              </p>
            </div>
          </div>

          {/* API Key Display */}
          <Card className="border-2 border-green-200 dark:border-green-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-green-600" />
                Your API Key
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg border">
                  <code className="flex-1 font-mono text-sm break-all select-all">
                    {showKey ? createdKey.key : '•'.repeat(38)}
                  </code>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowKey(!showKey)}
                      className="h-8 w-8"
                    >
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={copyKey}
                      className="h-8 w-8"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <Button onClick={copyKey} className="w-full" size="lg">
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied to Clipboard!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy API Key
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Usage Example */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Usage Example</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-zinc-950 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-zinc-100">
                  <code>{`curl -X GET "https://your-api-url/api/sessions" \\
  -H "X-API-Key: ${createdKey.key || 'your-api-key'}"`}</code>
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Key Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Key Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="font-medium">{createdKey.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Expires</p>
                  <p className="font-medium">
                    {createdKey.expiresAt
                      ? new Date(createdKey.expiresAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : 'Never'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground mb-2">Permissions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {createdKey.scopes.map((scope) => (
                      <Badge key={scope} variant="secondary" className="text-xs">
                        {scope}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard/api-keys')}
              className="flex-1"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to API Keys
            </Button>
            <Button
              onClick={() => {
                setCreatedKey(null)
                setName('')
                setDescription('')
                setExpiresAt('')
                setSelectedScopes([...DEFAULT_SCOPES])
              }}
              className="flex-1"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Create Another Key
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Form view
  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-background to-muted/30">
        <div className="max-w-3xl mx-auto px-4 py-6">
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
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Create API Key</h1>
              <p className="text-muted-foreground text-sm md:text-base">
                Generate a new API key for external application access
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Info Banner */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl">
            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-blue-800 dark:text-blue-200">
                How API Keys Work
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                API keys allow external applications to authenticate with your WhatsApp API.
                Each key can have specific permissions (scopes) to control what actions it can perform.
                Keys are securely hashed - you'll only see the full key once after creation.
              </p>
            </div>
          </div>

          {/* Step 1: Basic Information */}
          <Card className="border-2 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  1
                </div>
                <div>
                  <CardTitle className="text-xl">Key Information</CardTitle>
                  <CardDescription className="mt-1">
                    Give your API key a name and optional description
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                  API Key Name
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                    Required
                  </Badge>
                  <FieldHelp content={API_KEY_HELP.name} />
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Production Bot Server"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={createMutation.isPending}
                  className={`h-11 text-base ${
                    name && !isNameValid ? 'border-red-500 focus-visible:ring-red-500' : ''
                  }`}
                />
                {name && !isNameValid && (
                  <p className="text-sm text-red-500">
                    Name must be between 3 and 100 characters
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  A descriptive name to identify this API key in your dashboard
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium flex items-center gap-2">
                  Description
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    Optional
                  </Badge>
                  <FieldHelp content={API_KEY_HELP.description} />
                </Label>
                <Textarea
                  id="description"
                  placeholder="e.g., API key for the main bot server running on AWS EC2"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={createMutation.isPending}
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Additional notes about the purpose or usage of this key
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Expiration */}
          <Card className="border-2 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  2
                </div>
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Expiration
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Set when this API key should expire (optional)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="expiresAt" className="text-sm font-medium flex items-center gap-2">
                  Expiration Date & Time
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    Optional
                  </Badge>
                  <FieldHelp content={API_KEY_HELP.expiresAt} />
                </Label>
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  disabled={createMutation.isPending}
                  min={getMinDate()}
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for a key that never expires. Recommended for production use.
                </p>
              </div>

              {/* Quick expiration buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setExpiresAt('')}
                  className={!expiresAt ? 'border-primary' : ''}
                >
                  Never
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const date = new Date()
                    date.setDate(date.getDate() + 7)
                    setExpiresAt(date.toISOString().slice(0, 16))
                  }}
                >
                  7 Days
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const date = new Date()
                    date.setDate(date.getDate() + 30)
                    setExpiresAt(date.toISOString().slice(0, 16))
                  }}
                >
                  30 Days
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const date = new Date()
                    date.setDate(date.getDate() + 90)
                    setExpiresAt(date.toISOString().slice(0, 16))
                  }}
                >
                  90 Days
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const date = new Date()
                    date.setFullYear(date.getFullYear() + 1)
                    setExpiresAt(date.toISOString().slice(0, 16))
                  }}
                >
                  1 Year
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Permissions */}
          <Card className="border-2 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  3
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Permissions
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Select what this API key is allowed to do
                  </CardDescription>
                </div>
                <FieldHelp content={API_KEY_HELP.scopes} size="md" />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Selection summary and actions */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge variant={hasMinScopes ? 'default' : 'destructive'}>
                    {selectedScopes.length} of {API_KEY_SCOPES.length} selected
                  </Badge>
                  {!hasMinScopes && (
                    <span className="text-sm text-red-500">At least 1 required</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={selectAllScopes}
                    disabled={createMutation.isPending}
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearAllScopes}
                    disabled={createMutation.isPending}
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              {/* Scopes by category */}
              <div className="space-y-6">
                {Object.entries(SCOPE_CATEGORIES).map(([category, scopes]) => {
                  const categorySelected = scopes.filter((s) => selectedScopes.includes(s)).length
                  const allSelected = categorySelected === scopes.length

                  return (
                    <div key={category} className="space-y-3">
                      {/* Category header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{SCOPE_ICONS[category]}</span>
                          <span className="font-medium">{category}</span>
                          <Badge variant="outline" className="text-xs">
                            {categorySelected}/{scopes.length}
                          </Badge>
                          {SCOPE_CATEGORY_HELP[category] && (
                            <FieldHelp content={SCOPE_CATEGORY_HELP[category]} />
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleCategory(scopes)}
                          disabled={createMutation.isPending}
                          className="text-xs"
                        >
                          {allSelected ? 'Deselect All' : 'Select All'}
                        </Button>
                      </div>

                      {/* Scopes */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-7">
                        {scopes.map((scope) => {
                          const isSelected = selectedScopes.includes(scope)
                          const scopeKey = `scope:${scope}` as keyof typeof API_KEY_HELP

                          return (
                            <label
                              key={scope}
                              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-primary/5 border-primary/30'
                                  : 'hover:bg-muted/50 border-transparent'
                              } ${createMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleScope(scope)}
                                disabled={createMutation.isPending}
                                className="mt-0.5"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-medium text-sm">{scope}</span>
                                  {API_KEY_HELP[scopeKey] && (
                                    <FieldHelp
                                      content={API_KEY_HELP[scopeKey]}
                                      className="opacity-50 hover:opacity-100"
                                    />
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {SCOPE_DESCRIPTIONS[scope as ApiKeyScope]}
                                </p>
                              </div>
                            </label>
                          )
                        })}
                      </div>

                      <Separator />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Submit Section */}
          <Card className="border-2 border-dashed bg-muted/30">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  disabled={createMutation.isPending}
                  className="flex-1 h-12"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || isNameEmpty || !isNameValid || !hasMinScopes}
                  className="flex-1 h-12"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <KeyRound className="mr-2 h-4 w-4" />
                      Create API Key
                    </>
                  )}
                </Button>
              </div>

              {/* Validation summary */}
              {(isNameEmpty || !hasMinScopes) && (
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Please complete the following:
                  </p>
                  <ul className="mt-1 text-sm text-amber-600 dark:text-amber-400 list-disc list-inside">
                    {isNameEmpty && <li>Enter an API key name</li>}
                    {!hasMinScopes && <li>Select at least one permission</li>}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}

export default NewApiKeyPage
