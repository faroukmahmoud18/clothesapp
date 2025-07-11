import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, UserRole, mockUsers } from '@/auth/mockAuth'; // Using path alias
import { Branch } from '@/pos/types'; // Import Branch type

// Mock branches for now
export const mockBranches: Branch[] = [
  { id: 'branch_001', name: 'Main Street Flagship', location: '123 Main St, Cityville', contactPhone: '555-0101' },
  { id: 'branch_002', name: 'Downtown Central', location: '456 Central Ave, Cityville', contactPhone: '555-0102' },
  { id: 'branch_003', name: 'Westside Mall Kiosk', location: '789 Mall Rd, Westside', contactPhone: '555-0103' },
];

interface AuthState {
  isAuthenticated: boolean;
  currentUser: User | null;
  currentBranchId: string | null; // Store the ID of the currently selected branch
  availableBranches: Branch[]; // List of branches available to the user (simplified for now)
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  setCurrentBranch: (branchId: string) => void;
  // For testing, allow setting user directly
  _setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({ // Changed _get to get
      isAuthenticated: false,
      currentUser: null,
      currentBranchId: null, // Default to no branch selected
      availableBranches: [], // Initially empty, populated on login or app start
      login: async (username, password) => {
        const user = mockUsers.find(
          (u) => u.username === username && u.password === password
        );
        if (user) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { password: _removedPassword, ...userWithoutPassword } = user;
          // Simulate fetching available branches for the user or all mock branches for now
          const branchesForUser = mockBranches; // Simplified: give all mock branches
          const defaultBranchId = branchesForUser.length > 0 ? branchesForUser[0].id : null;

          set({
            isAuthenticated: true,
            currentUser: userWithoutPassword as User,
            availableBranches: branchesForUser,
            currentBranchId: defaultBranchId, // Set a default branch
          });
          return true;
        }
        set({ isAuthenticated: false, currentUser: null, currentBranchId: null, availableBranches: [] });
        return false;
      },
      logout: () => {
        set({
          isAuthenticated: false,
          currentUser: null,
          currentBranchId: null,
          availableBranches: [],
        });
      },
      setCurrentBranch: (branchId) => {
        const { availableBranches } = get();
        if (availableBranches.some(branch => branch.id === branchId)) {
          set({ currentBranchId: branchId });
        } else {
          console.warn(`Attempted to set current branch to an unavailable branch ID: ${branchId}`);
        }
      },
      _setUser: (user) => { // For easier testing or direct manipulation if needed initially
        if (user) {
          // Simulate fetching available branches for the user
          const branchesForUser = mockBranches; // Simplified
          const defaultBranchId = branchesForUser.length > 0 ? branchesForUser[0].id : null;
          set({
            isAuthenticated: true,
            currentUser: user,
            availableBranches: branchesForUser,
            currentBranchId: defaultBranchId,
          });
        } else {
          set({ isAuthenticated: false, currentUser: null, currentBranchId: null, availableBranches: [] });
        }
      }
    }),
    {
      name: 'auth-storage', // Name of the item in storage (localStorage by default)
      storage: createJSONStorage(() => localStorage), // Or sessionStorage
      // Only persist parts of the state you want to keep after refresh
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        currentUser: state.currentUser,
        currentBranchId: state.currentBranchId,
        // availableBranches could be re-fetched or might be static for the session
        // For simplicity, we can persist it too, or re-evaluate if it should be dynamic
        availableBranches: state.availableBranches,
      }),
    }
  )
);

// Selector to easily get the current user's role
export const useCurrentUserRole = (): UserRole | undefined => {
  return useAuthStore((state) => state.currentUser?.role);
};

// Selector to get the currently selected branch details
export const useCurrentBranch = (): Branch | null => {
  const state = useAuthStore();
  if (!state.currentBranchId) return null;
  return state.availableBranches.find(branch => branch.id === state.currentBranchId) || null;
};
