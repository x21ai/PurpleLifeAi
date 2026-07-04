import { useCallback, useEffect, useState, type ReactNode } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const PING_TIMEOUT_MS = 2500;

async function canReachPurple(): Promise<boolean> {
  if (!navigator.onLine) return false;

  async function ping(method: "HEAD" | "GET"): Promise<boolean> {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
    try {
      const res = await fetch("/", {
        method,
        cache: "no-store",
        signal: controller.signal,
      });
      return res.ok || res.status === 405;
    } catch {
      return false;
    } finally {
      window.clearTimeout(timer);
    }
  }

  if (await ping("HEAD")) return true;
  return ping("GET");
}

/**
 * Full-screen retry when the production site is unreachable inside the native WebView.
 * Required for App Store review: hybrid apps must handle offline gracefully.
 */
export function NativeConnectivityGate({ children }: { children: ReactNode }) {
  const [showOffline, setShowOffline] = useState(
    () => typeof navigator !== "undefined" && !navigator.onLine,
  );
  const [checking, setChecking] = useState(false);

  /** Soft checks recover silently; strict checks (retry button) show the offline screen. */
  const check = useCallback(async (strict = false) => {
    if (!navigator.onLine) {
      setShowOffline(true);
      return false;
    }
    setChecking(true);
    const ok = await canReachPurple();
    setChecking(false);
    if (ok) {
      setShowOffline(false);
    } else if (strict) {
      setShowOffline(true);
    }
    return ok;
  }, []);

  useEffect(() => {
    void check(false);
    const onOnline = () => void check(false);
    const onOffline = () => setShowOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [check]);

  if (showOffline) {
    return (
      <div
        className="native-connectivity-offline flex min-h-dvh flex-col items-center justify-center bg-background px-8 text-center"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <WifiOff className="h-8 w-8" aria-hidden />
        </div>
        <h1 className="mt-6 font-serif text-xl text-foreground">Cannot reach Purple</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Check your internet connection. Purple needs network access to load your journal and
          health data.
        </p>
        <Button
          className="glass-press touch-manipulation mt-6 min-h-11 min-w-[10rem]"
          onClick={() => void check(true)}
          disabled={checking}
        >
          {checking ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            "Try again"
          )}
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
