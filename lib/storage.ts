import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const memoryStorage = new Map<string, string>();

export const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          return window.localStorage.getItem(key);
        }
      } catch (e) {
        console.warn("localStorage not available, falling back to memory:", e);
      }
      return memoryStorage.get(key) ?? null;
    }

    try {
      return await SecureStore.getItemAsync(key);
    } catch (e) {
      console.warn("SecureStore.getItemAsync error:", e);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") {
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.setItem(key, value);
          return;
        }
      } catch (e) {
        console.warn("localStorage not available, saving to memory:", e);
      }
      memoryStorage.set(key, value);
      return;
    }

    try {
      await SecureStore.setItemAsync(key, value);
    } catch (e) {
      console.warn("SecureStore.setItemAsync error:", e);
    }
  },

  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === "web") {
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.removeItem(key);
          return;
        }
      } catch (e) {
        console.warn("localStorage not available, removing from memory:", e);
      }
      memoryStorage.delete(key);
      return;
    }

    try {
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      console.warn("SecureStore.deleteItemAsync error:", e);
    }
  },
};
