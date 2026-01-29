import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { MainLayout } from '@/components/layout'
import { Dashboard, CreateVideo, Library } from '@/pages'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { useAuthStore } from '@/stores/authStore'
import { Loader2 } from 'lucide-react'

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, initialized } = useAuthStore()

  if (!initialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-950">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function App() {
  const { initialize, initialized } = useAuthStore()

  useEffect(() => {
    if (!initialized) {
      initialize()
    }
  }, [initialize, initialized])

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/create" element={
          <ProtectedRoute>
            <MainLayout>
              <CreateVideo />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/library" element={
          <ProtectedRoute>
            <MainLayout>
              <Library />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
