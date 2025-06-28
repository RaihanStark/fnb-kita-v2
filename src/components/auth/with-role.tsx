"use client"

import { ComponentType } from 'react'
import { UserRole } from '@/stores/auth-store'
import { ProtectedRoute } from './protected-route'

export function withRole<P extends object>(
  Component: ComponentType<P>,
  allowedRoles: UserRole[]
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute allowedRoles={allowedRoles}>
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}