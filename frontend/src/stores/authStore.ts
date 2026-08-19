import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'rider' | 'driver' | 'admin';
  avatar?: string;
  rating: number;
  totalRides: number;
  isVerified: boolean;
  kycStatus?: 'pending' | 'approved' | 'rejected';
  isActive: boolean;
  isAvailable?: boolean;
  licenseNumber?: string;
  vehicleInfo?: {
    make: string;
    model: string;
    color: string;
    plateNumber: string;
    type: 'economy' | 'premium' | 'suv' | 'xl' | 'bike' | 'auto' | 'mini' | 'sedan';
    year?: number;
    seatingCapacity?: number;
  };
  earnings?: number;
  pendingPayouts?: number;
  totalLifetimeEarnings?: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  setAuth: (user: User, token: string) => void;
  updateUser: (updates: Partial<User>) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isHydrated: false,

      setAuth: (user, token) =>
        set({ user, token, isAuthenticated: true, isLoading: false, isHydrated: true }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      clearAuth: () =>
        set({ user: null, token: null, isAuthenticated: false, isHydrated: true }),

      setLoading: (isLoading) => set({ isLoading }),
      setHydrated: (isHydrated) => set({ isHydrated }),
    }),
    {
      name: 'rideshare-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated(true);
        }
      },
    }
  )
);
