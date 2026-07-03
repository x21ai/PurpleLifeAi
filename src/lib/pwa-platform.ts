/**
 * PWA and mobile platform detection shared by install prompts and keyboard workarounds.
 */

export function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && typeof document !== "undefined" && "ontouchend" in document)
  );
}

/** iOS Safari is the only iOS browser that can add to the home screen. */
export function isIOSSafari(): boolean {
  if (!isIOS()) return false;
  return !/CriOS|FxiOS|EdgiOS|OPiOS/.test(navigator.userAgent);
}

/** iOS Chrome, Firefox, Edge, etc. Cannot install PWAs to the home screen. */
export function isIOSNonSafari(): boolean {
  return isIOS() && !isIOSSafari();
}

export function isAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

export type InstallCapability =
  | { kind: "native-prompt" }
  | { kind: "ios-safari-manual" }
  | { kind: "ios-open-safari" }
  | { kind: "none" };

/** What install UX is possible on this device/browser. */
export function installCapability(): InstallCapability {
  if (isStandalonePwa()) return { kind: "none" };
  if (isIOSNonSafari()) return { kind: "ios-open-safari" };
  if (isIOSSafari()) return { kind: "ios-safari-manual" };
  if (isAndroid() || !isIOS()) return { kind: "native-prompt" };
  return { kind: "none" };
}
