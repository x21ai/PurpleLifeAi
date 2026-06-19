import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/integrations/supabase/auth-context";
import { useRouteTheme } from "@/lib/use-route-theme";
import { getDoseHistoryByDay, formatDoseLocalTime, type DoseHistoryDay } from "@/lib/meds-today";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/meds/history")({
  head: () => ({ meta: [{ title: "Medication history · Purple" }] }),
  component: MedsHistory,
});

function statusClass(status: string): string {
  if (status === "taken") return "bg-primary/15 text-primary";
  if (status === "missed") return "bg-destructive/15 text-destructive";
  if (status === "skipped") return "bg-muted text-muted-foreground";
  return "bg-secondary text-secondary-foreground";
}

function MedsHistory() {
  useRouteTheme("light");
  const { t } = useTranslation();
  const { session } = useAuth();
  const userId = session?.user.id;
  const [groups, setGroups] = React.useState<DoseHistoryDay[] | null>(null);
  const [timezone, setTimezone] = React.useState("UTC");

  React.useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void (async () => {
      const r = await getDoseHistoryByDay(userId, 30);
      if (cancelled) return;
      setGroups(r.groups);
      setTimezone(r.timezone);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-10 lg:px-16 pt-10 sm:pt-16 lg:pt-20 pb-24">
      <Link
        to="/meds"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground gap-1"
      >
        <ArrowLeft className="h-4 w-4" /> {t("nav.medications")}
      </Link>

      <p className="mt-6 label-eyebrow text-muted-foreground">{t("meds.history.eyebrow")}</p>
      <h1 className="mt-2 font-serif text-[44px] sm:text-6xl leading-[1.02] tracking-[-0.02em] text-foreground">
        {t("meds.history.title")}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("meds.history.subtitle")}</p>

      {groups === null ? (
        <p className="mt-10 text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : groups.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">{t("meds.history.empty")}</p>
      ) : (
        <div className="mt-8 space-y-6">
          {groups.map((day) => (
            <section key={day.date}>
              <div className="flex items-baseline justify-between gap-3 px-1 mb-2">
                <h2 className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  {day.label}
                </h2>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {t("meds.history.takenOf", { taken: day.takenCount, total: day.total })}
                </span>
              </div>
              <ul className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
                {day.doses.map((d) => (
                  <li key={d.id}>
                    <Link
                      to="/meds/$medId"
                      params={{ medId: d.medication?.id ?? "" }}
                      className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-secondary/40 transition-colors"
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        <span className="text-xs text-muted-foreground tabular-nums shrink-0 w-16">
                          {formatDoseLocalTime(d.scheduled_at, timezone)}
                        </span>
                        <span className="text-sm text-foreground truncate">
                          {d.medication?.name ?? "Medication"}
                        </span>
                      </span>
                      <span className="flex items-center gap-2 shrink-0">
                        {d.amount != null && (
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {d.amount}
                            {d.unit ? ` ${d.unit}` : ""}
                          </span>
                        )}
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide capitalize",
                            statusClass(d.status),
                          )}
                        >
                          {d.status}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
