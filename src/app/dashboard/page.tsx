"use client"

import { useState, useEffect } from 'react'
import useAuthStore from '@/stores/auth-store'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { 
  User, 
  ChefHat, 
  FileText, 
  Package, 
  Clock,
  Settings,
  ClipboardCheck,
  AlertCircle
} from 'lucide-react'
import { openingProcedureService } from '@/lib/services/opening-procedure'

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const router = useRouter()
  const [hasOngoingOpening, setHasOngoingOpening] = useState(false)

  useEffect(() => {
    // Check if there's an ongoing opening procedure from API
    checkOpeningStatus()
  }, [])

  const checkOpeningStatus = async () => {
    try {
      const result = await openingProcedureService.checkTodayOpening()
      if (result.hasOpening && result.opening && !result.opening.completed) {
        setHasOngoingOpening(true)
      }
    } catch (error) {
      console.error('Error checking opening status:', error)
    }
  }

  const managerFeatures = [
    { icon: ClipboardCheck, label: 'Opening', color: 'bg-green-100 text-green-600', href: '/procedures/opening' },
    { icon: FileText, label: 'Reports', color: 'bg-purple-100 text-purple-600', href: '' },
    { icon: Package, label: 'Inventory', color: 'bg-orange-100 text-orange-600', href: '' },
    { icon: Settings, label: 'Settings', color: 'bg-gray-100 text-gray-600', href: '/settings' },
  ]

  const employeeFeatures = [
    { icon: ClipboardCheck, label: 'Opening', color: 'bg-green-100 text-green-600', href: '/procedures/opening' },
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

      {/* Ongoing Opening Alert */}
      {hasOngoingOpening && (
        <div className="px-4 pb-4">
          <Alert className="border-amber-200 bg-amber-50">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <AlertTitle className="text-amber-800 font-semibold mb-1">
                  Prosedur Pembukaan Belum Selesai
                </AlertTitle>
                <AlertDescription className="text-amber-700 text-sm">
                  Anda memiliki prosedur pembukaan yang belum diselesaikan. Lanjutkan untuk menyelesaikan proses pembukaan hari ini.
                </AlertDescription>
                <Button 
                  size="sm" 
                  className="mt-3 bg-amber-600 hover:bg-amber-700"
                  onClick={() => router.push('/procedures/opening')}
                >
                  Lanjutkan Pembukaan
                </Button>
              </div>
            </div>
          </Alert>
        </div>
      )}

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