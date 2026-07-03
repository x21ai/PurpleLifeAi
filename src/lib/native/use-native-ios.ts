import { useEffect, useState } from "react";
import { isNativeApp, nativePlatform } from "./capacitor";

/** True inside the Capacitor iOS shell (not Safari, not Android). */
export function isNativeIos(): boolean {
  return isNativeApp() && nativePlatform() === "ios";
}

/**
 * Wait for the Capacitor bridge on remote server.url WebViews (injected after first paint).
 * Returns null while detecting, then true/false.
 */
export function useNativeIos(): boolean | null {
  const [nativeIos, setNativeIos] = useState<boolean | null>(null);

  useEffect(() => {
    const detect = () => isNativeIos();
    if (detect()) {
      setNativeIos(true);
      return;
    }
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (detect()) {
        setNativeIos(true);
        window.clearInterval(timer);
      } else if (attempts >= 30) {
        setNativeIos(false);
        window.clearInterval(timer);
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, []);

  return nativeIos;
}
