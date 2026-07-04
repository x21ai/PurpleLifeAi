import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNativeAppContext } from "@/lib/native-app-context";
import {
  clearLastNativeLaunchIssue,
  getLastNativeLaunchIssue,
  isNativeDiagnosticsEnabled,
  onNativeDiagFlagChange,
  onNativeLaunchIssueChange,
  type NativeLaunchIssue,
} from "@/lib/native";

function formatWhen(value: string | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString();
}

/**
 * Tiny native-only strip to surface launch failures in debug/TestFlight.
 * Toggle manually in any environment with ?diag=1.
 */
export function NativeLaunchDiagnosticStrip() {
  const { isNativeApp } = useNativeAppContext();
  const [issue, setIssue] = useState<NativeLaunchIssue | null>(() => getLastNativeLaunchIssue());
  const [diagEnabled, setDiagEnabled] = useState<boolean>(() => isNativeDiagnosticsEnabled());

  useEffect(() => onNativeLaunchIssueChange(setIssue), []);
  useEffect(() => onNativeDiagFlagChange(setDiagEnabled), []);

  if (!issue || !diagEnabled || !isNativeApp) {
    return null;
  }

  const lastSeen = formatWhen(issue.at);
  const detail = issue.error ?? issue.url ?? issue.code;

  return (
    <div
      className="pointer-events-auto fixed inset-x-3 top-[calc(env(safe-area-inset-top)+8px)] z-[120] mx-auto w-auto max-w-[44rem] rounded-xl border border-amber-500/35 bg-zinc-950/95 px-3 py-2 text-[12px] text-zinc-100 shadow-xl backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="font-medium text-amber-100">{issue.message}</div>
          {detail ? <div className="mt-0.5 truncate text-zinc-300">{detail}</div> : null}
          <div className="mt-1 text-[11px] text-zinc-400">
            {issue.build ? `Build ${issue.build}` : "Build unknown"}
            {lastSeen ? ` | ${lastSeen}` : ""}
          </div>
        </div>
        <div className="ml-1 flex shrink-0 items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-7 px-2 text-[11px]"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="mr-1 h-3 w-3" aria-hidden />
            Retry
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-zinc-400 hover:text-zinc-100"
            onClick={() => {
              clearLastNativeLaunchIssue();
              setIssue(null);
            }}
            aria-label="Dismiss diagnostics"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}
