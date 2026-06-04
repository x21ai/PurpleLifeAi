import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  flushOfflineJournalQueue,
  getQueuedEntries,
} from "@/lib/offline-journal-queue";

/**
 * Watches connectivity and the queue, flushes pending entries when online,
 * and exposes the current queued count for UI banners.
 */
export function useOfflineJournalSync() {
  const [queued, setQueued] = useState<number>(() => getQueuedEntries().length);

  const refresh = useCallback(() => {
    setQueued(getQueuedEntries().length);
  }, []);

  const flush = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    const before = getQueuedEntries().length;
    if (before === 0) return;
    const { sent, failed } = await flushOfflineJournalQueue();
    refresh();
    if (sent > 0) {
      toast.success(`Synced ${sent} offline entr${sent === 1 ? "y" : "ies"}`);
    }
    if (failed > 0) {
      toast.error(`Could not sync ${failed} offline entr${failed === 1 ? "y" : "ies"}`);
    }
  }, [refresh]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    refresh();
    const onOnline = () => void flush();
    const onChange = () => refresh();
    window.addEventListener("online", onOnline);
    window.addEventListener("purple:offline-journal-changed", onChange);
    // Best-effort flush on mount if we came back already online
    void flush();
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("purple:offline-journal-changed", onChange);
    };
  }, [flush, refresh]);

  return { queued, flush };
}