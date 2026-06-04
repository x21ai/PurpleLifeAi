import { CloudOff, RefreshCw } from "lucide-react";
import { useOfflineJournalSync } from "@/hooks/use-offline-journal-sync";

export function OfflineQueueBanner() {
  const { queued, flush } = useOfflineJournalSync();
  if (queued === 0) return null;
  const online = typeof navigator !== "undefined" ? navigator.onLine : true;
  return (
    <div className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-300/60 bg-amber-50/40 px-4 py-3 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
      <CloudOff className="h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1 text-xs">
        <p className="font-medium">
          {queued} entr{queued === 1 ? "y" : "ies"} waiting to sync
        </p>
        <p className="opacity-80">
          {online
            ? "Tap to sync now."
            : "We'll send them as soon as you're back online."}
        </p>
      </div>
      {online && (
        <button
          onClick={() => void flush()}
          className="inline-flex items-center gap-1 rounded-full border border-amber-400/60 px-2.5 py-1 text-xs hover:bg-amber-100/50 dark:hover:bg-amber-900/40"
        >
          <RefreshCw className="h-3 w-3" /> Sync
        </button>
      )}
    </div>
  );
}