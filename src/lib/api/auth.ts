import { api } from './client';
import type { User } from '@/lib/db/schema';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  message?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export const authApi = {
  // Login user
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    return api.post('/api/auth/login', credentials);
  },

  // Logout user
  logout: async (): Promise<void> => {
    await api.post('/api/auth/logout');
  },

  // Get current user
  getMe: async (): Promise<{ user: User }> => {
    return api.get('/api/auth/me');
  },

  // Refresh token
  refreshToken: async (): Promise<void> => {
    await api.post('/api/auth/refresh');
  },

  // Change password
  changePassword: async (data: ChangePasswordData): Promise<void> => {
    await api.post('/api/auth/change-password', data);
  },
};