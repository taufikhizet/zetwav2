import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '../api/auth.api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, XCircle, Mail, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth.store'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const verifyAttempted = useRef(false)
  
  const [status, setStatus] = useState<'pending' | 'verifying' | 'success' | 'error'>('pending')
  const [isResending, setIsResending] = useState(false)
  const [isAlreadyVerified, setIsAlreadyVerified] = useState(false)
  const [countdown, setCountdown] = useState(5)

  // Show "Already Verified" state if user is already verified
  useEffect(() => {
    if (user?.isVerified) {
        setStatus('success')
        setIsAlreadyVerified(true)
    }
  }, [user])

  // Auto redirect countdown
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (status === 'success' && user) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            navigate('/dashboard')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [status, user, navigate])

  useEffect(() => {
    // Only verify if user is NOT verified yet
    if (token && !verifyAttempted.current && !user?.isVerified) {
      verifyAttempted.current = true
      verifyToken(token)
    }
  }, [token, user])

  const verifyToken = async (token: string) => {
    setStatus('verifying')
    try {
      await authApi.verifyEmail(token)
      setStatus('success')
      toast.success('Email verified successfully')
    } catch (error: any) {
      // Check for "User already verified" error
      if (error.response?.data?.error?.message === 'User already verified') {
        setStatus('success')
        setIsAlreadyVerified(true)
        toast.info('Email is already verified')
      } else {
        setStatus('error')
        // Don't show toast here as the UI already shows error state
      }
    }
  }

  const handleResend = async () => {
    if (!user?.email) return
    
    setIsResending(true)
    try {
      await authApi.resendVerification()
      toast.success('Verification email sent')
      // Clear token from URL to show "Check inbox" state
      navigate('/verify-email', { replace: true })
    } catch (error: any) {
      // Show specific error message if available
      const message = error.response?.data?.error?.message || 'Failed to send verification email'
      toast.error(message)
    } finally {
      setIsResending(false)
    }
  }

  const handleContinue = () => {
    if (user) {
      navigate('/dashboard')
    } else {
      navigate('/login')
    }
  }

  if (!token && !user?.isVerified && status !== 'success') {
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
            {user && (
              <Button variant="ghost" onClick={handleResend} disabled={isResending} className="w-full">
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resend Verification Email
                  </>
                )}
              </Button>
            )}
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
            {status === 'success' && (isAlreadyVerified ? 'Email Already Verified' : 'Email Verified!')}
            {status === 'error' && 'Verification Failed'}
          </CardTitle>
          <CardDescription>
            {status === 'verifying' && 'Please wait while we verify your email address.'}
            {status === 'success' && (isAlreadyVerified 
                ? 'Your email has already been verified previously. You can continue to the dashboard.' 
                : 'Your email has been successfully verified. You can now continue.')}
            {status === 'error' && 'The verification link is invalid or has expired.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
            {status === 'success' && (
              <div className="space-y-4">
                <Button onClick={handleContinue} className="w-full">
                  {user ? 'Go to Dashboard' : 'Proceed to Login'}
                </Button>
                {user && (
                    <p className="text-sm text-muted-foreground text-center">
                        Redirecting in {countdown}s...
                    </p>
                )}
              </div>
            )}
            {status === 'error' && (
            <div className="flex flex-col gap-2">
              {user && (
                <Button variant="default" onClick={handleResend} disabled={isResending}>
                  {isResending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Resend Verification Email
                    </>
                  )}
                </Button>
              )}
              <Button variant="outline" onClick={() => navigate('/login')}>
                Back to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
