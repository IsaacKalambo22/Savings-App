import { createClient } from "@supabase/supabase-js";
import { mmkv } from "./mmkv";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    const value = await mmkv.get(key);
    return value ?? null;
  },
  setItem: async (key: string, value: string) => {
    await mmkv.set(key, value);
  },
  removeItem: async (key: string) => {
    await mmkv.delete(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
