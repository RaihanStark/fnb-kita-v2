"use client"

import useAuthStore from '@/stores/auth-store'
import { AppLayout } from '@/components/layout/app-layout'
import { ChangePasswordForm } from '@/components/auth/change-password-form'
import { LogoutButton } from '@/components/auth/logout-button'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { 
  User, 
  Lock,
  LogOut,
  ChevronRight,
  ArrowLeft
} from 'lucide-react'

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user)
  const role = useAuthStore((state) => state.role)
  const [showChangePassword, setShowChangePassword] = useState(false)

  if (showChangePassword) {
    return (
      <AppLayout 
        title="Change Password" 
        showBackButton 
        onBackClick={() => setShowChangePassword(false)}
      >
        <div className="p-4">
          <ChangePasswordForm 
            onSuccess={() => {
              setShowChangePassword(false)
            }}
          />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Settings">
      <div className="p-4">
        {/* User Profile Section */}
        <Card className="shadow-md border-0 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-orange-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">{user?.email}</h2>
                <p className="text-sm text-gray-500 capitalize mt-1">
                  {role || 'No role assigned'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Account Settings</h3>
          
          <Card className="shadow-md border-0">
            <CardContent className="p-0">
              {/* Change Password */}
              <Button
                onClick={() => setShowChangePassword(true)}
                variant="ghost"
                className="w-full h-auto flex items-center justify-between p-6 hover:bg-gray-50 transition-colors rounded-lg border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Lock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900 text-base">Change Password</p>
                    <p className="text-sm text-gray-500 mt-1">Update your account password</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Button>

              {/* Logout */}
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                      <LogOut className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 text-base">Sign Out</p>
                      <p className="text-sm text-gray-500 mt-1">Sign out of your account</p>
                    </div>
                  </div>
                  <LogoutButton 
                    variant="outline" 
                    size="sm" 
                    showIcon={false}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Sign Out
                  </LogoutButton>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}