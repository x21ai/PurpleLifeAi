import { useMemo } from "react";
import { Droplets, FlaskConical, Sparkles, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";

export type HydrationRow = {
  id: string;
  consumed_at: string;
  volume_ml: number;
  kind: "water" | "electrolyte" | "coffee" | "tea" | "other";
  electrolyte_brand: string | null;
  sodium_mg: number | null;
  notes: string | null;
};

export type AuraRow = {
  id: string;
  occurred_at: string;
  kind: string;
  duration_seconds: number | null;
  notes: string | null;
};

type Props = {
  day: Date;
  hydration: HydrationRow[];
  auras: AuraRow[];
  goalMl?: number;
};

function hourOf(iso: string, day: Date): number {
  const d = new Date(iso);
  if (d.toDateString() !== day.toDateString()) return -1;
  return d.getHours() + d.getMinutes() / 60;
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function HydrationTimeline({ day, hydration, auras, goalMl = 2000 }: Props) {
  const totals = useMemo(() => {
    let water = 0, electrolyte = 0, sodium = 0, other = 0;
    for (const h of hydration) {
      if (h.kind === "water") water += h.volume_ml;
      else if (h.kind === "electrolyte") electrolyte += h.volume_ml;
      else other += h.volume_ml;
      if (h.sodium_mg) sodium += h.sodium_mg;
    }
    return { water, electrolyte, other, sodium, total: water + electrolyte + other };
  }, [hydration]);

  // Hourly stacked bars
  const hourly = useMemo(() => {
    const buckets = Array.from({ length: 24 }, () => ({ water: 0, electrolyte: 0, other: 0 }));
    for (const h of hydration) {
      const hr = Math.floor(hourOf(h.consumed_at, day));
      if (hr < 0 || hr > 23) continue;
      if (h.kind === "water") buckets[hr].water += h.volume_ml;
      else if (h.kind === "electrolyte") buckets[hr].electrolyte += h.volume_ml;
      else buckets[hr].other += h.volume_ml;
    }
    return buckets;
  }, [hydration, day]);

  const maxHour = Math.max(500, ...hourly.map((b) => b.water + b.electrolyte + b.other));
  const pct = Math.min(100, Math.round((totals.total / goalMl) * 100));

  return (
    <div className="rounded-2xl ring-1 ring-border bg-card p-5">
      {/* Totals */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total today</p>
          <p className="font-serif text-4xl text-foreground leading-none mt-1">
            {(totals.total / 1000).toFixed(2)} <span className="text-lg text-muted-foreground">L</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Goal {(goalMl / 1000).toFixed(1)} L · {pct}%
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <Stat icon={<Droplets className="h-3.5 w-3.5" />} label="Water" value={`${totals.water} ml`} tone="blue" />
          <Stat icon={<FlaskConical className="h-3.5 w-3.5" />} label="Electrolytes" value={`${totals.electrolyte} ml`} tone="purple" />
          <Stat icon={<Sparkles className="h-3.5 w-3.5" />} label="Sodium" value={`${totals.sodium} mg`} tone="amber" />
        </div>
      </div>

      {/* Goal bar */}
      <div className="mt-4 h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full bg-[color:var(--purple-primary)] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Hourly bars */}
      <div className="mt-6">
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">By hour</p>
        <div className="flex items-end gap-[2px] h-24 w-full">
          {hourly.map((b, i) => {
            const total = b.water + b.electrolyte + b.other;
            const h = total === 0 ? 2 : Math.max(4, Math.round((total / maxHour) * 96));
            const waterPct = total > 0 ? (b.water / total) * 100 : 0;
            const elecPct = total > 0 ? (b.electrolyte / total) * 100 : 0;
            return (
              <div
                key={i}
                className="flex-1 flex flex-col justify-end relative group"
                style={{ height: 96 }}
              >
                <div
                  className={cn(
                    "w-full rounded-sm overflow-hidden flex flex-col-reverse",
                    total === 0 && "bg-secondary/40",
                  )}
                  style={{ height: h }}
                >
                  {total > 0 && (
                    <>
                      <div className="w-full bg-blue-500/70" style={{ height: `${waterPct}%` }} />
                      <div className="w-full bg-[color:var(--purple-primary)]" style={{ height: `${elecPct}%` }} />
                      <div className="w-full bg-muted-foreground/40" style={{ height: `${100 - waterPct - elecPct}%` }} />
                    </>
                  )}
                </div>
                {total > 0 && (
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap text-[10px] bg-foreground text-background px-1.5 py-0.5 rounded">
                    {i}:00 · {total} ml
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground tabular-nums">
          <span>0</span><span>6</span><span>12</span><span>18</span><span>23</span>
        </div>
      </div>

      {/* Minute-precision timeline with aura markers */}
      <div className="mt-6">
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Exact times</p>
        <div className="relative h-12 rounded-md bg-secondary/40 ring-1 ring-border">
          {/* Hour gridlines */}
          {Array.from({ length: 25 }, (_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-px bg-border/50"
              style={{ left: `${(i / 24) * 100}%` }}
            />
          ))}
          {/* Drinks */}
          {hydration.map((h) => {
            const x = (hourOf(h.consumed_at, day) / 24) * 100;
            if (x < 0) return null;
            const color =
              h.kind === "water" ? "bg-blue-500"
              : h.kind === "electrolyte" ? "bg-[color:var(--purple-primary)]"
              : "bg-muted-foreground";
            return (
              <div
                key={h.id}
                className={cn("absolute top-1 w-1.5 rounded-sm group", color)}
                style={{ left: `calc(${x}% - 3px)`, height: 20 }}
                title={`${fmtTime(h.consumed_at)} · ${h.volume_ml} ml ${h.kind}`}
              >
                <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap text-[10px] bg-foreground text-background px-1.5 py-0.5 rounded z-10">
                  {fmtTime(h.consumed_at)} · {h.volume_ml} ml
                </div>
              </div>
            );
          })}
          {/* Auras */}
          {auras.map((a) => {
            const d = new Date(a.occurred_at);
            if (d.toDateString() !== day.toDateString()) return null;
            const x = ((d.getHours() + d.getMinutes() / 60) / 24) * 100;
            return (
              <div
                key={a.id}
                className="absolute bottom-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-amber-200/40 group"
                style={{ left: `calc(${x}% - 5px)` }}
                title={`${fmtTime(a.occurred_at)} · ${a.kind.replace("_", " ")}`}
              >
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap text-[10px] bg-amber-400 text-background px-1.5 py-0.5 rounded font-medium z-10">
                  {fmtTime(a.occurred_at)} · {a.kind.replace("_", " ")}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground tabular-nums">
          <span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>12am</span>
        </div>
        {auras.length > 0 && (
          <p className="mt-2 text-xs text-amber-500/90 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            {auras.length} aura{auras.length === 1 ? "" : "s"} today
          </p>
        )}
      </div>

      {/* Recent list */}
      {(hydration.length > 0 || auras.length > 0) && (
        <div className="mt-6">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Today</p>
          <ul className="space-y-1.5">
            {[...hydration.map((h) => ({ type: "h" as const, ts: h.consumed_at, row: h })),
              ...auras.map((a) => ({ type: "a" as const, ts: a.occurred_at, row: a }))]
              .sort((a, b) => b.ts.localeCompare(a.ts))
              .slice(0, 12)
              .map((it) =>
                it.type === "h" ? (
                  <li key={`h-${it.row.id}`} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      {iconFor(it.row.kind)}
                      <span className="text-foreground">{it.row.volume_ml} ml {it.row.kind}{it.row.electrolyte_brand ? ` · ${it.row.electrolyte_brand}` : ""}</span>
                    </span>
                    <span className="tabular-nums text-muted-foreground">{fmtTime(it.row.consumed_at)}</span>
                  </li>
                ) : (
                  <li key={`a-${it.row.id}`} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-amber-500">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span className="text-foreground">{it.row.kind.replace("_", " ")}{it.row.notes ? ` — ${it.row.notes}` : ""}</span>
                    </span>
                    <span className="tabular-nums text-muted-foreground">{fmtTime(it.row.occurred_at)}</span>
                  </li>
                ),
              )}
          </ul>
        </div>
      )}
    </div>
  );
}

function iconFor(kind: HydrationRow["kind"]) {
  if (kind === "water") return <Droplets className="h-3.5 w-3.5 text-blue-400" />;
  if (kind === "electrolyte") return <FlaskConical className="h-3.5 w-3.5 text-[color:var(--purple-primary)]" />;
  if (kind === "coffee" || kind === "tea") return <Coffee className="h-3.5 w-3.5" />;
  return <Droplets className="h-3.5 w-3.5" />;
}

function Stat({
  icon, label, value, tone,
}: { icon: React.ReactNode; label: string; value: string; tone: "blue" | "purple" | "amber" }) {
  const color =
    tone === "blue" ? "text-blue-400"
    : tone === "purple" ? "text-[color:var(--purple-primary)]"
    : "text-amber-400";
  return (
    <div>
      <p className={cn("flex items-center justify-center gap-1 text-[10px] uppercase tracking-wide", color)}>
        {icon}{label}
      </p>
      <p className="text-sm font-semibold mt-0.5 tabular-nums">{value}</p>
    </div>
  );
}