import { useCallback, useEffect, useState } from "react";
import { Smartphone, Copy, Check, Loader2, ExternalLink } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { getOrCreateAppleHealthConfig, disconnectAppleHealth } from "@/lib/apple-health.functions";
import { useNativeIos } from "@/lib/native";
import { NativeAppleHealthPanel } from "@/components/connections/native-apple-health-panel";
import { useNativeAppleHealth } from "@/components/connections/use-native-apple-health";
import { toast } from "sonner";
import { userMessage } from "@/lib/user-message";

const DAY_MS = 24 * 3600 * 1000;
// Health Auto Export runs every 1-6h; if no Apple Health data has landed in
// this window we treat the sync as stalled rather than active.
const FRESH_WINDOW_MS = 3 * DAY_MS;

function relativeTime(iso: string | null): string {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

type SyncState = "receiving" | "stale" | "reachable" | "waiting";

export function AppleHealthConnection() {
  const nativeIos = useNativeIos();

  if (nativeIos === null) {
    return (
      <div className="flex items-center gap-3 py-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <p className="text-xs text-muted-foreground">Loading Apple Health…</p>
      </div>
    );
  }

  if (nativeIos) {
    return <NativeAppleHealthPanel embedded />;
  }

  return <WebAppleHealthConnection />;
}

function WebAppleHealthConnection() {
  const ensureConfig = useServerFn(getOrCreateAppleHealthConfig);
  const disconnect = useServerFn(disconnectAppleHealth);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [lastContact, setLastContact] = useState<string | null>(null);
  const [lastData, setLastData] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) return;
    const uid = sess.session.user.id;
    const { data } = await supabase
      .from("apple_health_tokens")
      .select("webhook_secret, last_sync_at, last_webhook_at")
      .eq("user_id", uid)
      .maybeSingle();
    setConnected(!!data);
    setSecret(data?.webhook_secret ?? null);
    setLastContact(data?.last_webhook_at ?? data?.last_sync_at ?? null);

    const { data: bio } = await supabase
      .from("biometrics")
      .select("recorded_at")
      .eq("user_id", uid)
      .eq("source", "apple_health")
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setLastData(bio?.recorded_at ?? null);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const syncState: SyncState = (() => {
    const dataAge = lastData ? Date.now() - new Date(lastData).getTime() : Infinity;
    if (dataAge < FRESH_WINDOW_MS) return "receiving";
    if (lastData) return "stale";
    if (lastContact) return "reachable";
    return "waiting";
  })();

  const STATUS_TEXT: Record<SyncState, string> = {
    receiving: `Syncing · latest data ${relativeTime(lastData)}`,
    stale: `Last data ${relativeTime(lastData)} · check your Health Auto Export automation`,
    reachable: "URL reached · waiting for the first data export from Health Auto Export",
    waiting: "Not receiving yet · finish the Health Auto Export setup below",
  };

  const testConnection = async () => {
    if (!secret) return;
    setTesting(true);
    try {
      const url = `${window.location.origin}/api/public/hooks/apple-health?token=${secret}`;
      const res = await fetch(url, { method: "GET" });
      if (res.ok) {
        toast.success("Webhook reachable. Purple is listening for your exports.");
      } else if (res.status === 401) {
        toast.error("Invalid webhook token. Tap Disconnect, then Connect again.");
      } else {
        toast.error(`Webhook test failed (${res.status}). Recopy the URL into Health Auto Export.`);
      }
    } catch {
      toast.error("Could not reach the webhook. Check your connection and the URL.");
    } finally {
      setTesting(false);
      void refresh();
    }
  };

  const connect = async () => {
    setBusy(true);
    try {
      const cfg = await ensureConfig();
      setSecret(cfg.webhook_secret);
      setConnected(true);
      toast.success("Apple Health ready. Copy your webhook URL below.");
    } catch (e) {
      toast.error(userMessage(e, "Couldn't set up Apple Health"));
    } finally {
      setBusy(false);
    }
  };

  const copyUrl = async () => {
    if (!secret) return;
    const url = `${window.location.origin}/api/public/hooks/apple-health?token=${secret}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy. Long-press the URL to copy it manually.");
    }
  };

  const onDisconnect = async () => {
    setBusy(true);
    try {
      await disconnect();
      setConnected(false);
      setSecret(null);
      setLastContact(null);
      setLastData(null);
      toast("Apple Health disconnected");
    } finally {
      setBusy(false);
    }
  };

  if (connected && secret) {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/api/public/hooks/apple-health?token=${secret}`
        : "";
    const dotClass =
      syncState === "receiving"
        ? "bg-[color:var(--data-good)]"
        : syncState === "stale"
          ? "bg-[color:var(--data-warn)]"
          : "bg-muted-foreground/50";
    return (
      <div className="py-2 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="rounded-full bg-secondary p-2 text-secondary-foreground shrink-0">
              <Smartphone className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="font-serif text-base text-foreground">Apple Health</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span
                  className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotClass}`}
                  aria-hidden="true"
                />
                {STATUS_TEXT[syncState]}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => void testConnection()}
              disabled={testing || busy}
            >
              {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Test"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => void onDisconnect()} disabled={busy}>
              Disconnect
            </Button>
          </div>
        </div>

        <div className="pl-11 space-y-3">
          <p className="text-xs text-muted-foreground rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
            Purple is a web app, so it cannot show an Apple HealthKit permission like native apps.
            Data reaches Purple when the <strong>Health Auto Export</strong> app on your iPhone POSTs
            readings to your personal URL below.
          </p>
          <div>
            <p className="text-xs font-medium text-foreground">Setup in Health Auto Export</p>
            <ol className="mt-1.5 space-y-1 text-xs text-muted-foreground list-decimal pl-4">
              <li>
                Install{" "}
                <a
                  href="https://apps.apple.com/app/health-auto-export-json-csv/id1115567069"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-0.5 underline text-foreground"
                >
                  Health Auto Export
                  <ExternalLink className="h-3 w-3" aria-hidden />
                </a>{" "}
                from the App Store.
              </li>
              <li>Open Automations → add REST API (or Webhook).</li>
              <li>Paste the URL below. Method: POST. Format: JSON.</li>
              <li>Select metrics: sleep, HRV, resting HR, steps, SpO₂, and others you track.</li>
              <li>Set schedule to every 1–6 hours, then run Test in HAE and tap Test here.</li>
            </ol>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-md border border-foreground/10 bg-foreground/[0.04] px-3 py-2 text-[11px] font-mono">
              {url}
            </code>
            <Button size="sm" variant="outline" onClick={() => void copyUrl()}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            One-time historical backfill?{" "}
            <Link to="/apple-health-import" className="underline">
              Upload your export.xml
            </Link>
            . On the Purple iOS app, HealthKit syncs directly without Health Auto Export.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-2 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="rounded-full bg-secondary p-2 text-secondary-foreground shrink-0">
            <Smartphone className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="font-serif text-base text-foreground">Apple Health</p>
            <p className="text-xs text-muted-foreground">
              {connected === null
                ? "\u00a0"
                : "Via Health Auto Export on iPhone (no HealthKit prompt in the browser)"}
            </p>
          </div>
        </div>
        <Button size="sm" onClick={() => void connect()} disabled={busy}>
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Connect"}
        </Button>
      </div>
      {connected !== null && (
        <p className="text-xs text-muted-foreground pl-11">
          Tap Connect to get your personal webhook URL, then finish setup in the Health Auto Export
          app. Purple cannot pull from Apple Health directly in the browser.
        </p>
      )}
    </div>
  );
}

/** Compact Apple Health connect row for onboarding (native iOS only). */
export function WelcomeAppleHealthConnect({
  onConnected,
}: {
  onConnected?: () => void;
}) {
  const { healthKitAuthorized, loaded, busy, connect } = useNativeAppleHealth();

  useEffect(() => {
    if (healthKitAuthorized) onConnected?.();
  }, [healthKitAuthorized, onConnected]);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <span className="rounded-full bg-secondary p-2.5 text-secondary-foreground shrink-0">
          <Smartphone className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="font-serif text-base text-foreground">Apple Health</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {healthKitAuthorized
              ? "Connected · vitals sync from HealthKit"
              : "Sleep, heart rate, steps, and more from this iPhone"}
          </p>
        </div>
      </div>
      {!healthKitAuthorized && (
        <Button size="sm" onClick={() => void connect()} disabled={busy || !loaded}>
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Connect Apple Health"}
        </Button>
      )}
    </div>
  );
}
