"use client"

import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { LoginForm } from '@/components/auth/login-form'
import { useEffect } from 'react'

export default function LoginPage() {
  const router = useRouter()
  const { user, role } = useAuth()

  useEffect(() => {
    if (user) {
      if (role === 'Manager') {
        router.push('/manager')
      } else if (role === 'Employee') {
        router.push('/employee')
      } else {
        router.push('/dashboard')
      }
    }
  }, [user, role, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoginForm 
        onSuccess={() => {
          router.push('/dashboard')
        }}
      />
    </div>
  )
}