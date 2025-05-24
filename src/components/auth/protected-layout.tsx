"use client"

import { ReactNode } from 'react'
import { UserRole } from '@/lib/firebase/auth-service'
import { ProtectedRoute } from './protected-route'
import { useAuth } from '@/contexts/auth-context'
import { LogoutButton } from './logout-button'
import { User, Briefcase } from 'lucide-react'

interface ProtectedLayoutProps {
  children: ReactNode
  allowedRoles?: UserRole[]
}

export function ProtectedLayout({ children, allowedRoles }: ProtectedLayoutProps) {
  const { user, role } = useAuth()

  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="border-b">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">FnB Kita</h1>
              {role && (
                <span className="flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                  {role === 'Manager' ? <Briefcase className="h-3 w-3" /> : <User className="h-3 w-3" />}
                  {role}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              {user && (
                <span className="text-sm text-muted-foreground">
                  {user.email}
                </span>
              )}
              <LogoutButton />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t p-4 text-center text-sm text-muted-foreground">
          © 2024 FnB Kita. All rights reserved.
        </footer>
      </div>
    </ProtectedRoute>
  )
}