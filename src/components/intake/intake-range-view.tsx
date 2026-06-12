import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { listHydrationForDay } from "@/lib/hydration.functions";
import { listFoodForRange } from "@/lib/food.functions";
import { localDateKey } from "@/lib/utils";
import { Droplets, UtensilsCrossed } from "lucide-react";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function IntakeRangeView({ range }: { range: "week" | "month" }) {
  const days = range === "week" ? 7 : 30;
  const today = startOfDay(new Date());
  const from = new Date(today.getTime() - (days - 1) * 86400000);
  const fromIso = from.toISOString();
  const toIso = new Date(today.getTime() + 86400000).toISOString();

  const listH = useServerFn(listHydrationForDay);
  const listF = useServerFn(listFoodForRange);

  const hydration = useQuery({
    queryKey: ["hydration-range", fromIso, toIso],
    queryFn: () => listH({ data: { from: fromIso, to: toIso } }),
  });
  const food = useQuery({
    queryKey: ["food-range", fromIso, toIso],
    queryFn: () => listF({ data: { from: fromIso, to: toIso } }),
  });

  const hRows = (hydration.data ?? []) as Array<{
    consumed_at: string;
    volume_ml: number;
    kind: string;
    notes: string | null;
  }>;
  const fRows = (food.data ?? []) as Array<{
    consumed_at: string;
    name: string;
    calories_kcal: number | null;
  }>;

  // Build per-day buckets
  const buckets = React.useMemo(() => {
    const map = new Map<
      string,
      { day: Date; label: string; water_ml: number; other_ml: number; kcal: number }
    >();
    for (let i = 0; i < days; i++) {
      const d = new Date(from.getTime() + i * 86400000);
      // Local-day keys: ISO keys are UTC dates and shift entries near local
      // midnight into the wrong bar for anyone away from UTC.
      const key = localDateKey(d);
      map.set(key, {
        day: d,
        label:
          range === "week"
            ? d.toLocaleDateString(undefined, { weekday: "short" })
            : d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        water_ml: 0,
        other_ml: 0,
        kcal: 0,
      });
    }
    for (const r of hRows) {
      const k = localDateKey(r.consumed_at);
      const b = map.get(k);
      if (!b) continue;
      if (r.kind === "water") b.water_ml += r.volume_ml;
      else b.other_ml += r.volume_ml;
    }
    for (const r of fRows) {
      const k = localDateKey(r.consumed_at);
      const b = map.get(k);
      if (!b) continue;
      b.kcal += r.calories_kcal ?? 0;
    }
    return Array.from(map.values());
  }, [hRows, fRows, days, range, from]);

  const totals = buckets.reduce(
    (a, b) => ({
      water_ml: a.water_ml + b.water_ml,
      other_ml: a.other_ml + b.other_ml,
      kcal: a.kcal + b.kcal,
    }),
    { water_ml: 0, other_ml: 0, kcal: 0 },
  );

  const avg = {
    water_ml: Math.round(totals.water_ml / days),
    kcal: Math.round(totals.kcal / days),
  };

  // Top foods
  const topFoods = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of fRows) {
      const k = r.name.trim();
      if (!k) continue;
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [fRows]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <SummaryCard
          icon={<Droplets className="h-4 w-4" />}
          label="Avg water / day"
          value={`${avg.water_ml.toLocaleString()} ml`}
          sub={`${totals.water_ml.toLocaleString()} ml total`}
        />
        <SummaryCard
          icon={<UtensilsCrossed className="h-4 w-4" />}
          label="Avg kcal / day"
          value={avg.kcal.toLocaleString()}
          sub={`${totals.kcal.toLocaleString()} total`}
        />
      </div>

      <div className="rounded-2xl ring-1 ring-border bg-card p-4">
        <div className="text-xs label-eyebrow text-muted-foreground mb-3">Water (ml) per day</div>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={buckets} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={range === "week" ? 0 : 4} />
              <YAxis tick={{ fontSize: 10 }} width={32} />
              <Tooltip cursor={{ fill: "var(--muted)" }} contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="water_ml" name="Water" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl ring-1 ring-border bg-card p-4">
        <div className="text-xs label-eyebrow text-muted-foreground mb-3">Calories per day</div>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={buckets} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={range === "week" ? 0 : 4} />
              <YAxis tick={{ fontSize: 10 }} width={32} />
              <Tooltip cursor={{ fill: "var(--muted)" }} contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="kcal" name="kcal" fill="var(--foreground)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {topFoods.length > 0 && (
        <div className="rounded-2xl ring-1 ring-border bg-card p-4">
          <div className="text-xs label-eyebrow text-muted-foreground mb-3">Most logged</div>
          <ul className="space-y-1.5 text-sm">
            {topFoods.map(([name, n]) => (
              <li key={name} className="flex items-center justify-between">
                <span className="truncate">{name}</span>
                <span className="text-xs text-muted-foreground tabular-nums">×{n}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-2xl ring-1 ring-border bg-card p-4">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-2xl font-serif tabular-nums">{value}</div>
      <div className="text-[11px] text-muted-foreground tabular-nums">{sub}</div>
    </div>
  );
}
