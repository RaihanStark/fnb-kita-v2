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
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10 safe-top">
          <div className="px-4 py-3 flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            <LogoutButton variant="ghost" size="sm" showIcon={false} />
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 pb-16">
          {children}
        </div>

        {/* Bottom Navigation */}
        {!hideBottomNav && <BottomNavigation />}
      </div>
    </ProtectedRoute>
  )
}