import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '../api/auth.api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, XCircle, Mail } from 'lucide-react'
import { toast } from 'sonner'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  
  const [status, setStatus] = useState<'pending' | 'verifying' | 'success' | 'error'>('pending')

  useEffect(() => {
    if (token) {
      verifyToken(token)
    }
  }, [token])

  const verifyToken = async (token: string) => {
    setStatus('verifying')
    try {
      await authApi.verifyEmail(token)
      setStatus('success')
      toast.success('Email verified successfully')
    } catch (error) {
      setStatus('error')
      toast.error('Failed to verify email')
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Check your inbox</CardTitle>
            <CardDescription>
              We've sent a verification link to your email address. Please click the link to verify your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button variant="outline" onClick={() => navigate('/login')}>
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 flex items-center justify-center mb-4">
            {status === 'verifying' && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
            {status === 'success' && <CheckCircle2 className="h-10 w-10 text-green-500" />}
            {status === 'error' && <XCircle className="h-10 w-10 text-destructive" />}
          </div>
          <CardTitle>
            {status === 'verifying' && 'Verifying Email...'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </CardTitle>
          <CardDescription>
            {status === 'verifying' && 'Please wait while we verify your email address.'}
            {status === 'success' && 'Your email has been successfully verified. You can now log in.'}
            {status === 'error' && 'The verification link is invalid or has expired.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {status === 'success' && (
            <Button onClick={() => navigate('/login')}>
              Proceed to Login
            </Button>
          )}
          {status === 'error' && (
            <Button variant="outline" onClick={() => navigate('/login')}>
              Back to Login
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
