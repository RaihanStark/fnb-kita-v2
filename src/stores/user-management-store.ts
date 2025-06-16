import { create } from 'zustand';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'Manager' | 'Employee';
  lastLogin: string | null;
  createdAt: string | null;
  // Additional user details
  nama?: string;
  kontak?: string;
  posisi?: string;
  gaji?: {
    perBulan: number;
    perMinggu: number;
    perHari: number;
  };
  status?: 'active' | 'inactive' | 'suspended';
  limitReimbursement?: {
    [key: string]: number; // e.g., { internet: 500000, transport: 1000000 }
  };
}

interface UserManagementState {
  users: User[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    search: string;
    role: '' | 'Manager' | 'Employee';
  };
  selectedUser: User | null;
  showRoleChangeDialog: boolean;
  updatingRole: boolean;
  showUserDetailDialog: boolean;
  userDetail: User | null;
  loadingUserDetail: boolean;
  updatingUserDetail: boolean;
  
  // Actions
  setUsers: (users: User[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPagination: (pagination: Partial<UserManagementState['pagination']>) => void;
  setSearch: (search: string) => void;
  setRoleFilter: (role: '' | 'Manager' | 'Employee') => void;
  setSelectedUser: (user: User | null) => void;
  setShowRoleChangeDialog: (show: boolean) => void;
  setUpdatingRole: (updating: boolean) => void;
  updateUserRole: (userId: string, newRole: 'Manager' | 'Employee') => void;
  fetchUsers: () => Promise<void>;
  setShowUserDetailDialog: (show: boolean) => void;
  setUserDetail: (user: User | null) => void;
  fetchUserDetail: (userId: string) => Promise<void>;
  updateUserDetail: (userId: string, updates: Partial<User>) => Promise<void>;
}

export const useUserManagementStore = create<UserManagementState>((set, get) => ({
  users: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  filters: {
    search: '',
    role: '',
  },
  selectedUser: null,
  showRoleChangeDialog: false,
  updatingRole: false,
  showUserDetailDialog: false,
  userDetail: null,
  loadingUserDetail: false,
  updatingUserDetail: false,

  setUsers: (users) => set({ users }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setPagination: (pagination) => set((state) => ({
    pagination: { ...state.pagination, ...pagination },
  })),
  setSearch: (search) => set((state) => ({
    filters: { ...state.filters, search },
    pagination: { ...state.pagination, page: 1 }, // Reset to first page on search
  })),
  setRoleFilter: (role) => set((state) => ({
    filters: { ...state.filters, role },
    pagination: { ...state.pagination, page: 1 }, // Reset to first page on filter
  })),
  setSelectedUser: (user) => set({ selectedUser: user }),
  setShowRoleChangeDialog: (show) => set({ showRoleChangeDialog: show }),
  setUpdatingRole: (updating) => set({ updatingRole: updating }),
  setShowUserDetailDialog: (show) => set({ showUserDetailDialog: show }),
  setUserDetail: (user) => set({ userDetail: user }),

  updateUserRole: (userId, newRole) => {
    set((state) => ({
      users: state.users.map((user) =>
        user.uid === userId ? { ...user, role: newRole } : user
      ),
    }));
  },

  fetchUsers: async () => {
    const state = get();
    set({ loading: true, error: null });

    try {
      const params = new URLSearchParams({
        page: state.pagination.page.toString(),
        limit: state.pagination.limit.toString(),
        search: state.filters.search,
        role: state.filters.role,
      });

      const response = await fetch(`/api/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${await getIdToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      set({
        users: data.users,
        pagination: data.pagination,
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An error occurred',
        loading: false,
      });
    }
  },

  fetchUserDetail: async (userId: string) => {
    set({ loadingUserDetail: true, error: null });

    try {
      const response = await fetch(`/api/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${await getIdToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user details');
      }

      const data = await response.json();
      set({
        userDetail: data.user,
        loadingUserDetail: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An error occurred',
        loadingUserDetail: false,
      });
    }
  },

  updateUserDetail: async (userId: string, updates: Partial<User>) => {
    set({ updatingUserDetail: true, error: null });

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${await getIdToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update user details');
      }

      const data = await response.json();
      
      // Update the user in the list
      set((state) => ({
        users: state.users.map((user) =>
          user.uid === userId ? { ...user, ...updates } : user
        ),
        userDetail: data.user,
        updatingUserDetail: false,
        showUserDetailDialog: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An error occurred',
        updatingUserDetail: false,
      });
    }
  },
}));

// Helper function to get the ID token (will be imported from auth store)
async function getIdToken(): Promise<string> {
  const authStore = (await import('./auth-store')).default;
  const user = authStore.getState().user;
  if (!user) throw new Error('No user logged in');
  return user.getIdToken();
}