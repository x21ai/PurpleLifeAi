import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const THROTTLE_MS = 3 * 60 * 60 * 1000; // 3h

/**
 * On app open, if the user has Oura connected and their sync mode is "visit"
 * (the default), kick a background incremental sync, but only when the last
 * sync is older than 3 hours. Silent on success; failures go to the console.
 *
 * Other modes are not handled here: "interval" syncs run on the server cron,
 * "pull" syncs on the pull-to-refresh gesture, and "manual" only on the Sync
 * button. Manual and pull are user-initiated and bypass this throttle.
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
        const { data: sess } = await supabase.auth.getSession();
        const uid = sess.session?.user.id;
        if (!uid) return;

        const { data: tok } = await supabase
          .from("oura_tokens")
          .select("sync_mode, last_sync_at, updated_at")
          .eq("user_id", uid)
          .maybeSingle();
        if (!tok) return; // not connected

        // Only the on-open ("visit") mode syncs here. Treat a missing value as
        // the default so freshly connected accounts sync on open.
        const mode = (tok as { sync_mode?: string }).sync_mode ?? "visit";
        if (mode !== "visit") return;

        const lastIso = tok.last_sync_at ?? tok.updated_at;
        const last = lastIso ? new Date(lastIso).getTime() : 0;
        if (Date.now() - last < THROTTLE_MS) return; // synced within the last 3h

        if (cancelled) return;
        const { error } = await supabase.functions.invoke("oura-sync", {
          body: { action: "incremental" },
        });
        if (error) {
          console.warn("Oura on-open sync failed:", error.message ?? error);
        }
      } catch (e) {
        console.warn("Oura on-open sync error:", e);
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
