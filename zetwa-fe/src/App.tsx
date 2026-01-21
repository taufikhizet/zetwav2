import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { useAuthStore } from '@/stores/auth.store'
import { authApi } from '@/features/auth/api/auth.api'

// Layouts
import DashboardLayout from '@/layouts/DashboardLayout'

// Auth Pages
import LoginPage from '@/features/auth/pages/LoginPage'
import RegisterPage from '@/features/auth/pages/RegisterPage'
import VerifyEmailPage from '@/features/auth/pages/VerifyEmailPage'
import OnboardingPage from '@/features/auth/pages/OnboardingPage'

// Dashboard Pages
import DashboardPage from '@/features/dashboard/pages/DashboardPage'
import SessionsPage from '@/features/sessions/pages/SessionsPage'
import NewSessionPage from '@/features/sessions/pages/NewSessionPage'
import SessionDetailPage from '@/features/sessions/pages/SessionDetailPage'
import { ApiKeysPage, NewApiKeyPage } from '@/features/api-keys'
import DocumentationPage from '@/features/docs/pages/DocumentationPage'
import SettingsPage from '@/features/settings/pages/SettingsPage'

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuthStore()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Check verification status
  if (user && !user.isVerified && location.pathname !== '/verify-email') {
    return <Navigate to="/verify-email" replace />
  }

  // Check onboarding status
  if (user && user.isVerified && !user.isOnboardingCompleted && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  // Redirect completed users away from onboarding
  if (user && user.isVerified && user.isOnboardingCompleted && location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

// Public route wrapper (redirect if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

function App() {
  const { isAuthenticated, setUser } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) {
      authApi.getProfile().then(setUser).catch(() => {
        // If getting profile fails (e.g. invalid token), logout
        useAuthStore.getState().logout()
      })
    }
  }, [isAuthenticated, setUser])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />
          <Route
            path="/verify-email"
            element={
              <VerifyEmailPage />
            }
          />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Dashboard Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="sessions" element={<SessionsPage />} />
            <Route path="sessions/new" element={<NewSessionPage />} />
            <Route path="sessions/:sessionId" element={<SessionDetailPage />} />
            <Route path="api-keys" element={<ApiKeysPage />} />
            <Route path="api-keys/new" element={<NewApiKeyPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Documentation - Standalone Route */}
          <Route
            path="/docs"
            element={
              <ProtectedRoute>
                <DocumentationPage />
              </ProtectedRoute>
            }
          />

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  )
}

export default App
