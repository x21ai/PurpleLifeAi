import * as React from "react";
import { Pill, CheckCheck, Smartphone, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn, formatLocaleTime } from "@/lib/utils";
import type { TodayDoseRow } from "@/lib/meds-today";
import {
  dismissReminderBanner,
  notificationsSupported,
  requestPermission,
  shouldShowReminderBanner,
} from "@/lib/med-notifications";

function dotStyle(status: string): string {
  switch (status) {
    case "taken":
      return "bg-[color:var(--success,theme(colors.green.500))] ring-[color:var(--success,theme(colors.green.500))]/30";
    case "missed":
      return "bg-destructive ring-destructive/30";
    case "skipped":
      return "bg-muted-foreground/60 ring-muted-foreground/20";
    default:
      return "bg-primary ring-primary/30";
  }
}

function ReminderNudge() {
  const [visible, setVisible] = React.useState(false);
  const [perm, setPerm] = React.useState<NotificationPermission | "unsupported">("default");

  React.useEffect(() => {
    setVisible(shouldShowReminderBanner());
    if (!notificationsSupported()) {
      setPerm("unsupported");
      return;
    }
    setPerm(Notification.permission);
  }, []);

  if (!visible && perm === "granted") return null;

  const dismiss = () => {
    dismissReminderBanner();
    setVisible(false);
  };

  return (
    <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-start gap-2">
      <Smartphone className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
      <div className="flex-1 min-w-0 text-sm">
        {perm !== "granted" && perm !== "unsupported" ? (
          <>
            <p className="text-foreground">Turn on reminders so you never miss a dose.</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2 rounded-full h-8"
              onClick={() => void requestPermission().then((p) => setPerm(p))}
            >
              Enable notifications
            </Button>
          </>
        ) : (
          <p className="text-muted-foreground">
            Reminders work best when Purple is on your home screen.
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="text-muted-foreground hover:text-foreground p-1 shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function TodayPanel({
  doses,
  pendingCount,
  markingAll,
  onMarkAll,
  onAction,
  onReclassify,
  onAddMed,
}: {
  doses: TodayDoseRow[] | null;
  pendingCount: number;
  markingAll: boolean;
  onMarkAll: () => void;
  onAction: (id: string, action: "taken" | "skip" | "snooze") => void;
  onReclassify: (id: string, next: "taken" | "skipped" | "pending") => void;
  onAddMed: () => void;
}) {
  const { t } = useTranslation();
  const [now, setNow] = React.useState(() => new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const dayStart = React.useMemo(() => {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [now]);

  const counts = React.useMemo(() => {
    let taken = 0;
    let missed = 0;
    let pending = 0;
    for (const d of doses ?? []) {
      if (d.status === "taken") taken++;
      else if (d.status === "missed") missed++;
      else if (d.status === "pending") pending++;
    }
    return { taken, pending, missed, total: doses?.length ?? 0 };
  }, [doses]);

  const nowPct = ((now.getTime() - dayStart.getTime()) / 86_400_000) * 100;

  return (
    <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Pill className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-serif text-xl text-foreground">{t("meds.todayDoses")}</h2>
        </div>
        {pendingCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            onClick={onMarkAll}
            disabled={markingAll}
          >
            <CheckCheck className="h-3.5 w-3.5 mr-1" />
            {t("meds.markAllTaken")}
          </Button>
        )}
      </div>

      {doses === null ? (
        <p className="mt-4 text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : doses.length === 0 ? (
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">{t("meds.noDosesToday")}</p>
          <Button size="sm" variant="outline" className="mt-3 rounded-full" onClick={onAddMed}>
            {t("meds.addMedication")}
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted-foreground tabular-nums">
            <span>
              {counts.total === 0
                ? "Nothing scheduled"
                : `${counts.taken}/${counts.total} taken${counts.missed ? ` · ${counts.missed} missed` : ""}`}
            </span>
          </div>
          <div className="relative mt-3 h-10">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-border" />
            {[0, 6, 12, 18, 24].map((h) => (
              <div
                key={h}
                className="absolute top-1/2 -translate-y-1/2 h-2 w-px bg-border"
                style={{ left: `${(h / 24) * 100}%` }}
              />
            ))}
            <div
              className="absolute top-0 bottom-0 w-px bg-foreground/40"
              style={{ left: `${nowPct}%` }}
              aria-hidden
            />
            {doses.map((d) => {
              const tMs = new Date(d.scheduled_at).getTime();
              const pct = Math.min(100, Math.max(0, ((tMs - dayStart.getTime()) / 86_400_000) * 100));
              const tooltip = `${d.medication?.name ?? "Dose"} · ${formatLocaleTime(d.scheduled_at)} · ${d.status}`;
              return (
                <div
                  key={d.id}
                  title={tooltip}
                  aria-label={tooltip}
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3 w-3 rounded-full ring-4",
                    dotStyle(d.status),
                  )}
                  style={{ left: `${pct}%` }}
                />
              );
            })}
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground tabular-nums">
            <span>12a</span>
            <span>6a</span>
            <span>12p</span>
            <span>6p</span>
            <span>12a</span>
          </div>

          <ul className="mt-5 divide-y divide-border">
            {doses.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-2 py-3 text-sm">
                <span className="text-muted-foreground tabular-nums shrink-0">
                  {formatLocaleTime(d.scheduled_at)}
                </span>
                <span className="text-foreground truncate flex-1 min-w-0">
                  {d.medication?.name ?? "Medication"}
                </span>
                {d.status === "pending" ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      className="rounded-full h-8 px-3"
                      onClick={() => onAction(d.id, "taken")}
                    >
                      Taken
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full h-8 px-3"
                      onClick={() => onAction(d.id, "snooze")}
                    >
                      Snooze
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full h-8 px-3"
                      onClick={() => onAction(d.id, "skip")}
                    >
                      Skip
                    </Button>
                  </div>
                ) : d.status === "taken" ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-medium text-[color:var(--data-good)]">Taken</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full h-8 px-3"
                      onClick={() => onReclassify(d.id, "pending")}
                    >
                      Undo
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="capitalize text-muted-foreground">{d.status}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full h-8 px-3"
                      onClick={() => onReclassify(d.id, "taken")}
                    >
                      I took it
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      <ReminderNudge />
    </section>
  );
}
