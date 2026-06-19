import * as React from "react";
import { Pill, CheckCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn, formatLocaleTime } from "@/lib/utils";
import type { TodayDoseRow } from "@/lib/meds-today";

/** Shift a YYYY-MM-DD date string by whole days (calendar-safe via UTC noon). */
function shiftDate(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

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

export function TodayPanel({
  doses,
  timezone,
  todayLabel,
  pendingCount,
  markingAll,
  onMarkAll,
  onAction,
  onReclassify,
  onAddMed,
  adherencePct = null,
  adherenceTaken = 0,
  adherenceTotal = 0,
  viewDate,
  todayStr,
  onChangeDate,
}: {
  doses: TodayDoseRow[] | null;
  timezone: string;
  todayLabel: string;
  pendingCount: number;
  markingAll: boolean;
  onMarkAll: () => void;
  onAction: (id: string, action: "taken" | "skip" | "snooze") => void;
  onReclassify: (id: string, next: "taken" | "skipped" | "pending") => void;
  onAddMed: () => void;
  adherencePct?: number | null;
  adherenceTaken?: number;
  adherenceTotal?: number;
  viewDate?: string;
  todayStr?: string;
  onChangeDate?: (dateStr: string) => void;
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
  const isToday = !viewDate || !todayStr || viewDate === todayStr;
  const canGoNext = !isToday;

  return (
    <section id="today-doses" className="mt-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Pill className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-serif text-xl text-foreground">
              {isToday ? t("meds.todayDoses") : t("meds.dosesForDay")}
            </h2>
          </div>
          {onChangeDate && viewDate && todayStr ? (
            <div className="mt-1 flex items-center gap-1">
              <button
                type="button"
                aria-label={t("meds.prevDay")}
                onClick={() => onChangeDate(shiftDate(viewDate, -1))}
                className="h-7 w-7 inline-flex items-center justify-center rounded-full hover:bg-secondary text-muted-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-muted-foreground tabular-nums">
                {todayLabel}
                {timezone ? ` · ${timezone.replace(/_/g, " ")}` : ""}
              </span>
              <button
                type="button"
                aria-label={t("meds.nextDay")}
                disabled={!canGoNext}
                onClick={() => onChangeDate(shiftDate(viewDate, 1))}
                className="h-7 w-7 inline-flex items-center justify-center rounded-full hover:bg-secondary text-muted-foreground disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <input
                type="date"
                value={viewDate}
                max={todayStr}
                onChange={(e) => e.target.value && onChangeDate(e.target.value)}
                aria-label={t("meds.pickDate")}
                className="ml-1 rounded-md border border-border bg-card px-2 py-1 text-xs text-muted-foreground"
              />
            </div>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              {todayLabel}
              {timezone ? ` · ${timezone.replace(/_/g, " ")}` : ""}
            </p>
          )}
          {adherencePct != null && isToday && (
            <div className="mt-3">
              <p className="text-2xl font-medium tabular-nums text-foreground">
                {adherencePct}%
                <span className="ml-2 text-xs font-normal text-muted-foreground align-middle">
                  {t("meds.onScheduleLabel")}
                </span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                {adherenceTotal > 0
                  ? t("meds.dosesLogged", { taken: adherenceTaken, total: adherenceTotal })
                  : t("meds.last14Days")}
                {adherencePct < 100 && ` · ${t("meds.fixWithArrows")}`}
              </p>
            </div>
          )}
        </div>
        {pendingCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            className="rounded-full shrink-0"
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
            {isToday && (
              <div
                className="absolute top-0 bottom-0 w-px bg-foreground/40"
                style={{ left: `${nowPct}%` }}
                aria-hidden
              />
            )}
            {doses.map((d) => {
              const tMs = new Date(d.scheduled_at).getTime();
              const pct = Math.min(
                100,
                Math.max(0, ((tMs - dayStart.getTime()) / 86_400_000) * 100),
              );
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
    </section>
  );
}
