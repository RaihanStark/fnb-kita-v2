"use client"

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldX } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

export default function UnauthorizedPage() {
  const router = useRouter()
  const { signOut } = useAuth()

  const handleGoBack = () => {
    router.back()
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <ShieldX className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
          <CardDescription>
            You don&apos;t have permission to access this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground">
            This area is restricted to authorized personnel only. 
            Please contact your administrator if you believe this is an error.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button 
            onClick={handleGoBack} 
            className="w-full"
            variant="default"
          >
            Go Back
          </Button>
          <Button 
            onClick={handleSignOut} 
            variant="outline"
            className="w-full"
          >
            Sign Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}