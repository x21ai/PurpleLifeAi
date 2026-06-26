import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { WEARABLE_PROVIDERS } from "@/lib/wearable-sync";
import { whoopIncrementalSync } from "@/lib/whoop.functions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/** Event other surfaces can listen to in order to refresh after a header sync. */
export const WEARABLE_SYNCED_EVENT = "purple:wearable-synced";

/**
 * Compact wearable sync icon-button for the top header bar. Renders nothing
 * when the user has no pull-based wearable connected. Apple Health is
 * push-only and intentionally not triggered here.
 */
export function HeaderSyncButton() {
  const whoopSync = useServerFn(whoopIncrementalSync);
  const [connected, setConnected] = useState<Record<string, boolean>>({});
  const [appleConnected, setAppleConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) {
      setLoaded(true);
      return;
    }
    const uid = sess.session.user.id;
    const [tokenRows, apple] = await Promise.all([
      Promise.all(
        WEARABLE_PROVIDERS.map(async (p) => {
          const { data } = await supabase
            .from(p.tokensTable)
            .select("user_id")
            .eq("user_id", uid)
            .maybeSingle();
          return [p.id, !!data] as const;
        }),
      ),
      supabase
        .from("apple_health_tokens")
        .select("user_id")
        .eq("user_id", uid)
        .maybeSingle(),
    ]);
    setConnected(Object.fromEntries(tokenRows));
    setAppleConnected(!!apple.data);
    setLoaded(true);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const sync = async () => {
    if (busy) return;
    const active = WEARABLE_PROVIDERS.filter((p) => connected[p.id]);
    if (active.length === 0) {
      if (appleConnected) {
        toast.info("Apple Health pushes automatically, no manual sync needed");
      } else {
        toast.info("Connect a wearable in Tools to sync data");
      }
      return;
    }
    setBusy(true);
    try {
      const results = await Promise.allSettled(
        active.map((p) => {
          if (p.id === "oura") {
            return supabase.functions
              .invoke("oura-sync", { body: { action: "incremental" } })
              .then(({ error }) => {
                if (error) throw error;
              });
          }
          if (p.id === "whoop") {
            return Promise.resolve(whoopSync()).then((r) => {
              if (r && (r as { ok?: boolean }).ok === false) {
                throw new Error(
                  (r as { message?: string }).message ??
                    "Whoop session expired. Reconnect in Settings.",
                );
              }
            });
          }
          return Promise.resolve();
        }),
      );
      const ok: string[] = [];
      const failed: string[] = [];
      results.forEach((r, i) => {
        (r.status === "fulfilled" ? ok : failed).push(active[i].label);
      });
      if (ok.length && !failed.length) toast.success(`Synced ${ok.join(", ")}`);
      else if (ok.length && failed.length)
        toast.warning(`Synced ${ok.join(", ")}; ${failed.join(", ")} failed`);
      else toast.error(`Sync failed: ${failed.join(", ")}`);
      if (appleConnected) toast.info("Apple Health pushes automatically");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(WEARABLE_SYNCED_EVENT));
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Sync failed";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  if (!loaded) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => void sync()}
            disabled={busy}
            aria-label="Sync wearable data"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50 transition-colors"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Sync wearable data</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
