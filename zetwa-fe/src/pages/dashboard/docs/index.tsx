import { useState } from 'react'
import { 
  Book, 
  Key, 
  MessageSquare, 
  Smartphone, 
  Users, 
  Webhook,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import {
  QuickStartSection,
  AuthSection,
  SessionsSection,
  MessagesSection,
  ContactsSection,
  WebhooksSection,
  ApiKeysSection,
} from './sections'

const sections = [
  { id: 'quickstart', label: 'Quick Start', icon: Book },
  { id: 'auth', label: 'Authentication', icon: Key },
  { id: 'sessions', label: 'Sessions', icon: Smartphone },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'contacts', label: 'Contacts & Chats', icon: Users },
  { id: 'webhooks', label: 'Webhooks', icon: Webhook },
  { id: 'apikeys', label: 'API Keys', icon: Key },
]

export default function DocumentationPage() {
  const [activeSection, setActiveSection] = useState('quickstart')
  const [mobileOpen, setMobileOpen] = useState(false)

  // Use base URL without /api suffix for documentation display
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3222/api'
  // Remove trailing /api if present for curl examples to show correct full path
  const baseUrl = apiBaseUrl.replace(/\/api\/?$/, '')

  const renderSection = () => {
    switch (activeSection) {
      case 'quickstart':
        return <QuickStartSection baseUrl={baseUrl} />
      case 'auth':
        return <AuthSection baseUrl={baseUrl} />
      case 'sessions':
        return <SessionsSection baseUrl={baseUrl} />
      case 'messages':
        return <MessagesSection baseUrl={baseUrl} />
      case 'contacts':
        return <ContactsSection baseUrl={baseUrl} />
      case 'webhooks':
        return <WebhooksSection baseUrl={baseUrl} />
      case 'apikeys':
        return <ApiKeysSection baseUrl={baseUrl} />
      default:
        return <QuickStartSection baseUrl={baseUrl} />
    }
  }

  const NavContent = () => (
    <nav className="space-y-1">
      {sections.map((section) => {
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
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 border-r bg-muted/30 p-4 sticky top-0 h-screen overflow-y-auto">
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
        <div className="lg:hidden sticky top-0 z-40 bg-background border-b p-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setMobileOpen(true)}>
            <Menu className="h-4 w-4" />
            {sections.find(s => s.id === activeSection)?.label}
          </Button>
        </div>

        <div className="p-6 lg:p-8 max-w-4xl">
          {renderSection()}
        </div>
      </main>
    </div>
  )
}
