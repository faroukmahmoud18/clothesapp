import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, UserRole, mockUsers } from '@/auth/mockAuth'; // Using path alias

interface AuthState {
  isAuthenticated: boolean;
  currentUser: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  // For testing, allow setting user directly
  _setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, _get) => ({ // Renamed get to _get as it's not used in this specific store setup
      isAuthenticated: false,
      currentUser: null,
      login: async (username, password) => {
        const user = mockUsers.find(
          (u) => u.username === username && u.password === password
        );
        if (user) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { password: _removedPassword, ...userWithoutPassword } = user;
          set({ isAuthenticated: true, currentUser: userWithoutPassword as User }); // Cast back to User type
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
