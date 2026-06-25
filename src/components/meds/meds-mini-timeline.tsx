import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { Pill } from "lucide-react";
import { cn } from "@/lib/utils";

type DoseRow = {
  id: string;
  scheduled_at: string;
  status: "pending" | "taken" | "missed" | "skipped" | string;
  medication: { name: string; is_rescue: boolean; kind: string } | null;
};

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

// Palette of distinguishable medication colors (used for the dot fill).
const MED_PALETTE = [
  "#10b981", // emerald
  "#38bdf8", // sky
  "#a78bfa", // violet
  "#f59e0b", // amber
  "#fb7185", // rose
  "#2dd4bf", // teal
  "#f472b6", // pink
  "#facc15", // yellow
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function colorForMed(name: string): string {
  return MED_PALETTE[hashString(name) % MED_PALETTE.length];
}

function formatTime(d: Date): string {
  const h = d.getHours();
  const m = d.getMinutes();
  const am = h < 12;
  const hh = ((h + 11) % 12) + 1;
  return m === 0 ? `${hh}${am ? "a" : "p"}` : `${hh}:${String(m).padStart(2, "0")}${am ? "a" : "p"}`;
}

/**
 * Compact horizontal day-strip of today's scheduled doses (0–24h).
 * - Each dose is a colored dot on a 24h axis.
 * - "Now" line shows current time.
 * - Tooltip-style hover shows name + time + status.
 */
export function MedsMiniTimeline({ className }: { className?: string }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [now, setNow] = React.useState(() => new Date());

  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const dayStart = startOfDay(now);
  const dayEnd = new Date(dayStart.getTime() + 86400000);

  const q = useQuery({
    enabled: !!userId,
    queryKey: ["meds-mini-timeline", userId, dayStart.toISOString()],
    queryFn: async (): Promise<DoseRow[]> => {
      const { data, error } = await supabase
        .from("medication_doses")
        .select("id, scheduled_at, status, medication:medications(name, is_rescue, kind)")
        .eq("user_id", userId!)
        .gte("scheduled_at", dayStart.toISOString())
        .lt("scheduled_at", dayEnd.toISOString())
        .order("scheduled_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).filter(
        (r: any) => r.medication && !r.medication.is_rescue && r.medication.kind !== "rescue",
      ) as DoseRow[];
    },
    // No polling: the dose set for the day is stable, and the "now" marker is
    // advanced client-side by the setNow interval below. The global 60s
    // staleTime keeps it fresh on revisit without a per-minute network call.
    staleTime: 60_000,
  });

  const doses = q.data ?? [];
  const nowPct = ((now.getTime() - dayStart.getTime()) / 86400000) * 100;
  const counts = React.useMemo(() => {
    let taken = 0, pending = 0, missed = 0;
    for (const d of doses) {
      if (d.status === "taken") taken++;
      else if (d.status === "missed") missed++;
      else if (d.status === "pending") pending++;
    }
    return { taken, pending, missed, total: doses.length };
  }, [doses]);

  if (!userId) return null;

  return (
    <div className={cn("rounded-2xl ring-1 ring-border bg-card p-4", className)}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 text-sm">
          <Pill className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Today’s doses</span>
        </div>
        <div className="text-xs text-muted-foreground tabular-nums">
          {counts.total === 0
            ? "Nothing scheduled"
            : `${counts.taken}/${counts.total} taken${counts.missed ? ` · ${counts.missed} missed` : ""}`}
        </div>
      </div>

      <div className="relative h-14">
        {/* axis */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-border" />
        {/* hour ticks */}
        {[0, 6, 12, 18, 24].map((h) => (
          <div
            key={h}
            className="absolute top-1/2 -translate-y-1/2 h-2 w-px bg-border"
            style={{ left: `${(h / 24) * 100}%` }}
          />
        ))}
        {/* now */}
        <div
          className="absolute top-0 bottom-0 w-px bg-foreground/40"
          style={{ left: `${nowPct}%` }}
          aria-hidden
        />
        {/* dose groups */}
        {groups.map((g) => {
          const pct = Math.min(100, Math.max(0, ((g.time - dayStart.getTime()) / 86400000) * 100));
          const label = formatTime(new Date(g.time));
          const collides = [0, 25, 50, 75, 100].some((p) => Math.abs(p - pct) < 4);
          const dotSize = 12; // px (h-3 w-3)
          const gap = 2; // px
          const totalW = g.items.length * dotSize + Math.max(0, g.items.length - 1) * gap;
          return (
            <div
              key={g.key}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
              style={{ left: `${pct}%` }}
              aria-label={`${g.items.map((d) => d.medication?.name ?? "Dose").join(", ")} at ${label}`}
            >
              <div className="flex items-center" style={{ gap: `${gap}px`, width: `${totalW}px` }}>
                {g.items.map((d) => {
                  const color = colorForMed(d.medication?.name ?? "dose");
                  const tooltip = `${d.medication?.name ?? "Dose"} · ${label} · ${d.status}`;
                  const isMissed = d.status === "missed";
                  const isSkipped = d.status === "skipped";
                  const isPending = d.status === "pending";
                  const bg = isMissed
                    ? "var(--destructive, #ef4444)"
                    : isSkipped
                      ? "rgba(148,163,184,0.6)"
                      : color;
                  return (
                    <span
                      key={d.id}
                      title={tooltip}
                      aria-label={tooltip}
                      className={cn(
                        "block h-3 w-3 rounded-full ring-4 ring-offset-0",
                        isPending && "opacity-70",
                      )}
                      style={{
                        backgroundColor: bg,
                        boxShadow: `0 0 0 4px ${bg}33`,
                      }}
                    />
                  );
                })}
              </div>
              {!collides && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 text-[10px] text-muted-foreground tabular-nums whitespace-nowrap">
                  {label}
                </div>
              )}
            </div>
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

      {uniqueMeds.length > 1 && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground">
          {uniqueMeds.map((m) => (
            <span key={m} className="inline-flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: colorForMed(m) }}
                aria-hidden
              />
              <span className="truncate max-w-[10rem]">{m}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}