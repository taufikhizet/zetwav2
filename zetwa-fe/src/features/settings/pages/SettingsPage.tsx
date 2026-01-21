import { Outlet } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Settings } from 'lucide-react'
import { SettingsSidebar } from '../components/SettingsSidebar'

export default function SettingsPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:items-start">
      {/* Sidebar Navigation */}
      <Card className="p-2 h-auto lg:sticky lg:top-[4.5rem] shadow-sm border-muted">
        <div className="px-4 py-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </div>
        <Separator className="mb-2 mx-2 w-auto" />
        <SettingsSidebar />
      </Card>

      {/* Feature Content */}
      <div className="min-w-0 space-y-4">
        <Outlet />
      </div>
    </div>
  )
}
