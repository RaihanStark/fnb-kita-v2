"use client"

import { useAuth } from '@/contexts/auth-context'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { LogoutButton } from '@/components/auth/logout-button'
import { ChangePasswordForm } from '@/components/auth/change-password-form'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { 
  User, 
  ChefHat, 
  Users, 
  FileText, 
  Package, 
  Clock, 
  Calendar,
  Settings,
  ChevronRight,
  Lock
} from 'lucide-react'

export default function DashboardPage() {
  const { user, role } = useAuth()
  const [showChangePassword, setShowChangePassword] = useState(false)

  const managerFeatures = [
    { icon: Users, label: 'Manage Staff', color: 'bg-blue-100 text-blue-600' },
    { icon: FileText, label: 'Reports', color: 'bg-green-100 text-green-600' },
    { icon: Package, label: 'Inventory', color: 'bg-purple-100 text-purple-600' },
    { icon: ChefHat, label: 'Menu Items', color: 'bg-orange-100 text-orange-600' },
  ]

  const employeeFeatures = [
    { icon: Clock, label: 'Timesheet', color: 'bg-blue-100 text-blue-600' },
    { icon: Calendar, label: 'Schedule', color: 'bg-green-100 text-green-600' },
    { icon: User, label: 'Profile', color: 'bg-purple-100 text-purple-600' },
    { icon: Settings, label: 'Settings', color: 'bg-orange-100 text-orange-600' },
  ]

  const features = role === 'Manager' ? managerFeatures : employeeFeatures

  if (showChangePassword) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <header className="bg-white border-b border-gray-200 sticky top-0 z-10 safe-top">
            <div className="px-4 py-3 flex items-center justify-between">
              <Button 
                onClick={() => setShowChangePassword(false)}
                variant="ghost"
                className="text-gray-700 font-medium"
              >
                Cancel
              </Button>
              <h1 className="text-lg font-semibold">Change Password</h1>
              <div className="w-16" />
            </div>
          </header>
          
          <div className="flex-1 p-4">
            <ChangePasswordForm 
              onSuccess={() => {
                setShowChangePassword(false)
              }}
            />
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10 safe-top">
          <div className="px-4 py-3 flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">FnB Kita</h1>
            <LogoutButton variant="ghost" size="sm" showIcon={false} />
          </div>
        </header>

        {/* User Info Card */}
        <div className="px-4 pt-4">
          <Card className="border border-orange-600 bg-gradient-to-r from-orange-500 to-orange-600">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-white/90 text-sm">Welcome back!</p>
                  <p className="text-white font-semibold">{user?.email}</p>
                  <p className="text-white/80 text-xs mt-0.5">
                    {role || 'No role assigned'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="flex-1 px-4 pt-6 pb-safe">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto flex-col items-start justify-start bg-white rounded-2xl p-4 border-2 border-gray-200 text-left hover:border-orange-300 hover:bg-transparent transition-colors active:scale-95"
                >
                  <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-3`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <p className="font-medium text-gray-900">{feature.label}</p>
                </Button>
              )
            })}
          </div>

          {/* Settings Section */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h2>
            <Card className="border-2 border-gray-200">
              <CardContent className="p-0">
                <Button
                  onClick={() => setShowChangePassword(true)}
                  variant="ghost"
                  className="w-full h-auto flex items-center justify-between p-4 hover:bg-gray-50 transition-colors rounded-none"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                      <Lock className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Change Password</p>
                      <p className="text-sm text-gray-500">Update your password</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Safe Area */}
        <div className="safe-bottom" />
      </div>
    </ProtectedRoute>
  )
}