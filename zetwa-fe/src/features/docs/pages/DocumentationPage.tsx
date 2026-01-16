import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  ChevronRight,
  Menu,
  X,
  ArrowLeft,
  Smartphone,
  Key,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DOC_SECTIONS } from '../constants/sections'

import {
  QuickStartSection,
  AuthSection,
  SessionsSection,
  MessagesSection,
  ContactsSection,
  WebhooksSection,
  ApiKeysSection,
  GroupsSection,
  PresenceSection,
  LabelsSection,
  StatusSection,
  ProfileSection,
  ExtendedMessagesSection,
} from '../sections'

export default function DocumentationPage() {
  const [activeSection, setActiveSection] = useState('quickstart')
  const [mobileOpen, setMobileOpen] = useState(false)

  // Use base URL without /api suffix for documentation display
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3222/api'
  // Remove trailing /api if present for curl examples to show correct full path
  const baseUrl = apiBaseUrl.replace(/\/api\/?$/, '')

  const renderSection = () => {
    switch (activeSection) {
      case 'quickstart': return <QuickStartSection baseUrl={baseUrl} />
      case 'auth': return <AuthSection baseUrl={baseUrl} />
      case 'sessions': return <SessionsSection baseUrl={baseUrl} />
      case 'messages': return <MessagesSection baseUrl={baseUrl} />
      case 'extended-messages': return <ExtendedMessagesSection baseUrl={baseUrl} />
      case 'contacts': return <ContactsSection baseUrl={baseUrl} />
      case 'groups': return <GroupsSection baseUrl={baseUrl} />
      case 'presence': return <PresenceSection baseUrl={baseUrl} />
      case 'labels': return <LabelsSection baseUrl={baseUrl} />
      case 'status': return <StatusSection baseUrl={baseUrl} />
      case 'profile': return <ProfileSection baseUrl={baseUrl} />
      case 'webhooks': return <WebhooksSection baseUrl={baseUrl} />
      case 'apikeys': return <ApiKeysSection baseUrl={baseUrl} />
      default: return <QuickStartSection baseUrl={baseUrl} />
    }
  }

  const NavContent = () => (
    <nav className="space-y-1">
      {DOC_SECTIONS.map((section) => {
        const Icon = section.icon
        const isActive = activeSection === section.id
        return (
          <button
            key={section.id}
            onClick={() => {
              setActiveSection(section.id)
              setMobileOpen(false)
            }}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {section.label}
            {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
          </button>
        )
      })}
    </nav>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4 lg:px-6">
          <Link to="/dashboard" className="flex items-center gap-2 mr-6">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Zetwa API Documentation</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/dashboard/sessions">
              <Button variant="outline" size="sm" className="hidden sm:flex gap-2">
                <Smartphone className="h-4 w-4" />
                Sessions
              </Button>
            </Link>
            <Link to="/dashboard/api-keys">
              <Button variant="outline" size="sm" className="hidden sm:flex gap-2">
                <Key className="h-4 w-4" />
                API Keys
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 border-r bg-muted/30 p-4 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-lg font-bold">API Documentation</h2>
            <p className="text-xs text-muted-foreground">Zetwa WhatsApp Gateway</p>
          </div>
          <NavContent />
        </aside>

        {/* Mobile Sidebar */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
            <aside className="absolute left-0 top-0 h-full w-64 bg-background p-4 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold">API Documentation</h2>
                  <p className="text-xs text-muted-foreground">Zetwa WhatsApp Gateway</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <NavContent />
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {/* Mobile Header */}
          <div className="lg:hidden sticky top-14 z-40 bg-background border-b p-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setMobileOpen(true)}>
              <Menu className="h-4 w-4" />
              {DOC_SECTIONS.find(s => s.id === activeSection)?.label}
            </Button>
          </div>

          <div className="p-6 lg:p-8 max-w-4xl">
            {renderSection()}
          </div>
        </main>
      </div>
    </div>
  )
}
