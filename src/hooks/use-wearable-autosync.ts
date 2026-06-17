import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { whoopIncrementalSync } from "@/lib/whoop.functions";
import {
  WEARABLE_PROVIDERS,
  SYNC_THROTTLE_MS,
  type WearableProvider,
} from "@/lib/wearable-sync";

/**
 * On app open, for each connected pull-based wearable whose sync mode is
 * "visit" (the default), kick a background incremental sync, but only when the
 * last sync is older than the 3h throttle. Silent on success.
 *
 * Other modes are not handled here: "interval" runs on the server cron, "pull"
 * on the pull-to-refresh gesture, and "manual" on the Sync button. Manual and
 * pull are user-initiated and bypass this throttle.
 *
 * Mounted at the root so it fires shortly after the user authenticates.
 */
export function useWearableAutoSync() {
  const whoopSync = useServerFn(whoopIncrementalSync);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    const trigger = async (id: WearableProvider["id"]) => {
      if (id === "oura") {
        await supabase.functions.invoke("oura-sync", { body: { action: "incremental" } });
      } else if (id === "whoop") {
        await whoopSync();
      }
    };

    async function run() {
      try {
        const { data: sess } = await supabase.auth.getSession();
        const uid = sess.session?.user.id;
        if (!uid) return;

        for (const provider of WEARABLE_PROVIDERS) {
          if (cancelled) return;
          const { data: tok } = await supabase
            .from(provider.tokensTable)
            .select("sync_mode, last_sync_at, updated_at")
            .eq("user_id", uid)
            .maybeSingle();
          if (!tok) continue; // not connected

          // Only the on-open ("visit") mode syncs here. Treat a missing value
          // as the default so freshly connected accounts sync on open.
          const mode = (tok as { sync_mode?: string }).sync_mode ?? "visit";
          if (mode !== "visit") continue;

          const lastIso = tok.last_sync_at ?? tok.updated_at;
          const last = lastIso ? new Date(lastIso).getTime() : 0;
          if (Date.now() - last < SYNC_THROTTLE_MS) continue;

          try {
            await trigger(provider.id);
          } catch (e) {
            console.warn(`${provider.label} on-open sync failed:`, e);
          }
        }
      } catch (e) {
        console.warn("Wearable on-open sync error:", e);
      }
    }

    // Defer slightly so we don't compete with the initial auth bootstrap.
    const timer = setTimeout(() => void run(), 2_000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [whoopSync]);
}
