"use client"

import { usePathname, useRouter } from 'next/navigation'
import { Home, Settings, ShoppingCart, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    name: 'Transaksi',
    href: '/transactions',
    icon: ShoppingCart,
    isMain: true,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

export function BottomNavigation() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <nav className="bg-white border-t border-gray-200">
        <div className="flex items-center justify-around h-16 px-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = pathname.startsWith(tab.href)
            
            return (
              <button
                key={tab.href}
                onClick={() => router.push(tab.href)}
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-3 relative transition-all duration-200 min-w-0",
                  "focus:outline-none"
                )}
              >
                  <div className="flex flex-col items-center gap-1 px-3 py-1 transition-all duration-200">
                    <Icon 
                      className={cn(
                        "w-6 h-6 transition-all duration-200",
                        isActive ? "text-orange-600" : "text-gray-600"
                      )}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    <span 
                      className={cn(
                        "text-xs font-medium transition-all duration-200 whitespace-nowrap",
                        isActive ? "text-orange-600" : "text-gray-600"
                      )}
                    >
                      {tab.name}
                    </span>
                  </div>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}