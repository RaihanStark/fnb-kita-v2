"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { LogOut, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LogoutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  showIcon?: boolean
  redirectTo?: string
}

export function LogoutButton({ 
  variant = "ghost",
  size = "default",
  className,
  showIcon = true,
  redirectTo = "/login"
}: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { signOut } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await signOut()
      router.push(redirectTo)
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleLogout}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          {showIcon && <LogOut className="h-4 w-4" />}
          <span className={showIcon ? "ml-2" : ""}>Logout</span>
        </>
      )}
    </Button>
  )
}