import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { formatDistanceToNow, format, isValid } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Props = {
  /** Compact = single line, suitable for the Today tile. Default detailed. */
  variant?: "compact" | "detailed";
  /** Called after a successful manual sync so parents can refresh data. */
  onSynced?: () => void;
  className?: string;
};

/**
 * Two timestamps:
 *  - dataThrough: latest biometrics.recorded_at (the day the data is for)
 *  - lastPulled: oura_tokens.last_sync_at (when a sync actually ran)
 * Plus a "Sync now" button that calls the oura-sync edge function.
 */
export function OuraSyncStatus({ variant = "detailed", onSynced, className }: Props) {
  const [connected, setConnected] = useState<boolean>(false);
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
    const [{ data: tok }, { data: bio }] = await Promise.all([
      supabase
        .from("oura_tokens")
        // last_sync_at is the actual pull; updated_at also moves on token
        // refreshes, which made stale data look freshly pulled.
        .select("last_sync_at")
        .eq("user_id", uid)
        .maybeSingle(),
      supabase
        .from("biometrics")
        .select("recorded_at")
        .eq("user_id", uid)
        .eq("source", "oura")
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    setConnected(!!tok);
    setLastPulled((tok as { last_sync_at?: string | null } | null)?.last_sync_at ?? null);
    setDataThrough(bio?.recorded_at ?? null);
    setLoaded(true);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const sync = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const { error } = await supabase.functions.invoke("oura-sync", {
        body: { action: "incremental" },
      });
      if (error) throw error;
      toast.success("Synced from Oura");
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
  if (!connected) return null;

  const dataDate = dataThrough && isValid(new Date(dataThrough)) ? new Date(dataThrough) : null;
  const pulledDate = lastPulled && isValid(new Date(lastPulled)) ? new Date(lastPulled) : null;

  // One truth (Devyn item 10): when the DATA is stale (>24h), lead with that
  // and never pair a fresh-sounding "Last sync just now" with old data.
  const dataStale = dataDate != null && Date.now() - dataDate.getTime() > 24 * 60 * 60 * 1000;

  if (variant === "compact") {
    return (
      <div
        className={"flex items-center gap-2 text-[11px] text-muted-foreground " + (className ?? "")}
      >
        <span className="flex flex-col leading-tight">
          {dataStale ? (
            <span className="text-[color:var(--data-warn)]">
              No new Oura data since {formatDistanceToNow(dataDate, { addSuffix: true })}
            </span>
          ) : (
            <span>
              {pulledDate
                ? `Last sync ${formatDistanceToNow(pulledDate, { addSuffix: true })}`
                : "Never synced"}
            </span>
          )}
          {dataDate && !dataStale && (
            <span className="text-muted-foreground/70">
              Latest data {formatDistanceToNow(dataDate, { addSuffix: true })}
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={() => void sync()}
          disabled={busy}
          aria-label="Sync Oura now"
          className="inline-flex items-center justify-center h-6 w-6 rounded-full hover:bg-secondary disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
        </button>
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
      <Button
        size="sm"
        variant="outline"
        onClick={() => void sync()}
        disabled={busy}
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
    </div>
  );
}
