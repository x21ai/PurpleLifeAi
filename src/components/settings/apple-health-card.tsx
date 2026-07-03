import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Copy, Loader2, RefreshCw, Trash2, ExternalLink, CheckCircle2, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { userMessage } from "@/lib/user-message";
import { useNativeIos } from "@/lib/native";
import { useNativeAppleHealth } from "@/components/connections/use-native-apple-health";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  getOrCreateAppleHealthConfig,
  rotateAppleHealthSecret,
  disconnectAppleHealth,
} from "@/lib/apple-health.functions";

/**
 * Apple Health card for /settings/sharing.
 * Native iOS: HealthKit connect and sync (no webhook).
 * Web: Health Auto Export webhook URL and setup guides.
 */
export function AppleHealthCard() {
  const nativeIos = useNativeIos();

  if (nativeIos === null) {
    return (
      <section className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <p className="text-sm text-muted-foreground">
          <Loader2 className="inline h-3 w-3 animate-spin" /> Loading Apple Health…
        </p>
      </section>
    );
  }

  if (nativeIos) {
    return <NativeAppleHealthSettingsCard />;
  }

  return <WebAppleHealthCard />;
}

function NativeAppleHealthSettingsCard() {
  const { t } = useTranslation();
  const { linked, loaded, busy, syncState, statusText, connect, syncNow } = useNativeAppleHealth();

  const dotClass =
    syncState === "receiving"
      ? "bg-[color:var(--data-good)]"
      : syncState === "stale"
        ? "bg-[color:var(--data-warn)]"
        : "bg-muted-foreground/50";

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="rounded-full bg-secondary p-2.5 text-secondary-foreground shrink-0">
          <Smartphone className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-xl text-foreground">{t("appleHealth.nativeTitle")}</h2>
          <p className="mt-1 text-xs text-muted-foreground max-w-md">{t("appleHealth.nativeBody")}</p>
        </div>
        {linked && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-3 w-3" /> {t("appleHealth.connected")}
          </span>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">Apple Health</p>
          {loaded && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotClass}`} aria-hidden="true" />
              {statusText[syncState]}
            </p>
          )}
        </div>
        {linked ? (
          <Button size="sm" variant="outline" onClick={() => void syncNow()} disabled={busy}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t("appleHealth.syncNow")}
          </Button>
        ) : (
          <Button size="sm" onClick={() => void connect()} disabled={busy || !loaded}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t("appleHealth.connect")}
          </Button>
        )}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">{t("appleHealth.nativeHint")}</p>
    </section>
  );
}

function WebAppleHealthCard() {
  const qc = useQueryClient();
  const fetchConfig = useServerFn(getOrCreateAppleHealthConfig);
  const rotate = useServerFn(rotateAppleHealthSecret);
  const disconnect = useServerFn(disconnectAppleHealth);

  const cfg = useQuery({
    queryKey: ["apple-health", "config"],
    queryFn: () => fetchConfig(),
  });

  const rotateMut = useMutation({
    mutationFn: () => rotate(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["apple-health", "config"] });
      toast.success("New webhook token generated. Update it in Health Auto Export.");
    },
    onError: (e: unknown) =>
      toast.error(userMessage(e, "Couldn't refresh the connection code. Try again in a moment.")),
  });
  const disconnectMut = useMutation({
    mutationFn: () => disconnect(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["apple-health", "config"] });
      toast.success("Apple Health disconnected");
    },
    onError: (e: unknown) => toast.error(userMessage(e, "Couldn't disconnect")),
  });

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const token = cfg.data?.webhook_secret ?? "";
  const webhookUrl = token ? `${origin}/api/public/hooks/apple-health?token=${token}` : "";
  const lastWebhookAt = cfg.data?.last_webhook_at ?? null;
  const lastSyncAt = cfg.data?.last_sync_at ?? null;
  const [pinging, setPinging] = useState(false);

  const handleCopy = () => {
    if (!webhookUrl) return;
    navigator.clipboard?.writeText(webhookUrl).then(
      () => toast.success("Webhook URL copied"),
      () => toast.error("Couldn't copy"),
    );
  };

  const handlePing = async () => {
    if (!webhookUrl || pinging) return;
    setPinging(true);
    try {
      const r = await fetch(webhookUrl, { method: "GET" });
      if (r.ok) {
        toast.success("Connection works · Purple is listening.");
        qc.invalidateQueries({ queryKey: ["apple-health", "config"] });
      } else {
        toast.error(`Test failed (${r.status})`);
      }
    } catch (e) {
      toast.error(userMessage(e, "The test didn't go through. Check the connection details and try again."));
    } finally {
      setPinging(false);
    }
  };

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl text-foreground">Apple Health auto-sync</h2>
          <p className="mt-1 text-xs text-muted-foreground max-w-md">
            Apple HealthKit is iOS-only, there's no web API for it. Use{" "}
            <span className="text-foreground">Health Auto Export</span> or{" "}
            <span className="text-foreground">iOS Shortcuts</span> on your iPhone to POST
            new readings to your personal Purple webhook.
          </p>
        </div>
        {lastWebhookAt && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-3 w-3" /> Connected
          </span>
        )}
      </div>

      {cfg.isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">
          <Loader2 className="inline h-3 w-3 animate-spin" /> Loading…
        </p>
      ) : (
        <>
          <div className="mt-4">
            <p className="text-xs font-medium text-foreground">Your personal webhook URL</p>
            <div className="mt-1 flex items-stretch gap-2">
              <code className="flex-1 min-w-0 truncate rounded-md bg-muted px-3 py-2 text-[11px] text-foreground">
                {webhookUrl}
              </code>
              <Button size="sm" variant="outline" onClick={handleCopy}>
                <Copy className="h-3 w-3 mr-1" /> Copy
              </Button>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Treat this like a password. Anyone with the URL can write data to your account.
            </p>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span>
              Last webhook:{" "}
              <span className="text-foreground">
                {lastWebhookAt ? new Date(lastWebhookAt).toLocaleString() : "never"}
              </span>
            </span>
            <span>
              Last sync (any):{" "}
              <span className="text-foreground">
                {lastSyncAt ? new Date(lastSyncAt).toLocaleString() : "never"}
              </span>
            </span>
            <button
              type="button"
              onClick={handlePing}
              disabled={pinging}
              className="inline-flex items-center gap-1 text-primary hover:underline disabled:opacity-50"
            >
              {pinging ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              Test connection
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs font-medium text-foreground">Health Auto Export (recommended)</p>
              <ol className="mt-2 space-y-1 text-[11px] text-muted-foreground list-decimal pl-4">
                <li>Install Health Auto Export from the App Store.</li>
                <li>Add an Automation → REST API.</li>
                <li>Paste the URL above. Method: POST. Format: JSON.</li>
                <li>Select metrics: HR, HRV, sleep, steps, SpO₂, etc.</li>
                <li>Set schedule to every 1–6 hours.</li>
              </ol>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs font-medium text-foreground">iOS Shortcuts (free)</p>
              <ol className="mt-2 space-y-1 text-[11px] text-muted-foreground list-decimal pl-4">
                <li>Open Shortcuts → New Shortcut.</li>
                <li>Add "Find Health Samples" for each metric.</li>
                <li>"Get Contents of URL" → use the URL above, POST, JSON body.</li>
                <li>In Automations, run daily at a fixed time.</li>
              </ol>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link to="/apple-health-import">
                <ExternalLink className="h-3 w-3 mr-1" /> One-time ZIP import
              </Link>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => rotateMut.mutate()}
              disabled={rotateMut.isPending}
            >
              <RefreshCw className="h-3 w-3 mr-1" /> Rotate token
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={disconnectMut.isPending}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3 mr-1" /> Disconnect
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Disconnect Apple Health auto-sync?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Your webhook URL will stop accepting new data. Past readings stay in Purple,
                    and you can reconnect any time by generating a new URL.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => disconnectMut.mutate()}>
                    Disconnect
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </>
      )}
    </section>
  );
}
