import { useEffect, useState, useCallback } from "react";
import { Activity, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Oura OAuth documented scopes. Keep the base set conservative until OAuth succeeds.
const OURA_SCOPE = "email personal daily heartrate workout tag session spo2";

type Counts = { sleep: number; readiness: number; activity: number };

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

export function OuraConnection() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [interval, setIntervalHours] = useState<number>(12);
  const [counts, setCounts] = useState<Counts>({ sleep: 0, readiness: 0, activity: 0 });
  const [busy, setBusy] = useState(false);
  const [backfilling, setBackfilling] = useState(false);

  const refresh = useCallback(async () => {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) return;
    const uid = sess.session.user.id;
    const { data } = await supabase
      .from("oura_tokens")
      .select("updated_at, sync_interval_hours")
      .eq("user_id", uid)
      .maybeSingle();
    setConnected(!!data);
    setLastSync(data?.updated_at ?? null);
    if (data?.sync_interval_hours != null) setIntervalHours(data.sync_interval_hours);

    if (data) {
      const since = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString();
      const base = supabase.from("biometrics").select("id", { count: "exact", head: true })
        .eq("user_id", uid).eq("source", "oura").gte("recorded_at", since);
      const [sleep, readiness, activity] = await Promise.all([
        base.not("sleep_total_min", "is", null),
        supabase.from("biometrics").select("id", { count: "exact", head: true })
          .eq("user_id", uid).eq("source", "oura").gte("recorded_at", since)
          .not("oura_readiness_score", "is", null),
        supabase.from("biometrics").select("id", { count: "exact", head: true })
          .eq("user_id", uid).eq("source", "oura").gte("recorded_at", since)
          .not("oura_activity_score", "is", null),
      ]);
      setCounts({
        sleep: sleep.count ?? 0,
        readiness: readiness.count ?? 0,
        activity: activity.count ?? 0,
      });
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === "oura-connected") {
        toast.success("Oura connected. Backfilling 90 days…");
        setBackfilling(true);
        refresh();
        // Poll for ~30s while backfill completes
        let n = 0;
        const id = window.setInterval(() => {
          n++;
          refresh();
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
    const { data: cfg, error: cfgErr } = await supabase.functions.invoke("oura-sync", {
      body: { action: "config" },
    });
    if (cfgErr) {
      console.error("[oura] config error", cfgErr);
      toast.error("Couldn't reach Oura sync service. Please try again.");
      return;
    }
    if (!cfg?.client_id) {
      toast.error(
        "Oura isn't configured yet. Add OURA_CLIENT_ID and OURA_CLIENT_SECRET in backend settings.",
        { duration: 6000 },
      );
      return;
    }
    const redirect = window.location.origin + "/oauth/oura/callback";
    const url = new URL("https://cloud.ouraring.com/oauth/authorize");
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", cfg.client_id);
    url.searchParams.set("redirect_uri", redirect);
    url.searchParams.set("scope", OURA_SCOPE);
    url.searchParams.set("state", sess.session.user.id);
    console.info("[oura] authorize diagnostics", {
      clientId: `${String(cfg.client_id).slice(0, 8)}…${String(cfg.client_id).slice(-8)}`,
      redirectUri: redirect,
      scope: OURA_SCOPE,
      authorizeUrl: url.toString(),
    });
    const w = 520, h = 720;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;
    window.open(url.toString(), "oura-oauth",
      `width=${w},height=${h},left=${left},top=${top}`);
  };

  const sync = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.functions.invoke("oura-sync", {
        body: { action: "incremental" },
      });
      if (error) throw error;
      toast.success("Synced");
      refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Sync failed");
    } finally {
      setBusy(false);
    }
  };

  const updateInterval = async (v: string) => {
    const hours = Number(v);
    setIntervalHours(hours);
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) return;
    const { error } = await supabase.from("oura_tokens")
      .update({ sync_interval_hours: hours })
      .eq("user_id", sess.session.user.id);
    if (error) toast.error("Could not save preference");
    else toast.success(hours === 0 ? "Auto-sync off" : `Sync every ${hours === 1 ? "hour" : `${hours} hours`}`);
  };

  const disconnect = async () => {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) return;
    await supabase.from("oura_tokens").delete().eq("user_id", sess.session.user.id);
    setConnected(false);
    setLastSync(null);
    setCounts({ sleep: 0, readiness: 0, activity: 0 });
    toast("Oura disconnected");
  };

  if (connected) {
    return (
      <div className="py-2 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="rounded-full bg-secondary p-2 text-secondary-foreground shrink-0">
              <Activity className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="font-serif text-base text-foreground">Oura Ring</p>
              <p className="text-xs text-muted-foreground">
                {backfilling
                  ? `Importing… ${counts.sleep} sleep · ${counts.readiness} readiness · ${counts.activity} activity`
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
            <Button size="sm" variant="outline" onClick={sync} disabled={busy || backfilling}>
              {busy || backfilling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Sync"}
            </Button>
            <Button size="sm" variant="ghost" onClick={disconnect}>Disconnect</Button>
          </div>
        </div>
        {!backfilling && (
          <div className="pl-11 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-muted-foreground">
              Last 90 days · {counts.sleep} sleep · {counts.readiness} readiness · {counts.activity} activity
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Auto-sync</span>
              <Select value={String(interval)} onValueChange={updateInterval}>
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
          <Activity className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="font-serif text-base text-foreground">Oura Ring</p>
          <p className="text-xs text-muted-foreground truncate">
            {connected === null ? "\u00a0" : "Sleep, readiness, HRV, temperature"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button size="sm" onClick={connect}>Connect</Button>
      </div>
    </div>
  );
}