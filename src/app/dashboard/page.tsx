"use client"

import useAuthStore from '@/stores/auth-store'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { 
  User, 
  ChefHat, 
  FileText, 
  Package, 
  Clock,
  Settings
} from 'lucide-react'

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const router = useRouter()

  const managerFeatures = [
    { icon: FileText, label: 'Reports', color: 'bg-purple-100 text-purple-600', href: '' },
    { icon: Package, label: 'Inventory', color: 'bg-orange-100 text-orange-600', href: '' },
    { icon: Settings, label: 'Settings', color: 'bg-gray-100 text-gray-600', href: '/settings' },
  ]

  const employeeFeatures = [
    { icon: Clock, label: 'Clock In/Out', color: 'bg-blue-100 text-blue-600', href: '' },
    { icon: Package, label: 'Orders', color: 'bg-purple-100 text-purple-600', href: '' },
    { icon: Settings, label: 'Settings', color: 'bg-orange-100 text-orange-600', href: '/settings' },
  ]

  const features = user?.role === 'Manager' ? managerFeatures : employeeFeatures

  return (
    <AppLayout>
      {/* Material Design User Info Card */}
      <div className="p-4">
        <Card className="shadow-md bg-gradient-to-r from-orange-500 to-orange-600 border-0">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <User className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white/90 text-sm font-medium">Welcome back</p>
                <p className="text-white text-lg font-semibold mt-1">{user?.email}</p>
                <p className="text-white/80 text-sm mt-0.5 capitalize">
                  {user?.role || 'No role assigned'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Material Design Quick Actions */}
      <div className="px-4 pb-4">
        <h2 className="text-xl font-medium text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card
                key={index}
                className="shadow-md border-0 hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-95"
                onClick={() => feature.href && router.push(feature.href)}
              >
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <p className="font-medium text-gray-900 text-base">{feature.label}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </AppLayout>
  )
}