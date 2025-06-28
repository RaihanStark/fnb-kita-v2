import { create } from 'zustand';
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { Reimbursement } from '@/lib/firebase/reimbursement-service';

interface ReimbursementFilters {
  status?: string;
  employeeId?: string;
  startDate?: Date;
  endDate?: Date;
}

interface ReimbursementStats {
  total: number;
  pending: number;
  approved: number;
  denied: number;
  paid: number;
  totalAmount: number;
  paidAmount: number;
}

interface ReimbursementStore {
  // List state
  reimbursements: Reimbursement[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  
  // Filters
  filters: ReimbursementFilters;
  
  // Form state
  formData: Partial<Omit<Reimbursement, 'id' | 'submittedDate' | 'status'>>;
  submitting: boolean;
  
  // Stats
  stats: ReimbursementStats | null;
  loadingStats: boolean;
  
  // Selected reimbursement
  selectedReimbursement: Reimbursement | null;
  
  // Actions
  fetchReimbursements: (userRole: string, userId: string, reset?: boolean) => Promise<void>;
  fetchReimbursement: (id: string) => Promise<void>;
  submitReimbursement: (data: Omit<Reimbursement, 'id' | 'submittedDate' | 'status'>) => Promise<string>;
  updateStatus: (id: string, status: 'approved' | 'denied' | 'paid', managerId: string, comments?: string) => Promise<void>;
  uploadReceiptFile: (reimbursementId: string, file: File) => Promise<string>;
  fetchStats: (userId?: string) => Promise<void>;
  setFilters: (filters: ReimbursementFilters) => void;
  resetFilters: () => void;
  setFormData: (data: Partial<Omit<Reimbursement, 'id' | 'submittedDate' | 'status'>>) => void;
  resetFormData: () => void;
  reset: () => void;
}

const initialFormData: Partial<Omit<Reimbursement, 'id' | 'submittedDate' | 'status'>> = {
  amount: 0,
  expenseType: 'personal',
  category: '',
  description: '',
};

const useReimbursementStore = create<ReimbursementStore>((set, get) => ({
  // Initial state
  reimbursements: [],
  loading: false,
  error: null,
  hasMore: false,
  lastDoc: null,
  filters: {},
  formData: initialFormData,
  submitting: false,
  stats: null,
  loadingStats: false,
  selectedReimbursement: null,

  // Fetch reimbursements with pagination
  fetchReimbursements: async (userRole: string, userId: string, reset = false) => {
    try {
      set({ loading: true, error: null });
      
      const { filters, lastDoc } = get();
      
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.employeeId) params.append('employeeId', filters.employeeId);
      if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
      if (!reset && lastDoc?.id) params.append('lastDocId', lastDoc.id);
      
      const token = await getIdToken();
      console.log('Fetching reimbursements with token:', token ? 'Token exists' : 'No token');
      
      const response = await fetch(`/api/reimbursements?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error('Failed to fetch reimbursements');
      }

      const data = await response.json();
      
      set((state) => ({
        reimbursements: reset 
          ? data.reimbursements 
          : [...state.reimbursements, ...data.reimbursements],
        lastDoc: data.lastDocId ? { id: data.lastDocId } as QueryDocumentSnapshot<DocumentData> : null,
        hasMore: data.hasMore,
        loading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch reimbursements',
        loading: false 
      });
    }
  },

  // Fetch single reimbursement
  fetchReimbursement: async (id: string) => {
    try {
      set({ loading: true, error: null });
      
      const response = await fetch(`/api/reimbursements/${id}`, {
        headers: {
          'Authorization': `Bearer ${await getIdToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reimbursement');
      }

      const reimbursement = await response.json();
      set({ 
        selectedReimbursement: reimbursement,
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch reimbursement',
        loading: false 
      });
    }
  },

  // Submit new reimbursement
  submitReimbursement: async (data: Omit<Reimbursement, 'id' | 'submittedDate' | 'status'>) => {
    try {
      set({ submitting: true, error: null });
      
      const response = await fetch('/api/reimbursements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getIdToken()}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to submit reimbursement');
      }

      const result = await response.json();
      set({ 
        submitting: false,
        formData: initialFormData 
      });
      return result.id;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to submit reimbursement',
        submitting: false 
      });
      throw error;
    }
  },

  // Update reimbursement status (Manager only)
  updateStatus: async (id: string, status: 'approved' | 'denied' | 'paid', managerId: string, comments?: string) => {
    try {
      set({ loading: true, error: null });
      
      const response = await fetch(`/api/reimbursements/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getIdToken()}`,
        },
        body: JSON.stringify({
          status,
          managerComments: comments
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }
      
      // Update local state
      set((state) => ({
        reimbursements: state.reimbursements.map((r) =>
          r.id === id
            ? {
                ...r,
                status,
                processedBy: managerId,
                processedDate: new Date(),
                managerComments: comments || r.managerComments,
                paidDate: status === 'paid' ? new Date() : r.paidDate
              }
            : r
        ),
        selectedReimbursement: state.selectedReimbursement?.id === id
          ? {
              ...state.selectedReimbursement,
              status,
              processedBy: managerId,
              processedDate: new Date(),
              managerComments: comments || state.selectedReimbursement.managerComments,
              paidDate: status === 'paid' ? new Date() : state.selectedReimbursement.paidDate
            }
          : state.selectedReimbursement,
        loading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update status',
        loading: false 
      });
      throw error;
    }
  },

  // Upload receipt - Note: This is handled directly in the component
  uploadReceiptFile: async (_reimbursementId: string, _file: File) => {
    // This method is kept for interface compatibility
    // The actual upload is handled in the component using the API endpoint
    throw new Error('Receipt upload should be handled directly in the component');
  },

  // Fetch statistics
  fetchStats: async (userId?: string) => {
    try {
      set({ loadingStats: true });
      
      // For now, calculate stats from the fetched reimbursements
      // In a real app, you might want to add a dedicated API endpoint for stats
      const { reimbursements } = get();
      const userReimbursements = userId 
        ? reimbursements.filter(r => r.employeeId === userId)
        : reimbursements;
      
      const stats = {
        total: userReimbursements.length,
        pending: userReimbursements.filter(r => r.status === 'pending').length,
        approved: userReimbursements.filter(r => r.status === 'approved').length,
        denied: userReimbursements.filter(r => r.status === 'denied').length,
        paid: userReimbursements.filter(r => r.status === 'paid').length,
        totalAmount: userReimbursements.reduce((sum, r) => sum + r.amount, 0),
        paidAmount: userReimbursements
          .filter(r => r.status === 'paid')
          .reduce((sum, r) => sum + r.amount, 0),
      };
      
      set({ stats, loadingStats: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch statistics',
        loadingStats: false 
      });
    }
  },

  // Filter actions
  setFilters: (filters: ReimbursementFilters) => {
    set({ filters });
  },

  resetFilters: () => {
    set({ filters: {} });
  },

  // Form actions
  setFormData: (data: Partial<Omit<Reimbursement, 'id' | 'submittedDate' | 'status'>>) => {
    set((state) => ({
      formData: { ...state.formData, ...data }
    }));
  },

  resetFormData: () => {
    set({ formData: initialFormData });
  },

  // Reset store
  reset: () => {
    set({
      reimbursements: [],
      loading: false,
      error: null,
      hasMore: false,
      lastDoc: null,
      filters: {},
      formData: initialFormData,
      submitting: false,
      stats: null,
      loadingStats: false,
      selectedReimbursement: null
    });
  }
}));

// Helper function to get the ID token
async function getIdToken(): Promise<string> {
  const authStore = (await import('./auth-store')).default;
  const user = authStore.getState().user;
  if (!user) throw new Error('No user logged in');
  return user.getIdToken();
}

export default useReimbursementStore;
