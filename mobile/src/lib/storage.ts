import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
const previewMemory = new Map<string, string>();
// Browser builds are for UI review only; credentials never enter localStorage.
export const storage = {
  get: (key: string) =>
    Platform.OS === "web"
      ? Promise.resolve(previewMemory.get(key) ?? null)
      : SecureStore.getItemAsync(key),
  set: (key: string, value: string) =>
    Platform.OS === "web"
      ? Promise.resolve(void previewMemory.set(key, value))
      : SecureStore.setItemAsync(key, value, {
          keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        }),
  remove: (key: string) =>
    Platform.OS === "web"
      ? Promise.resolve(void previewMemory.delete(key))
      : SecureStore.deleteItemAsync(key),
};
