"use client"

import { useRouter } from 'next/navigation'
import useAuthStore from '@/stores/auth-store'
import { LoginForm } from '@/components/auth/login-form'
import { useEffect } from 'react'
import { Utensils } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col">
      <div className="safe-top" />
      
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="mb-8 text-center">
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-600">
            <Utensils className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">FnB Kita</h1>
          <p className="text-gray-600 mt-1">Manage your restaurant efficiently</p>
        </div>
        
        <div className="w-full max-w-sm">
          <LoginForm 
            onSuccess={() => {
              router.push('/dashboard')
            }}
          />
        </div>
      </div>
      
      <div className="safe-bottom" />
    </div>
  )
}