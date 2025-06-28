import { create } from 'zustand';
import { authApi } from '@/lib/api/auth';
import type { User } from '@/lib/db/schema';

export type UserRole = 'Manager' | 'Employee';

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  initialized: false,
  
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  
  login: async (email: string, password: string) => {
    try {
      set({ loading: true });
      const response = await authApi.login({ email, password });
      set({ user: response.user, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  
  logout: async () => {
    try {
      await authApi.logout();
      set({ user: null });
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails on server, clear local state
      set({ user: null });
    }
  },
  
  checkAuth: async () => {
    if (get().initialized) return;
    
    try {
      set({ loading: true });
      const response = await authApi.getMe();
      set({ user: response.user, loading: false, initialized: true });
    } catch (error: any) {
      // If unauthorized or any error, user is not logged in
      set({ user: null, loading: false, initialized: true });
      
      // If it's a 401, try to refresh token
      if (error.status === 401) {
        try {
          await authApi.refreshToken();
          // Retry getting user info
          const response = await authApi.getMe();
          set({ user: response.user });
        } catch {
          // Refresh failed, user needs to login again
        }
      }
    }
  },
}));

export default useAuthStore;