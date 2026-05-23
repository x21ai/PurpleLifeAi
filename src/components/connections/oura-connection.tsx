import { useEffect, useState, useCallback } from "react";
import { Activity, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const OURA_SCOPE = "personal daily heartrate workout tag session spo2 ring_configuration";

export function OuraConnection() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) return;
    const { data } = await supabase
      .from("oura_tokens")
      .select("updated_at")
      .eq("user_id", sess.session.user.id)
      .maybeSingle();
    setConnected(!!data);
    setLastSync(data?.updated_at ?? null);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === "oura-connected") {
        toast.success("Oura connected. Backfilling 90 days…");
        refresh();
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
    if (cfgErr || !cfg?.client_id) {
      toast.error("Oura is not configured");
      return;
    }
    const redirect = window.location.origin + "/oauth/oura/callback";
    const url = new URL("https://cloud.ouraring.com/oauth/authorize");
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", cfg.client_id);
    url.searchParams.set("redirect_uri", redirect);
    url.searchParams.set("scope", OURA_SCOPE);
    url.searchParams.set("state", sess.session.user.id);
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

  const disconnect = async () => {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) return;
    await supabase.from("oura_tokens").delete().eq("user_id", sess.session.user.id);
    setConnected(false);
    setLastSync(null);
    toast("Oura disconnected");
  };

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex items-center gap-3 min-w-0">
        <span className="rounded-full bg-secondary p-2 text-secondary-foreground shrink-0">
          <Activity className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="font-serif text-base text-foreground">Oura Ring</p>
          <p className="text-xs text-muted-foreground truncate">
            {connected === null ? "\u00a0" :
              connected
                ? `Connected${lastSync ? ` · last sync ${new Date(lastSync).toLocaleString()}` : ""}`
                : "Sleep, readiness, HRV, temperature"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {connected ? (
          <>
            <Button size="sm" variant="outline" onClick={sync} disabled={busy}>
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Sync"}
            </Button>
            <Button size="sm" variant="ghost" onClick={disconnect}>Disconnect</Button>
          </>
        ) : (
          <Button size="sm" onClick={connect}>Connect</Button>
        )}
      </div>
    </div>
  );
}