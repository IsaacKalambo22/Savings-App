import * as SecureStore from "expo-secure-store";

export const mmkv = {
  set: async (key: string, value: string) => {
    await SecureStore.setItemAsync(key, value);
  },
  get: async (key: string) => {
    return await SecureStore.getItemAsync(key);
  },
  delete: async (key: string) => {
    await SecureStore.deleteItemAsync(key);
  },
  clear: async () => {
    // expo-secure-store doesn't have a clear method, so we'd need to track keys
    // For now, this is a no-op
  },
};
