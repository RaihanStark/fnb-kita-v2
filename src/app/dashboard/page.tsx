"use client"

import useAuthStore from '@/stores/auth-store'
import { AppLayout } from '@/components/layout/app-layout'
import { ChangePasswordForm } from '@/components/auth/change-password-form'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  User, 
  ChefHat, 
  Users, 
  FileText, 
  Package, 
  Clock,
  Settings,
  ChevronRight,
  Lock,
  DollarSign
} from 'lucide-react'

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const role = useAuthStore((state) => state.role)
  const router = useRouter()
  const [showChangePassword, setShowChangePassword] = useState(false)

  const managerFeatures = [
    { icon: Users, label: 'User Management', color: 'bg-blue-100 text-blue-600', href: '/dashboard/users' },
    { icon: DollarSign, label: 'Reimbursements', color: 'bg-green-100 text-green-600', href: '/reimbursements' },
    { icon: FileText, label: 'Reports', color: 'bg-purple-100 text-purple-600', href: '' },
    { icon: Package, label: 'Inventory', color: 'bg-orange-100 text-orange-600', href: '' },
  ]

  const employeeFeatures = [
    { icon: Clock, label: 'Clock In/Out', color: 'bg-blue-100 text-blue-600', href: '' },
    { icon: DollarSign, label: 'Reimbursements', color: 'bg-green-100 text-green-600', href: '/reimbursements' },
    { icon: Package, label: 'Orders', color: 'bg-purple-100 text-purple-600', href: '' },
    { icon: Settings, label: 'Settings', color: 'bg-orange-100 text-orange-600', href: '' },
  ]

  const features = role === 'Manager' ? managerFeatures : employeeFeatures

  if (showChangePassword) {
    return (
      <AppLayout title="Change Password" hideBottomNav>
        <div className="p-4">
          <div className="mb-4">
            <Button 
              onClick={() => setShowChangePassword(false)}
              variant="ghost"
              size="sm"
            >
              ← Back to Dashboard
            </Button>
          </div>
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
    <AppLayout>
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
      <div className="px-4 pt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Button
                key={index}
                variant="outline"
                onClick={() => feature.href && router.push(feature.href)}
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
    </AppLayout>
  )
}