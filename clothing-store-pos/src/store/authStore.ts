import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, UserRole, mockUsers } from '@/auth/mockAuth'; // Using path alias

interface AuthState {
  isAuthenticated: boolean;
  currentUser: User | null;
  login: (username tentativo: string, password tentativo: string) => Promise<boolean>;
  logout: () => void;
  // For testing, allow setting user directly
  _setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      currentUser: null,
      login: async (username, password) => {
        const user = mockUsers.find(
          (u) => u.username === username && u.password === password
        );
        if (user) {
          set({ isAuthenticated: true, currentUser: user });
          return true;
        }
        set({ isAuthenticated: false, currentUser: null });
        return false;
      },
      logout: () => {
        set({ isAuthenticated: false, currentUser: null });
      },
      _setUser: (user) => { // For easier testing or direct manipulation if needed initially
        if (user) {
          set({ isAuthenticated: true, currentUser: user });
        } else {
          set({ isAuthenticated: false, currentUser: null });
        }
      }
    }),
    {
      name: 'auth-storage', // Name of the item in storage (localStorage by default)
      storage: createJSONStorage(() => localStorage), // Or sessionStorage
    }
  )
);

// Selector to easily get the current user's role
export const useCurrentUserRole = (): UserRole | undefined => {
  return useAuthStore((state) => state.currentUser?.role);
};
