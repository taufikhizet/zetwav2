import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  MessageSquare,
  Smartphone,
  KeyRound,
  Menu,
  User,
  Bell,
  LogOut,
  ChevronRight
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/stores/auth.store'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Sessions', href: '/dashboard/sessions', icon: Smartphone },
  { name: 'API Keys', href: '/dashboard/api-keys', icon: KeyRound },
]

const bottomNavigation = [
  { name: 'Docs', href: '/docs', icon: MessageSquare },
]

export default function DashboardLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getBreadcrumbs = () => {
    const path = location.pathname
    const parts = path.split('/').filter(Boolean)
    
    // Custom labels for paths
    const labels: Record<string, string> = {
      dashboard: 'Dashboard',
      sessions: 'Sessions',
      'api-keys': 'API Keys',
      new: 'New',
      docs: 'Documentation'
    }

    // Build breadcrumb items
    const items = parts.map((part, index) => {
      const href = '/' + parts.slice(0, index + 1).join('/')
      const label = labels[part] || part
      // Check if it's an ID (simple check: length > 15 and contains numbers)
      const isId = part.length > 15 && /\d/.test(part)
      
      return {
        label: isId ? 'Details' : label.charAt(0).toUpperCase() + label.slice(1),
        href,
        isLast: index === parts.length - 1
      }
    })

    return items
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mini Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[100px] bg-white dark:bg-card border-r shadow-lg shadow-gray-100/50 dark:shadow-none transform transition-transform duration-200 ease-in-out lg:translate-x-0 flex flex-col items-center py-8',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="mb-10">
          <Link to="/dashboard" className="flex items-center justify-center">
             <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30">
                <MessageSquare className="w-5 h-5 text-white" />
             </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 w-full px-4 space-y-6">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== '/dashboard' && location.pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className="flex flex-col items-center gap-2 group"
              >
                <div className={cn(
                  "w-12 h-12 rounded-[18px] flex items-center justify-center transition-all duration-300 ease-out shadow-sm",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-100" 
                    : "bg-gray-50/50 dark:bg-secondary/20 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary group-hover:scale-105 border border-transparent shadow-inner"
                )}>
                   <item.icon className={cn(
                     "w-6 h-6 transition-transform duration-300",
                     isActive ? "scale-100" : "group-hover:scale-110"
                   )} />
                </div>
                <span className={cn(
                  "text-[10px] font-bold tracking-wide transition-colors duration-200 uppercase",
                  isActive ? "text-primary" : "text-muted-foreground/70 group-hover:text-primary/80"
                )}>
                  {item.name}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="mt-auto px-4 space-y-4">
          {bottomNavigation.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== '/dashboard' && location.pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className="flex flex-col items-center gap-2 group"
              >
                <div className={cn(
                  "w-12 h-12 rounded-[18px] flex items-center justify-center transition-all duration-300 ease-out shadow-sm",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-100" 
                    : "bg-gray-50/50 dark:bg-secondary/20 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary group-hover:scale-105 border border-transparent shadow-inner"
                )}>
                   <item.icon className={cn(
                     "w-6 h-6 transition-transform duration-300",
                     isActive ? "scale-100" : "group-hover:scale-110"
                   )} />
                </div>
                <span className={cn(
                  "text-[10px] font-bold tracking-wide transition-colors duration-200 uppercase",
                  isActive ? "text-primary" : "text-muted-foreground/70 group-hover:text-primary/80"
                )}>
                  {item.name}
                </span>
              </Link>
            )
          })}
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="lg:pl-[100px] flex flex-col min-h-screen transition-all duration-200 bg-gray-50/50 dark:bg-background">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 px-8 bg-background/80 backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="w-6 h-6" />
                </Button>
                
                {/* Breadcrumbs */}
                <nav className="hidden md:flex items-center text-sm font-medium">
                  {getBreadcrumbs().map((item, index) => (
                    <div key={item.href} className="flex items-center">
                      {index > 0 && <ChevronRight className="w-4 h-4 mx-2 text-muted-foreground/50" />}
                      {item.isLast ? (
                        <span className="text-foreground font-semibold">{item.label}</span>
                      ) : (
                        <Link 
                          to={item.href} 
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          {item.label}
                        </Link>
                      )}
                    </div>
                  ))}
                </nav>
            </div>

            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full hover:bg-muted/50 transition-all">
                    <Bell className="w-5 h-5 text-muted-foreground" />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-destructive rounded-full border-2 border-background"></span>
                </Button>
                
                <div className="hidden md:flex items-center gap-3 pl-4 border-l">
                   <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-muted/50 transition-all p-0">
                          <Avatar className="h-8 w-8 border-2 border-background shadow-sm">
                            <AvatarImage src={user?.avatar || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {user?.name ? getInitials(user.name) : 'U'}
                            </AvatarFallback>
                          </Avatar>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-xl border-border/50 p-2 mt-2">
                        <DropdownMenuLabel className="px-3">
                          <div className="flex flex-col">
                            <span className="font-semibold">{user?.name}</span>
                            <span className="text-xs text-muted-foreground font-normal">{user?.email}</span>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="my-2" />
                        <DropdownMenuItem className="cursor-pointer gap-2 rounded-xl px-3 py-2">
                            <User className="w-4 h-4" /> Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer gap-2 rounded-xl px-3 py-2 text-destructive focus:text-destructive" onClick={handleLogout}>
                            <LogOut className="w-4 h-4" /> Logout
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                   </DropdownMenu>
                </div>
            </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 px-8 py-8">
           <div className="animate-in fade-in-50 duration-500">
             <Outlet />
           </div>
        </main>
      </div>
    </div>
  )
}
