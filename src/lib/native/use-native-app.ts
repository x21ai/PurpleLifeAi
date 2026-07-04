import { useEffect, useState } from "react";
import { isNativeApp } from "./capacitor";

/**
 * Detect Capacitor iOS/Android shell (bridge may inject after first paint on server.url).
 * Returns null while detecting, then true/false.
 */
function detectNativeSync(): boolean | null {
  if (typeof window === "undefined") return null;
  if (isNativeApp()) return true;
  if ((window as unknown as { Capacitor?: unknown }).Capacitor) return null;
  // server.url WebViews inject the bridge shortly after first paint.
  const mobile = /iPhone|iPod|iPad|Android/i.test(navigator.userAgent);
  const onProd =
    window.location.hostname === "www.purplelife.org" ||
    window.location.hostname === "purplelife.org";
  if (mobile && onProd) return null;
  return false;
}

export function useNativeApp(): boolean | null {
  const [native, setNative] = useState<boolean | null>(detectNativeSync);

  useEffect(() => {
    if (native !== null) return;
    const detect = () => isNativeApp();
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (detect()) {
        setNative(true);
        window.clearInterval(timer);
      } else if (attempts >= 20) {
        setNative(false);
        window.clearInterval(timer);
      }
    }, 50);
    return () => window.clearInterval(timer);
  }, [native]);

  return native;
}
