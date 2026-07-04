import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  isNativeApp,
  nativeAppBuildInfo,
  nativeBridgeReady,
  nativePlatform,
  type NativeBuildInfo,
} from "@/lib/native/capacitor";
import {
  DIAGNOSTICS_OPEN_EVENT,
  DIAGNOSTICS_UPDATED_EVENT,
  getLastCapturedError,
  getLastSyncError,
  type CapturedClientError,
} from "@/lib/observability/client-errors";

type NativeDiagnosticsPanelProps = {
  showAccountTrigger: boolean;
  forceOpen: boolean;
};

function formatTimestamp(iso: string | undefined): string {
  if (!iso) return "none";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleString();
}

export function NativeDiagnosticsPanel({
  showAccountTrigger,
  forceOpen,
}: NativeDiagnosticsPanelProps) {
  const native = isNativeApp();
  const [open, setOpen] = useState(false);
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [buildInfo, setBuildInfo] = useState<NativeBuildInfo>({
    platform: nativePlatform(),
    version: null,
    build: null,
  });
  const [lastError, setLastError] = useState<CapturedClientError | null>(() =>
    getLastCapturedError(),
  );
  const [lastSyncError, setLastSyncError] = useState<CapturedClientError | null>(() =>
    getLastSyncError(),
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!native) return;
    let cancelled = false;
    void nativeAppBuildInfo().then((info) => {
      if (!cancelled) setBuildInfo(info);
    });
    return () => {
      cancelled = true;
    };
  }, [native]);

  useEffect(() => {
    const refresh = () => {
      setLastError(getLastCapturedError());
      setLastSyncError(getLastSyncError());
    };
    refresh();
    window.addEventListener(DIAGNOSTICS_UPDATED_EVENT, refresh as EventListener);
    return () => {
      window.removeEventListener(DIAGNOSTICS_UPDATED_EVENT, refresh as EventListener);
    };
  }, []);

  useEffect(() => {
    const openPanel = () => setOpen(true);
    window.addEventListener(DIAGNOSTICS_OPEN_EVENT, openPanel as EventListener);
    return () => {
      window.removeEventListener(DIAGNOSTICS_OPEN_EVENT, openPanel as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!forceOpen || !native) return;
    setOpen(true);
  }, [forceOpen, native]);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const diagnosticText = useMemo(
    () =>
      JSON.stringify(
        {
          platform: buildInfo.platform,
          version: buildInfo.version,
          build: buildInfo.build,
          bridgeReady: nativeBridgeReady(),
          connectivity: online ? "online" : "offline",
          lastSyncError,
          lastError,
          url: typeof window !== "undefined" ? window.location.href : "",
        },
        null,
        2,
      ),
    [buildInfo, lastError, lastSyncError, online],
  );

  const copyDiagnostics = async () => {
    try {
      await navigator.clipboard.writeText(diagnosticText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  if (!native) return null;

  return (
    <>
      {showAccountTrigger ? (
        <Button
          type="button"
          variant="outline"
          className="glass-press fixed bottom-20 right-4 z-40 min-h-11"
          onClick={() => setOpen(true)}
        >
          Diagnostics
        </Button>
      ) : null}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[min(94vw,360px)]">
          <SheetHeader>
            <SheetTitle>Native diagnostics</SheetTitle>
            <SheetDescription>Runtime details from this app session.</SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4 text-sm">
            <DiagnosticRow label="Platform" value={buildInfo.platform} />
            <DiagnosticRow label="App version" value={buildInfo.version ?? "unknown"} />
            <DiagnosticRow label="Build" value={buildInfo.build ?? "unknown"} />
            <DiagnosticRow label="Bridge ready" value={nativeBridgeReady() ? "yes" : "no"} />
            <DiagnosticRow label="Connectivity" value={online ? "online" : "offline"} />
            <DiagnosticRow
              label="Last sync error"
              value={lastSyncError?.message ?? "none this session"}
            />
            <DiagnosticRow
              label="Last sync error time"
              value={formatTimestamp(lastSyncError?.timestamp)}
            />
            <DiagnosticRow
              label="Last runtime error"
              value={lastError ? `${lastError.message} (${lastError.id})` : "none this session"}
            />
            <DiagnosticRow
              label="Last runtime error time"
              value={formatTimestamp(lastError?.timestamp)}
            />
          </div>

          <div className="mt-6 flex gap-2">
            <Button type="button" variant="outline" onClick={() => void copyDiagnostics()}>
              {copied ? "Copied" : "Copy diagnostics"}
            </Button>
            <a
              href={
                lastError?.id
                  ? `/contact?source=native-diagnostics&errorId=${encodeURIComponent(lastError.id)}`
                  : "/contact?source=native-diagnostics"
              }
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-input px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Contact support
            </a>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function DiagnosticRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="rounded-md bg-muted/70 px-3 py-2 text-foreground">{value}</p>
    </div>
  );
}
