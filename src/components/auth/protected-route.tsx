"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { UserRole } from '@/lib/firebase/auth-service'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  redirectTo?: string
}

export function ProtectedRoute({ 
  children, 
  allowedRoles,
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { user, role, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo)
    }

    if (!loading && user && allowedRoles && role) {
      if (!allowedRoles.includes(role)) {
        router.push('/unauthorized')
      }
    }
  }, [user, role, loading, router, redirectTo, allowedRoles])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return null
  }

  return <>{children}</>
}