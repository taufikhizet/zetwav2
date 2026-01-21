import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authApi } from '../api/auth.api'
import { useAuthStore } from '@/stores/auth.store'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Rocket } from 'lucide-react'

const onboardingSchema = z.object({
  profession: z.string().min(1, 'Profession is required'),
  usagePurpose: z.string().min(1, 'Usage purpose is required'),
  referralSource: z.string().min(1, 'Please select where you heard about us'),
})

type OnboardingValues = z.infer<typeof onboardingSchema>

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { user, setUser } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      profession: '',
      usagePurpose: '',
      referralSource: '',
    },
  })

  const onSubmit = async (values: OnboardingValues) => {
    setIsLoading(true)
    try {
      await authApi.completeOnboarding(values)
      
      // Update local user state
      if (user) {
        setUser({ ...user, isOnboardingCompleted: true })
      }
      
      toast.success('Welcome aboard!')
      navigate('/dashboard')
    } catch (error) {
      toast.error('Failed to complete onboarding')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Welcome to Zetwa!</CardTitle>
          </div>
          <CardDescription>
            Help us personalize your experience by answering a few quick questions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="profession"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What is your profession?</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Developer, Business Owner, Student" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="usagePurpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How do you plan to use Zetwa?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a purpose" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="personal">Personal Project</SelectItem>
                        <SelectItem value="business">Business Automation</SelectItem>
                        <SelectItem value="marketing">Marketing & Outreach</SelectItem>
                        <SelectItem value="support">Customer Support</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="referralSource"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How did you hear about us?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="google">Google Search</SelectItem>
                        <SelectItem value="youtube">YouTube</SelectItem>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                        <SelectItem value="friend">Friend / Colleague</SelectItem>
                        <SelectItem value="university">University / Lecturer</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Getting Started...' : 'Get Started'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
