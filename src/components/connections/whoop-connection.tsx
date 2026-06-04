import { useEffect, useState, useCallback } from "react";
import { Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { getWhoopConfig, whoopIncrementalSync } from "@/lib/whoop.functions";
import { toast } from "sonner";

// Whoop OAuth scopes (v2 API). `offline` is required to receive a refresh token.
const WHOOP_SCOPE = [
  "read:recovery",
  "read:cycles",
  "read:sleep",
  "read:workout",
  "read:profile",
  "read:body_measurement",
  "offline",
].join(" ");

type Counts = { recovery: number; sleep: number; strain: number };

function relativeTime(iso: string | null): string {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

export function WhoopConnection() {
  const fetchConfig = useServerFn(getWhoopConfig);
  const runIncrementalSync = useServerFn(whoopIncrementalSync);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [interval, setIntervalHours] = useState<number>(12);
  const [counts, setCounts] = useState<Counts>({ recovery: 0, sleep: 0, strain: 0 });
  const [busy, setBusy] = useState(false);
  const [backfilling, setBackfilling] = useState(false);

  const refresh = useCallback(async () => {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) return;
    const uid = sess.session.user.id;
    const { data } = await supabase
      .from("whoop_tokens")
      .select("updated_at, last_sync_at, sync_interval_hours")
      .eq("user_id", uid)
      .maybeSingle();
    setConnected(!!data);
    setLastSync(data?.last_sync_at ?? data?.updated_at ?? null);
    if (data?.sync_interval_hours != null) setIntervalHours(data.sync_interval_hours);

    if (data) {
      const since = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString();
      const [recovery, sleep, strain] = await Promise.all([
        supabase.from("biometrics").select("id", { count: "exact", head: true })
          .eq("user_id", uid).eq("source", "whoop").gte("recorded_at", since)
          .not("whoop_recovery_pct", "is", null),
        supabase.from("biometrics").select("id", { count: "exact", head: true })
          .eq("user_id", uid).eq("source", "whoop").gte("recorded_at", since)
          .not("sleep_total_min", "is", null),
        supabase.from("biometrics").select("id", { count: "exact", head: true })
          .eq("user_id", uid).eq("source", "whoop").gte("recorded_at", since)
          .not("whoop_strain", "is", null),
      ]);
      setCounts({
        recovery: recovery.count ?? 0,
        sleep: sleep.count ?? 0,
        strain: strain.count ?? 0,
      });
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === "whoop-connected") {
        toast.success("Whoop connected. Backfilling 30 days…");
        setBackfilling(true);
        void refresh();
        let n = 0;
        const id = window.setInterval(() => {
          n++;
          void refresh();
          if (n >= 15) {
            window.clearInterval(id);
            setBackfilling(false);
          }
        }, 2000);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [refresh]);

  const connect = async () => {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) { toast.error("Please sign in first"); return; }
    let cfg: { client_id: string | null };
    try {
      cfg = (await fetchConfig()) as { client_id: string | null };
    } catch (e) {
      console.error("[whoop] config error", e);
      toast.error("Couldn't reach Whoop sync service. Please try again.");
      return;
    }
    if (!cfg?.client_id) {
      toast.error(
        "Whoop isn't configured yet. Add WHOOP_CLIENT_ID and WHOOP_CLIENT_SECRET in backend settings.",
        { duration: 6000 },
      );
      return;
    }
    const redirect = window.location.origin + "/oauth/whoop/callback";
    const url = new URL("https://api.prod.whoop.com/oauth/oauth2/auth");
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", cfg.client_id);
    url.searchParams.set("redirect_uri", redirect);
    url.searchParams.set("scope", WHOOP_SCOPE);
    url.searchParams.set("state", sess.session.user.id);
    const w = 520, h = 720;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;
    window.open(url.toString(), "whoop-oauth",
      `width=${w},height=${h},left=${left},top=${top}`);
  };

  const sync = async () => {
    setBusy(true);
    try {
      await runIncrementalSync();
      toast.success("Synced");
      void refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setBusy(false);
    }
  };

  const updateInterval = async (v: string) => {
    const hours = Number(v);
    setIntervalHours(hours);
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) return;
    const { error } = await supabase.from("whoop_tokens")
      .update({ sync_interval_hours: hours })
      .eq("user_id", sess.session.user.id);
    if (error) toast.error("Could not save preference");
    else toast.success(hours === 0 ? "Auto-sync off" : `Sync every ${hours === 1 ? "hour" : `${hours} hours`}`);
  };

  const disconnect = async () => {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) return;
    await supabase.from("whoop_tokens").delete().eq("user_id", sess.session.user.id);
    setConnected(false);
    setLastSync(null);
    setCounts({ recovery: 0, sleep: 0, strain: 0 });
    toast("Whoop disconnected");
  };

  if (connected) {
    return (
      <div className="py-2 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="rounded-full bg-secondary p-2 text-secondary-foreground shrink-0">
              <Heart className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="font-serif text-base text-foreground">Whoop</p>
              <p className="text-xs text-muted-foreground">
                {backfilling
                  ? `Importing… ${counts.recovery} recovery · ${counts.sleep} sleep · ${counts.strain} strain`
                  : (
                    <>
                      Connected
                      <span className="block sm:inline sm:before:content-['_·_']">
                        Last synced {relativeTime(lastSync)}
                      </span>
                    </>
                  )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={() => void sync()} disabled={busy || backfilling}>
              {busy || backfilling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Sync"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => void disconnect()}>Disconnect</Button>
          </div>
        </div>
        {!backfilling && (
          <div className="pl-11 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-muted-foreground">
              Last 90 days · {counts.recovery} recovery · {counts.sleep} sleep · {counts.strain} strain
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Auto-sync</span>
              <Select value={String(interval)} onValueChange={(v) => void updateInterval(v)}>
                <SelectTrigger className="h-8 w-[150px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Every hour</SelectItem>
                  <SelectItem value="6">Every 6 hours</SelectItem>
                  <SelectItem value="12">Every 12 hours</SelectItem>
                  <SelectItem value="24">Every 24 hours</SelectItem>
                  <SelectItem value="0">Manual only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex items-center gap-3 min-w-0">
        <span className="rounded-full bg-secondary p-2 text-secondary-foreground shrink-0">
          <Heart className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="font-serif text-base text-foreground">Whoop</p>
          <p className="text-xs text-muted-foreground truncate">
            {connected === null ? "\u00a0" : "Recovery, strain, sleep, HRV"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button size="sm" onClick={() => void connect()}>Connect</Button>
      </div>
    </div>
  );
}