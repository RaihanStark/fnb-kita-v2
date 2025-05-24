import { create } from 'zustand'
import { User } from 'firebase/auth'
import { subscribeToAuthChanges, signOut as firebaseSignOut } from '@/lib/firebase/auth-client'
import { UserRole } from '@/lib/firebase/auth-service'

interface AuthState {
  user: User | null
  role: UserRole | null
  loading: boolean
  signOut: () => Promise<void>
  refreshRole: () => Promise<void>
  setUser: (user: User | null) => void
  setRole: (role: UserRole | null) => void
  setLoading: (loading: boolean) => void
  initialize: () => () => void
}

const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  role: null,
  loading: true,
  
  setUser: (user) => set({ user }),
  setRole: (role) => set({ role }),
  setLoading: (loading) => set({ loading }),
  
  signOut: async () => {
    const { error } = await firebaseSignOut()
    if (error) {
      throw new Error(error)
    }
  },
  
  refreshRole: async () => {
    const { user } = get()
    if (user) {
      try {
        const tokenResult = await user.getIdTokenResult()
        const customClaims = tokenResult.claims
        
        if (customClaims.role) {
          set({ role: customClaims.role as UserRole })
        } else {
          set({ role: null })
        }
      } catch (error) {
        console.error('Error fetching user role:', error)
        set({ role: null })
      }
    }
  },
  
  initialize: () => {
    const unsubscribe = subscribeToAuthChanges(async (user) => {
      set({ user })
      
      if (user) {
        try {
          const tokenResult = await user.getIdTokenResult()
          const customClaims = tokenResult.claims
          
          if (customClaims.role) {
            set({ role: customClaims.role as UserRole })
          } else {
            set({ role: null })
          }
        } catch (error) {
          console.error('Error fetching user role:', error)
          set({ role: null })
        }
      } else {
        set({ role: null })
      }
      
      set({ loading: false })
    })
    
    return unsubscribe
  }
}))

export default useAuthStore