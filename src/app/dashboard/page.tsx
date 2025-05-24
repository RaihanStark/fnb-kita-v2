"use client"

import { useAuth } from '@/contexts/auth-context'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { LogoutButton } from '@/components/auth/logout-button'
import { ChangePasswordForm } from '@/components/auth/change-password-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export default function DashboardPage() {
  const { user, role } = useAuth()
  const [showChangePassword, setShowChangePassword] = useState(false)

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">FnB Kita Dashboard</h1>
            <LogoutButton />
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-8">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>User Information</CardTitle>
                <CardDescription>Your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Role:</strong> {role || 'No role assigned'}</p>
                <p><strong>UID:</strong> {user?.uid}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Role-Based Access</CardTitle>
                <CardDescription>Features available based on your role</CardDescription>
              </CardHeader>
              <CardContent>
                {role === 'Manager' && (
                  <div className="space-y-2">
                    <p className="text-green-600">✓ Access to manager dashboard</p>
                    <p className="text-green-600">✓ View all employee data</p>
                    <p className="text-green-600">✓ Generate reports</p>
                    <p className="text-green-600">✓ Manage inventory</p>
                  </div>
                )}
                {role === 'Employee' && (
                  <div className="space-y-2">
                    <p className="text-blue-600">✓ Access to employee dashboard</p>
                    <p className="text-blue-600">✓ View personal data</p>
                    <p className="text-blue-600">✓ Submit timesheets</p>
                    <p className="text-blue-600">✓ View schedule</p>
                  </div>
                )}
                {!role && (
                  <p className="text-muted-foreground">No role assigned. Contact administrator.</p>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account preferences</CardDescription>
              </CardHeader>
              <CardContent>
                {!showChangePassword ? (
                  <Button onClick={() => setShowChangePassword(true)}>
                    Change Password
                  </Button>
                ) : (
                  <div className="max-w-md">
                    <ChangePasswordForm 
                      onSuccess={() => {
                        setShowChangePassword(false)
                      }}
                    />
                    <Button 
                      variant="ghost" 
                      className="mt-4"
                      onClick={() => setShowChangePassword(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}