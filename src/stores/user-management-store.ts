import { create } from 'zustand';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'Manager' | 'Employee';
  lastLogin: string | null;
  createdAt: string | null;
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
}));

// Helper function to get the ID token (will be imported from auth store)
async function getIdToken(): Promise<string> {
  const { default: authStore } = await import('./auth-store');
  const user = authStore.getState().user;
  if (!user) throw new Error('No user logged in');
  return user.getIdToken();
}