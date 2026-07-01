import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { mmkv } from "@/lib/mmkv";
import { STORAGE_KEYS } from "@/constants/storage";

type Theme = "light" | "dark" | "system";

interface UIState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: "system",

      setTheme: (theme) => {
        set({ theme });
      },

      isLoading: false,
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: STORAGE_KEYS.THEME,
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
