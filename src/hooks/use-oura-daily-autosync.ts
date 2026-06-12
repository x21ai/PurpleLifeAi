import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const SESSION_FLAG = "purple.oura.autosync.attempted";
const STALE_AFTER_MS = 20 * 60 * 60 * 1000; // 20h

/**
 * Once per browser session, if the user has Oura connected and the last sync
 * is older than 20 hours, kick a background incremental sync. Silent on
 * success; only surfaces failures via console (no toast, this is invisible
 * housekeeping).
 *
 * Mounted at the root so it fires shortly after the user authenticates,
 * without re-firing on every route change.
 */
export function useOuraDailyAutoSync() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    async function maybeSync() {
      try {
        if (sessionStorage.getItem(SESSION_FLAG)) return;
        const { data: sess } = await supabase.auth.getSession();
        const uid = sess.session?.user.id;
        if (!uid) return;

        const { data: tok } = await supabase
          .from("oura_tokens")
          .select("last_sync_at, updated_at")
          .eq("user_id", uid)
          .maybeSingle();
        if (!tok) return; // not connected

        // Staleness comes from the last real sync only. updated_at also moves
        // on token refreshes, which silently disabled the daily sync.
        const row = tok as { last_sync_at?: string | null };
        const updated = row.last_sync_at ? new Date(row.last_sync_at).getTime() : 0;
        if (Date.now() - updated < STALE_AFTER_MS) return;

        sessionStorage.setItem(SESSION_FLAG, "1");
        if (cancelled) return;
        const { error } = await supabase.functions.invoke("oura-sync", {
          body: { action: "incremental" },
        });
        if (error) {
          // Clear the flag so the next session can retry.
          sessionStorage.removeItem(SESSION_FLAG);
          console.warn("Oura auto-sync failed:", error.message ?? error);
        }
      } catch (e) {
        console.warn("Oura auto-sync error:", e);
      }
    }

    // Defer slightly so we don't compete with the initial auth bootstrap.
    const timer = setTimeout(() => void maybeSync(), 2_000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);
}
