import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Activity, Moon, Pill } from "lucide-react";
import {
  getSevenDayTrends,
  type SevenDayTrends,
  type DayPoint,
} from "@/lib/seven-day-trends.functions";

function fmtSleep(min: number | null) {
  if (min == null) return "–";
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

function Bars({
  days,
  accessor,
  target,
}: {
  days: DayPoint[];
  accessor: (d: DayPoint) => number | null;
  target: number;
}) {
  const vals = days.map(accessor);
  const max = Math.max(target, ...vals.map((v) => v ?? 0));
  return (
    <div className="mt-2 flex items-end gap-1 h-10">
      {vals.map((v, i) => {
        const h = v == null ? 0 : Math.max(4, Math.round((v / max) * 36));
        const low = v != null && v < target * 0.85;
        return (
          <div
            key={i}
            className={`flex-1 rounded-sm ${
              v == null ? "bg-muted/30" : low ? "bg-amber-500/70" : "bg-primary/70"
            }`}
            style={{ height: `${h}px` }}
            title={days[i].date}
          />
        );
      })}
    </div>
  );
}

export function SevenDayTrendStrip() {
  const fn = useServerFn(getSevenDayTrends);
  const { data } = useQuery<SevenDayTrends>({
    queryKey: ["seven-day-trends"],
    queryFn: () => fn(),
    staleTime: 5 * 60_000,
  });
  if (!data) return null;

  const hasAny = data.sleepAvgMin != null || data.hrvAvgMs != null || data.missedDoses > 0;
  if (!hasAny) return null;

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-5">
      <p className="label-eyebrow text-muted-foreground">Last 7 days</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <Moon className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Sleep avg</p>
          </div>
          <p className="mt-1 font-serif text-lg text-foreground">{fmtSleep(data.sleepAvgMin)}</p>
          {data.sleepDebtMin != null && data.sleepDebtMin > 60 && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Sleep debt: {fmtSleep(data.sleepDebtMin)}
            </p>
          )}
          <Bars days={data.days} accessor={(d) => d.sleepMin} target={7.5 * 60} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">HRV avg</p>
          </div>
          <p className="mt-1 font-serif text-lg text-foreground">
            {data.hrvAvgMs != null ? `${data.hrvAvgMs} ms` : "–"}
          </p>
          {data.hrvDelta14d != null && (
            <p
              className={`text-xs ${
                data.hrvDelta14d < -5
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground"
              }`}
            >
              {data.hrvDelta14d >= 0 ? "+" : ""}
              {data.hrvDelta14d} ms vs prior week
            </p>
          )}
          <Bars
            days={data.days}
            accessor={(d) => d.hrvMs}
            target={Math.max(20, data.hrvAvgMs ?? 30)}
          />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <Pill className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Missed doses</p>
          </div>
          <p className="mt-1 font-serif text-lg text-foreground tabular-nums">{data.missedDoses}</p>
          <p className="text-xs text-muted-foreground">across the week</p>
          <div className="mt-2 flex items-end gap-1 h-10">
            {data.days.map((d, i) => {
              const h = d.missedDoses === 0 ? 4 : Math.min(36, 8 + d.missedDoses * 10);
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-sm ${
                    d.missedDoses === 0 ? "bg-muted/30" : "bg-destructive/70"
                  }`}
                  style={{ height: `${h}px` }}
                  title={d.date}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
