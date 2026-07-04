import { isNativeApp, nativePlatform } from "./capacitor";
import { useNativeApp } from "./use-native-app";

/** True inside the Capacitor iOS shell (not Safari, not Android). */
export function isNativeIos(): boolean {
  return isNativeApp() && nativePlatform() === "ios";
}

/**
 * Wait for the Capacitor bridge on remote server.url WebViews (injected after first paint).
 * Returns null while detecting, then true/false.
 */
export function useNativeIos(): boolean | null {
  const nativeApp = useNativeApp();
  if (nativeApp !== true) return nativeApp;
  return nativePlatform() === "ios";
}
