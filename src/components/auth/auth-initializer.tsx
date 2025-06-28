"use client"

import { useEffect } from 'react'
import useAuthStore from '@/stores/auth-store'

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore((state) => state.checkAuth)
  
  useEffect(() => {
    // Check authentication status on mount
    checkAuth()
  }, [checkAuth])
  
  return <>{children}</>
}