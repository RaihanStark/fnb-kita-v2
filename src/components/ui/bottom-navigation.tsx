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
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200/50 safe-bottom z-50">
      <div className="grid grid-cols-2 h-20 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = pathname.startsWith(tab.href)
          
          return (
            <button
              key={tab.href}
              onClick={() => router.push(tab.href)}
              className={cn(
                "flex flex-col items-center justify-center py-3 px-4 m-1 rounded-2xl transition-all duration-300 ease-out",
                "focus:outline-none focus:ring-2 focus:ring-orange-500/20",
                isActive 
                  ? "bg-orange-500 text-white shadow-lg" 
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              )}
            >
              <Icon 
                className={cn(
                  "w-6 h-6 mb-1 transition-all duration-300",
                  isActive && "drop-shadow-sm"
                )}
              />
              <span 
                className={cn(
                  "text-xs font-medium transition-all duration-300",
                  isActive ? "text-white" : "text-gray-500"
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