import { useCallback, useEffect, useState, type ReactNode } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const PING_TIMEOUT_MS = 8000;

async function canReachPurple(): Promise<boolean> {
  if (!navigator.onLine) return false;

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
  try {
    const res = await fetch("/", { method: "GET", cache: "no-store", signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timer);
  }
}

/**
 * Full-screen retry when the production site is unreachable inside the native WebView.
 * Required for App Store review: hybrid apps must handle offline gracefully.
 */
export function NativeConnectivityGate({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState<boolean | null>(() =>
    typeof navigator !== "undefined" && !navigator.onLine ? false : null,
  );
  const [checking, setChecking] = useState(false);

  const check = useCallback(async () => {
    setChecking(true);
    const ok = await canReachPurple();
    setOnline(ok);
    setChecking(false);
  }, []);

  useEffect(() => {
    void check();
    const onOnline = () => void check();
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [check]);

  if (online === false) {
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
        <Button className="mt-6 min-w-[10rem]" onClick={() => void check()} disabled={checking}>
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
