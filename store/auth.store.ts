import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { mmkv } from "@/lib/mmkv";
import { STORAGE_KEYS } from "@/constants/storage";

interface User {
  id: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: user !== null,
        }),

      signOut: () =>
        set({
          user: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: STORAGE_KEYS.AUTH,
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
