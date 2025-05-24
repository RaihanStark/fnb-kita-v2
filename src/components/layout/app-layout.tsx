"use client"

import { ReactNode } from 'react'
import { UserRole } from '@/lib/firebase/auth-service'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { LogoutButton } from '@/components/auth/logout-button'
import { BottomNavigation } from '@/components/ui/bottom-navigation'
import useAuthStore from '@/stores/auth-store'

interface AppLayoutProps {
  children: ReactNode
  allowedRoles?: UserRole[]
  title?: string
  hideBottomNav?: boolean
}

export function AppLayout({ 
  children, 
  allowedRoles, 
  title = "FnB Kita",
  hideBottomNav = false 
}: AppLayoutProps) {
  const user = useAuthStore((state) => state.user)
  const role = useAuthStore((state) => state.role)

  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Material Design AppBar */}
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="px-4 h-16 flex items-center justify-between">
            <h1 className="text-xl font-medium text-gray-900">{title}</h1>
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