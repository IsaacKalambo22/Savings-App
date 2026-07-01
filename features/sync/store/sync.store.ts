import { create } from "zustand";
import { SyncStatus, SyncState } from "@/types/sync";
import { getQueueSize } from "../services/sync-queue.service";
import { isOnline } from "../services/network.service";
import { initializeSync, triggerManualSync } from "../services/sync.service";

interface SyncStore extends SyncState {
  setStatus: (status: SyncStatus) => void;
  setLastSyncTime: (time: Date) => void;
  setPendingItems: (count: number) => void;
  setIsOnline: (online: boolean) => void;
  refreshPendingCount: () => void;
  manualSync: () => Promise<void>;
}

export const useSyncStore = create<SyncStore>((set, get) => ({
  status: "synced",
  lastSyncTime: undefined,
  pendingItems: 0,
  isOnline: true,

  setStatus: (status) => set({ status }),

  setLastSyncTime: (time) => set({ lastSyncTime: time }),

  setPendingItems: (count) => set({ pendingItems: count }),

  setIsOnline: (online) => set({ isOnline: online }),

  refreshPendingCount: () => {
    const count = getQueueSize();
    set({ pendingItems: count });
  },

  manualSync: async () => {
    set({ status: "syncing" });
    try {
      await triggerManualSync();
      set({ status: "synced", lastSyncTime: new Date() });
      get().refreshPendingCount();
    } catch (error) {
      set({ status: "error" });
      throw error;
    }
  },
}));

/**
 * Initialize sync in the app
 */
export function initializeAppSync() {
  const store = useSyncStore.getState();
  
  // Set initial online status
  store.setIsOnline(isOnline());
  
  // Initialize sync service
  initializeSync((status) => {
    store.setStatus(status);
    if (status === "synced") {
      store.setLastSyncTime(new Date());
      store.refreshPendingCount();
    }
  });
  
  // Refresh pending count
  store.refreshPendingCount();
}
