import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  MessageSquare,
  Smartphone,
  Key,
  Menu,
  User,
  Search,
  Bell,
  LogOut
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  { name: 'API Keys', href: '/dashboard/api-keys', icon: Key },
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
          'fixed inset-y-0 left-0 z-50 w-24 bg-card border-r shadow-none transform transition-transform duration-200 ease-in-out lg:translate-x-0 flex flex-col items-center py-6',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="mb-10">
          <Link to="/dashboard" className="flex items-center justify-center">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shadow-sm">
              <MessageSquare className="w-7 h-7 text-primary" />
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 w-full px-2 space-y-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== '/dashboard' && location.pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl transition-all duration-200 group',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <item.icon className={cn(
                  "w-6 h-6 transition-transform duration-200 group-hover:scale-110",
                  isActive ? "text-primary fill-primary/20" : "text-muted-foreground"
                )} />
                <span className="text-[10px] font-medium text-center leading-none">
                  {item.name}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* User Profile (Mini) - Removed per user request */}

      </aside>

      {/* Main Content Wrapper */}
      <div className="lg:pl-24 flex flex-col min-h-screen transition-all duration-200">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-24 px-8 bg-background/80 backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="w-6 h-6" />
                </Button>
                
                {/* Search Bar (Visual) */}
                <div className="hidden md:flex items-center relative w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                        placeholder="Search anything..." 
                        className="pl-11 h-12 bg-white border-none shadow-sm rounded-full focus-visible:ring-1 focus-visible:ring-primary/20 transition-all text-sm"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full hover:bg-white hover:shadow-sm transition-all">
                    <Bell className="w-5 h-5 text-muted-foreground" />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-destructive rounded-full border-2 border-background"></span>
                </Button>
                
                <div className="hidden md:flex items-center gap-3 pl-4 border-l">
                   <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-white hover:shadow-sm transition-all p-0">
                          <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
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
        <main className="flex-1 px-8 pb-8 pt-2">
           <div className="animate-in fade-in-50 duration-500">
             <Outlet />
           </div>
        </main>
      </div>
    </div>
  )
}
