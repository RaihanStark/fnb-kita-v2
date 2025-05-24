"use client"

import { usePathname, useRouter } from 'next/navigation'
import { Home, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    name: 'Reimbursements',
    href: '/reimbursements',
    icon: DollarSign,
  },
]

export function BottomNavigation() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-100 safe-bottom z-50">
      <div className="grid grid-cols-2 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = pathname.startsWith(tab.href)
          
          return (
            <button
              key={tab.href}
              onClick={() => router.push(tab.href)}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-3 relative transition-all duration-200",
                "hover:bg-orange-50 active:scale-95",
                isActive && "bg-orange-50"
              )}
            >
              {/* Material Design Active Indicator */}
              {isActive && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-orange-600 rounded-full" />
              )}
              
              <Icon 
                className={cn(
                  "w-6 h-6 mb-1 transition-colors",
                  isActive ? "text-orange-600" : "text-gray-600"
                )}
              />
              <span 
                className={cn(
                  "text-xs font-medium transition-colors",
                  isActive ? "text-orange-600" : "text-gray-600"
                )}
              >
                {tab.name}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}