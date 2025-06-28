"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useAuthStore from '@/stores/auth-store'
import { UserRole } from '@/stores/auth-store'
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
  const user = useAuthStore((state) => state.user)
  const loading = useAuthStore((state) => state.loading)
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo)
    }

    if (!loading && user && allowedRoles && user.role) {
      if (!allowedRoles.includes(user.role as UserRole)) {
        router.push('/unauthorized')
      }
    }
  }, [user, loading, router, redirectTo, allowedRoles])

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

  if (allowedRoles && user.role && !allowedRoles.includes(user.role as UserRole)) {
    return null
  }

  return <>{children}</>
}