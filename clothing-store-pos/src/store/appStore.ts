// @/store/appStore.ts
import { create } from 'zustand';
import * as syncQueueManager from '@/sync/syncQueueManager';

interface AppState {
  isSyncing: boolean;
  lastSyncTimestamp: string | null;
  syncError: string | null;
  pendingQueueCount: number;
  setSyncing: (isSyncing: boolean) => void;
  setLastSyncTimestamp: (timestamp: string | null) => void;
  setSyncError: (error: string | null) => void;
  updatePendingQueueCount: () => Promise<void>; // Action to refresh count
  triggerSync: () => Promise<void>; // Action to process the queue
}

export const useAppStore = create<AppState>((set, get) => ({
  isSyncing: false,
  lastSyncTimestamp: null,
  syncError: null,
  pendingQueueCount: 0,

  setSyncing: (isSyncing) => set({ isSyncing }),
  setLastSyncTimestamp: (timestamp) => set({ lastSyncTimestamp: timestamp }),
  setSyncError: (error) => set({ syncError: error }),

  updatePendingQueueCount: async () => {
    try {
      const count = await syncQueueManager.getPendingQueueCount();
      set({ pendingQueueCount: count });
    } catch (error) {
      console.error("[AppStore] Failed to update pending queue count:", error);
      // Optionally set an error state related to fetching queue count if needed
    }
  },

  triggerSync: async () => {
    if (get().isSyncing) {
      console.log("[AppStore] Sync already in progress.");
      return;
    }
    set({ isSyncing: true, syncError: null });
    console.log("[AppStore] Triggering sync queue processing...");
    try {
      const result = await syncQueueManager.processQueue();
      console.log("[AppStore] Sync processing complete:", result);
      set({
        lastSyncTimestamp: new Date().toISOString(),
        // syncError: result.failureCount > 0 ? `Sync completed with ${result.failureCount} errors.` : null
        // Decided to only show critical error from processQueue itself, not partial failures as 'syncError'
      });
      if (result.failureCount > 0) {
          // Handle notification of partial failure if desired, e.g. toast
          console.warn(`[AppStore] Sync finished with ${result.failureCount} items still failing.`);
      }
    } catch (error: any) {
      console.error("[AppStore] Critical error during sync processing:", error);
      set({ syncError: error.message || "A critical error occurred during sync." });
    } finally {
      set({ isSyncing: false });
      get().updatePendingQueueCount(); // Refresh count after sync attempt
    }
  },
}));

// Initialize pending queue count when store is created (app starts)
useAppStore.getState().updatePendingQueueCount();
