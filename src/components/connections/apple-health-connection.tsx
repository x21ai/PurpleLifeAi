import { useCallback, useEffect, useState } from "react";
import { Smartphone, Copy, Check, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import {
  getOrCreateAppleHealthConfig,
  disconnectAppleHealth,
} from "@/lib/apple-health.functions";
import { toast } from "sonner";
import { userMessage } from "@/lib/user-message";

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

export function AppleHealthConnection() {
  const ensureConfig = useServerFn(getOrCreateAppleHealthConfig);
  const disconnect = useServerFn(disconnectAppleHealth);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) return;
    const { data } = await supabase
      .from("apple_health_tokens")
      .select("webhook_secret, last_sync_at, last_webhook_at")
      .eq("user_id", sess.session.user.id)
      .maybeSingle();
    setConnected(!!data);
    setSecret(data?.webhook_secret ?? null);
    setLastSync(data?.last_webhook_at ?? data?.last_sync_at ?? null);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

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
      setLastSync(null);
      toast("Apple Health disconnected");
    } finally {
      setBusy(false);
    }
  };

  if (connected && secret) {
    const url = typeof window !== "undefined"
      ? `${window.location.origin}/api/public/hooks/apple-health?token=${secret}`
      : "";
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
                Connected · Last synced {relativeTime(lastSync)}
              </p>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={() => void onDisconnect()} disabled={busy}>
            Disconnect
          </Button>
        </div>

        <div className="pl-11 space-y-2">
          <p className="text-xs text-muted-foreground">
            In Health Auto Export (iOS) add an automation pointing to this URL,
            JSON format, every 1–6 hours:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] font-mono">
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
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex items-center gap-3 min-w-0">
        <span className="rounded-full bg-secondary p-2 text-secondary-foreground shrink-0">
          <Smartphone className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="font-serif text-base text-foreground">Apple Health</p>
          <p className="text-xs text-muted-foreground truncate">
            {connected === null ? "\u00a0" : "Sleep, HRV, steps, VO2max (via Health Auto Export or XML)"}
          </p>
        </div>
      </div>
      <Button size="sm" onClick={() => void connect()} disabled={busy}>
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Connect"}
      </Button>
    </div>
  );
}