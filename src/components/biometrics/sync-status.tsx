import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { formatDistanceToNow, format, isValid } from "date-fns";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { WEARABLE_PROVIDERS } from "@/lib/wearable-sync";
import { whoopIncrementalSync } from "@/lib/whoop.functions";

type Props = {
  /** Compact = single line, suitable for the Today tile. Default detailed. */
  variant?: "compact" | "detailed";
  /** Called after a successful manual sync so parents can refresh data. */
  onSynced?: () => void;
  /** Bump to force a re-read (e.g. after the page pull-to-refresh syncs). */
  refreshSignal?: number;
  className?: string;
};

/**
 * Multi-provider wearable sync status + Sync now button.
 *  - dataThrough: latest biometrics.recorded_at across Oura + Whoop
 *  - lastPulled: most recent last_sync_at across connected pull providers,
 *    and apple_health_tokens.last_webhook_at if Apple Health is connected
 *  - Sync now triggers every connected pull provider (Oura + Whoop) in
 *    parallel via Promise.allSettled. Apple Health is push-only and skipped.
 */
export function WearableSyncStatus({ variant = "detailed", onSynced, refreshSignal, className }: Props) {
  const whoopSync = useServerFn(whoopIncrementalSync);
  const [connected, setConnected] = useState<Record<string, boolean>>({});
  const [appleConnected, setAppleConnected] = useState(false);
  const [dataThrough, setDataThrough] = useState<string | null>(null);
  const [lastPulled, setLastPulled] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) {
      setLoaded(true);
      return;
    }
    const uid = sess.session.user.id;
    const tokenRows = await Promise.all(
      WEARABLE_PROVIDERS.map(async (p) => {
        const { data } = await supabase
          .from(p.tokensTable)
          .select("updated_at, last_sync_at")
          .eq("user_id", uid)
          .maybeSingle();
        return { id: p.id, row: data as { last_sync_at?: string | null; updated_at?: string | null } | null };
      }),
    );
    const sources = WEARABLE_PROVIDERS.map((p) => p.id);
    const [{ data: bio }, { data: apple }] = await Promise.all([
      supabase
        .from("biometrics")
        .select("recorded_at")
        .eq("user_id", uid)
        .in("source", sources)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("apple_health_tokens")
        .select("last_webhook_at, updated_at")
        .eq("user_id", uid)
        .maybeSingle(),
    ]);

    const connMap: Record<string, boolean> = {};
    const stamps: number[] = [];
    for (const { id, row } of tokenRows) {
      connMap[id] = !!row;
      const ts = row?.last_sync_at ?? row?.updated_at ?? null;
      if (ts) stamps.push(new Date(ts).getTime());
    }
    setConnected(connMap);
    setAppleConnected(!!apple);
    const appleTs = apple?.last_webhook_at ?? null;
    if (appleTs) stamps.push(new Date(appleTs).getTime());
    const latest = stamps.length ? Math.max(...stamps) : null;
    setLastPulled(latest ? new Date(latest).toISOString() : null);
    setDataThrough(bio?.recorded_at ?? null);
    setLoaded(true);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, refreshSignal]);

  const sync = async () => {
    if (busy) return;
    const active = WEARABLE_PROVIDERS.filter((p) => connected[p.id]);
    if (active.length === 0) {
      if (appleConnected) toast.info("Apple Health pushes automatically");
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
            return Promise.resolve(whoopSync()).then(() => undefined);
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
      await refresh();
      onSynced?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Sync failed";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  if (!loaded) return null;
  const anyPullConnected = WEARABLE_PROVIDERS.some((p) => connected[p.id]);
  if (!anyPullConnected && !appleConnected) return null;

  const dataDate = dataThrough && isValid(new Date(dataThrough)) ? new Date(dataThrough) : null;
  const pulledDate = lastPulled && isValid(new Date(lastPulled)) ? new Date(lastPulled) : null;
  const showButton = anyPullConnected;

  if (variant === "compact") {
    return (
      <div className={"flex items-center gap-2 text-[11px] text-muted-foreground " + (className ?? "")}>
        <span className="flex flex-col leading-tight">
          <span>
            {pulledDate ? `Last sync ${formatDistanceToNow(pulledDate, { addSuffix: true })}` : "Never synced"}
          </span>
          {dataDate && (
            <span className="text-muted-foreground/70">
              Latest data {formatDistanceToNow(dataDate, { addSuffix: true })}
            </span>
          )}
        </span>
        {showButton && (
          <button
            type="button"
            onClick={() => void sync()}
            disabled={busy}
            aria-label="Sync wearables now"
            className="inline-flex items-center justify-center h-6 w-6 rounded-full hover:bg-secondary disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={"flex items-center justify-between gap-3 " + (className ?? "")}>
      <div className="min-w-0 leading-tight">
        <p className="text-[11px] text-muted-foreground">
          Data through{" "}
          <span className="text-foreground/80">
            {dataDate ? format(dataDate, "EEE h:mm a") : "–"}
          </span>
        </p>
        <p className="text-[11px] text-muted-foreground">
          Last pulled{" "}
          <span className="text-foreground/80">
            {pulledDate ? formatDistanceToNow(pulledDate, { addSuffix: true }) : "never"}
          </span>
        </p>
      </div>
      {showButton && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => void sync()}
          disabled={busy}
          aria-label="Sync wearables now"
          className="shrink-0 h-8"
        >
          {busy ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              Syncing
            </>
          ) : (
            <>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Sync now
            </>
          )}
        </Button>
      )}
    </div>
  );
}

/** Back-compat alias; prefer WearableSyncStatus going forward. */
export const OuraSyncStatus = WearableSyncStatus;