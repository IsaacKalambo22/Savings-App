import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { mmkv } from "@/lib/mmkv";
import { STORAGE_KEYS } from "@/constants/storage";

interface AppState {
  householdId: string | null;
  onboardingDone: boolean;
  isOnline: boolean;
  lastSyncedAt: string | null;

  setHouseholdId: (id: string) => void;
  setOnboardingDone: (done: boolean) => void;
  setOnline: (online: boolean) => void;
  setLastSyncedAt: (date: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      householdId: null,
      onboardingDone: false,
      isOnline: true,
      lastSyncedAt: null,

      setHouseholdId: (id) => {
        set({ householdId: id });
      },

      setOnboardingDone: (done) => {
        set({ onboardingDone: done });
      },

      setOnline: (isOnline) => set({ isOnline }),

      setLastSyncedAt: (date) => {
        set({ lastSyncedAt: date });
      },
    }),
    {
      name: STORAGE_KEYS.APP_STATE,
      storage: createJSONStorage(() => ({
        setItem: async (name, value) => {
          await mmkv.set(name, JSON.stringify(value));
        },
        getItem: async (name) => {
          const value = await mmkv.get(name);
          return value ? JSON.parse(value) : null;
        },
        removeItem: async (name) => {
          await mmkv.delete(name);
        },
      })),
    }
  )
);
