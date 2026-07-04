import { CheckCircle2, Heart, Loader2, Settings2, Smartphone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useNativeAppleHealth } from "@/components/connections/use-native-apple-health";

type NativeAppleHealthPanelProps = {
  /** When true, omit outer section chrome (for Tools list card). */
  embedded?: boolean;
};

/**
 * Native iOS Apple Health connect UI: large Health Access style panel with
 * Connect button and a Settings link for grant/deny management.
 */
export function NativeAppleHealthPanel({ embedded = false }: NativeAppleHealthPanelProps) {
  const { t } = useTranslation();
  const {
    healthKitAuthorized,
    permissionDenied,
    hasSyncedData,
    loaded,
    busy,
    syncState,
    statusText,
    connect,
    syncNow,
    openSettings,
  } = useNativeAppleHealth();

  const dotClass =
    syncState === "receiving"
      ? "bg-[color:var(--data-good)]"
      : syncState === "stale"
        ? "bg-[color:var(--data-warn)]"
        : "bg-muted-foreground/50";

  const inner = healthKitAuthorized ? (
    <div className="flex flex-col items-center text-center gap-5 py-2">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
        <Heart className="h-8 w-8" aria-hidden />
      </div>
      <div className="space-y-1.5 max-w-sm">
        <p className="font-serif text-xl text-foreground">{t("appleHealth.nativeTitle")}</p>
        <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
          <span className={`h-2 w-2 rounded-full shrink-0 ${dotClass}`} aria-hidden="true" />
          {loaded ? statusText[syncState] : "\u00a0"}
        </p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <Button size="lg" className="w-full" onClick={() => void syncNow()} disabled={busy || !loaded}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("appleHealth.syncNow")}
        </Button>
        <button
          type="button"
          onClick={() => void openSettings()}
          className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <Settings2 className="h-4 w-4" aria-hidden />
          {t("appleHealth.openSettings")}
        </button>
      </div>
      <p className="text-xs text-muted-foreground max-w-sm">{t("appleHealth.nativeHint")}</p>
    </div>
  ) : (
    <div className="flex flex-col items-center text-center gap-5 py-2">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
        <Smartphone className="h-8 w-8" aria-hidden />
      </div>
      <div className="space-y-2 max-w-sm">
        <p className="font-serif text-xl text-foreground">{t("appleHealth.nativeTitle")}</p>
        <p className="text-sm text-muted-foreground">{t("appleHealth.nativeBody")}</p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <Button size="lg" className="w-full" onClick={() => void connect()} disabled={busy || !loaded}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("appleHealth.connect")}
        </Button>
        <button
          type="button"
          onClick={() => void openSettings()}
          className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <Settings2 className="h-4 w-4" aria-hidden />
          {t("appleHealth.openSettings")}
        </button>
      </div>
      {permissionDenied && (
        <p className="text-sm text-[color:var(--data-warn)] max-w-sm rounded-xl border border-[color:var(--data-warn)]/30 bg-[color:var(--data-warn)]/10 px-4 py-3">
          {t("appleHealth.permissionDenied")}
        </p>
      )}
      {loaded && hasSyncedData && !permissionDenied && (
        <p className="text-xs text-muted-foreground max-w-sm rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
          {t("appleHealth.webImportNote")}
        </p>
      )}
      <p className="text-xs text-muted-foreground max-w-sm">{t("appleHealth.connectSteps")}</p>
    </div>
  );

  if (embedded) {
    return <div className="py-1">{inner}</div>;
  }

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-8">
      {healthKitAuthorized && (
        <span className="mb-4 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-3.5 w-3.5" /> {t("appleHealth.connected")}
        </span>
      )}
      {inner}
    </section>
  );
}
