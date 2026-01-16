import { useDashboardStats } from '../hooks/useDashboardStats'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Activity } from 'lucide-react'
import { StatCard } from '../components'

export default function DashboardPage() {
  const { stats, quickActions } = useDashboardStats()

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <StatCard
            key={i}
            title={stat.title}
            value={stat.value}
            subtitle={stat.subtitle}
            icon={stat.icon}
            href={stat.href}
            color={stat.color as any}
            className="shadow-sm border-none bg-card"
          />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        {/* Quick Actions */}
        <div className="md:col-span-5 space-y-6">
            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common tasks to manage your gateway</CardDescription>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {quickActions.map((action, i) => (
                        <Button
                            key={i}
                            variant={action.variant || "outline"}
                            className="h-24 flex flex-col items-center justify-center gap-2 rounded-xl border-dashed border-2 hover:border-solid hover:bg-secondary/50 transition-all"
                            asChild
                        >
                            <a href={action.href}>
                                <div className={`p-2 rounded-full ${action.variant === 'default' ? 'bg-primary-foreground/10' : 'bg-secondary'}`}>
                                    <action.icon className="w-5 h-5" />
                                </div>
                                <span className="font-medium">{action.label}</span>
                            </a>
                        </Button>
                    ))}
                </CardContent>
            </Card>

            {/* Recent Activity Placeholder (Can be real data later) */}
             <Card className="border-none shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle>System Activity</CardTitle>
                        <CardDescription>Real-time system events and logs</CardDescription>
                    </div>
                    <Activity className="w-5 h-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4 text-sm p-3 rounded-lg bg-secondary/30">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="font-medium">System Online</span>
                            <span className="text-muted-foreground ml-auto">Just now</span>
                        </div>
                        {/* Placeholder items */}
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            No critical alerts. Your system is running smoothly.
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Side Panel / Health */}
        <div className="md:col-span-2 space-y-6">
             <Card className="bg-primary text-primary-foreground border-none shadow-lg overflow-hidden relative">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                <CardHeader>
                    <CardTitle className="text-lg">Pro Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm opacity-90">
                        Did you know you can use webhooks to receive real-time message updates?
                    </p>
                    <Button variant="secondary" size="sm" className="w-full" asChild>
                        <a href="/docs#webhooks">Learn Webhooks</a>
                    </Button>
                </CardContent>
            </Card>

             <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg">Resource Usage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Memory</span>
                            <span className="font-medium">24%</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 w-[24%]" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Storage</span>
                            <span className="font-medium">12%</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 w-[12%]" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}
