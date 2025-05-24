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
    <div className="fixed bottom-6 left-6 right-6 z-50 safe-bottom">
      <nav className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-1">
        <div className="grid grid-cols-2 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = pathname.startsWith(tab.href)
            
            return (
              <button
                key={tab.href}
                onClick={() => router.push(tab.href)}
                className={cn(
                  "flex flex-col items-center justify-center py-4 px-6 rounded-3xl transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:ring-offset-2",
                  isActive 
                    ? "bg-orange-600 text-white shadow-lg scale-105" 
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                )}
              >
                <Icon 
                  className={cn(
                    "w-5 h-5 mb-2 transition-all duration-200",
                    isActive ? "text-white" : "text-gray-400"
                  )}
                />
                <span 
                  className={cn(
                    "text-xs font-semibold tracking-wide transition-all duration-200",
                    isActive ? "text-white" : "text-gray-400"
                  )}
                >
                  {tab.name}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}