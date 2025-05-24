"use client"

import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { UserRole } from '@/lib/firebase/auth-service'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { LogoutButton } from '@/components/auth/logout-button'
import { BottomNavigation } from '@/components/ui/bottom-navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import useAuthStore from '@/stores/auth-store'

interface AppLayoutProps {
  children: ReactNode
  allowedRoles?: UserRole[]
  title?: string
  hideBottomNav?: boolean
  showBackButton?: boolean
  onBackClick?: () => void
}

export function AppLayout({ 
  children, 
  allowedRoles, 
  title = "FnB Kita",
  hideBottomNav = false,
  showBackButton = false,
  onBackClick 
}: AppLayoutProps) {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const role = useAuthStore((state) => state.role)

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick()
    } else {
      router.back()
    }
  }

  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Material Design AppBar with optional back navigation */}
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {showBackButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackClick}
                  className="hover:bg-gray-100 rounded-full p-2"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <h1 className="text-xl font-medium text-gray-900">{title}</h1>
            </div>
            <LogoutButton variant="ghost" size="sm" showIcon={false} />
          </div>
        </header>

        {/* Main Content with proper spacing */}
        <main className="flex-1 pb-20 overflow-y-auto">
          {children}
        </main>

        {/* Material Design Bottom Navigation */}
        {!hideBottomNav && <BottomNavigation />}
      </div>
    </ProtectedRoute>
  )
}