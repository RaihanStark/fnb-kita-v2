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
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom z-50">
      <div className="grid grid-cols-2 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = pathname.startsWith(tab.href)
          
          return (
            <button
              key={tab.href}
              onClick={() => router.push(tab.href)}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-3 hover:bg-gray-50 transition-colors",
                isActive && "text-orange-600"
              )}
            >
              <Icon 
                className={cn(
                  "w-5 h-5 mb-1",
                  isActive ? "text-orange-600" : "text-gray-500"
                )}
              />
              <span 
                className={cn(
                  "text-xs",
                  isActive ? "text-orange-600 font-medium" : "text-gray-500"
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