"use client"

import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { UserRole } from '@/lib/firebase/auth-service'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { BottomNavigation } from '@/components/ui/bottom-navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface AppLayoutProps {
  children: ReactNode
  allowedRoles?: UserRole[]
  title?: string
  hideBottomNav?: boolean
  showBackButton?: boolean
  onBackClick?: () => void
  trailingActions?: ReactNode
}

export function AppLayout({ 
  children, 
  allowedRoles, 
  title = "FnB Kita",
  hideBottomNav = false,
  showBackButton = false,
  onBackClick,
  trailingActions
}: AppLayoutProps) {
  const router = useRouter()

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
        {/* Material Design 3 Top App Bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="px-4 h-16 flex items-center justify-between">
            {/* Leading section */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {showBackButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackClick}
                  className="hover:bg-gray-100 rounded-full p-2 shrink-0"
                >
                  <ArrowLeft className="h-6 w-6" />
                </Button>
              )}
              <h1 className="text-xl font-medium text-gray-900 truncate">{title}</h1>
            </div>
            
            {/* Trailing actions section */}
            {trailingActions && (
              <div className="flex items-center gap-2 shrink-0">
                {trailingActions}
              </div>
            )}
          </div>
        </header>

        {/* Main Content with proper spacing */}
        <main className="flex-1 pb-20 overflow-y-auto">
          {children}
        </main>

        {/* Bottom Navigation */}
        {!hideBottomNav && <BottomNavigation />}
      </div>
    </ProtectedRoute>
  )
}