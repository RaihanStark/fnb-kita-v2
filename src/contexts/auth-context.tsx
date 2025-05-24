"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from 'firebase/auth'
import { subscribeToAuthChanges, signOut as firebaseSignOut } from '@/lib/firebase/auth-client'
import { UserRole } from '@/lib/firebase/auth-service'

interface AuthContextType {
  user: User | null
  role: UserRole | null
  loading: boolean
  signOut: () => Promise<void>
  refreshRole: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserRole = async (user: User) => {
    try {
      const tokenResult = await user.getIdTokenResult()
      const customClaims = tokenResult.claims
      
      if (customClaims.role) {
        setRole(customClaims.role as UserRole)
      } else {
        setRole(null)
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
      setRole(null)
    }
  }

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (user) => {
      setUser(user)
      
      if (user) {
        await fetchUserRole(user)
      } else {
        setRole(null)
      }
      
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signOut = async () => {
    const { error } = await firebaseSignOut()
    if (error) {
      throw new Error(error)
    }
  }

  const refreshRole = async () => {
    if (user) {
      await fetchUserRole(user)
    }
  }

  const value = {
    user,
    role,
    loading,
    signOut,
    refreshRole,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}