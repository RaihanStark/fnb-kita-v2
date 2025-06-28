"use client"

import { ReactNode, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface FABProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'tertiary' | 'surface'
  size?: 'small' | 'medium' | 'large'
  extended?: boolean
  className?: string
  disabled?: boolean
  elevation?: 'lowered' | 'default' | 'elevated'
}

const FAB = forwardRef<HTMLButtonElement, FABProps>(
  ({ 
    children, 
    onClick, 
    variant = 'primary', 
    size = 'medium', 
    extended = false,
    className,
    disabled = false,
    elevation = 'default',
    ...props 
  }, ref) => {
    return (
      <button
        ref={ref}
        onClick={onClick}
        disabled={disabled}
        className={cn(
          // Base styles
          "inline-flex items-center justify-center font-medium transition-all duration-300 ease-out",
          "focus:outline-none focus:ring-4 focus:ring-opacity-30",
          "hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
          "relative overflow-hidden",
          "transform-gpu", // Hardware acceleration
          
          // Size variants
          size === 'small' && [
            extended ? "h-10 px-4 min-w-20" : "h-10 w-10",
            "text-sm gap-2"
          ],
          size === 'medium' && [
            extended ? "h-14 px-4 min-w-24" : "h-14 w-14",
            "text-base gap-2"
          ],
          size === 'large' && [
            extended ? "h-16 px-6 min-w-28" : "h-16 w-16", 
            "text-lg gap-3"
          ],
          
          // Shape - always rounded-full for Material Design 3
          "rounded-full",
          
          // Elevation and shadow with better Material Design 3 shadows
          elevation === 'lowered' && "shadow-md",
          elevation === 'default' && "shadow-lg hover:shadow-xl",
          elevation === 'elevated' && "shadow-xl hover:shadow-2xl",
          
          // Color variants following Material Design 3 color system
          variant === 'primary' && [
            "bg-orange-600 text-white",
            "hover:bg-orange-700 hover:shadow-xl",
            "focus:ring-orange-200",
            "active:bg-orange-800",
            // State layer for hover/focus
            "before:absolute before:inset-0 before:rounded-full before:bg-white before:opacity-0 before:transition-opacity before:duration-150",
            "hover:before:opacity-10 focus:before:opacity-10 active:before:opacity-20"
          ],
          variant === 'secondary' && [
            "bg-orange-100 text-orange-700 border border-orange-200",
            "hover:bg-orange-200 hover:shadow-xl",
            "focus:ring-orange-100",
            "active:bg-orange-300"
          ],
          variant === 'tertiary' && [
            "bg-gray-100 text-gray-700 border border-gray-200",
            "hover:bg-gray-200 hover:shadow-xl", 
            "focus:ring-gray-100",
            "active:bg-gray-300"
          ],
          variant === 'surface' && [
            "bg-white text-gray-700 border border-gray-200",
            "hover:bg-gray-50 hover:shadow-xl",
            "focus:ring-gray-100",
            "active:bg-gray-100"
          ],
          
          className
        )}
        {...props}
      >
        {/* Ripple effect overlay */}
        <div className="absolute inset-0 rounded-full opacity-0 hover:opacity-10 active:opacity-20 transition-opacity duration-150 bg-white pointer-events-none" />
        
        {children}
      </button>
    )
  }
)

FAB.displayName = "FAB"

export { FAB }