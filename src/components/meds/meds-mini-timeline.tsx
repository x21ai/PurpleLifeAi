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

function dotStyle(status: string): string {
  switch (status) {
    case "taken": return "bg-[color:var(--success,theme(colors.green.500))] ring-[color:var(--success,theme(colors.green.500))]/30";
    case "missed": return "bg-destructive ring-destructive/30";
    case "skipped": return "bg-muted-foreground/60 ring-muted-foreground/20";
    default: return "bg-primary ring-primary/30";
  }
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
    refetchInterval: 60_000,
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

      <div className="relative h-10">
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
        {/* dots */}
        {doses.map((d) => {
          const t = new Date(d.scheduled_at).getTime();
          const pct = Math.min(100, Math.max(0, ((t - dayStart.getTime()) / 86400000) * 100));
          const tooltip = `${d.medication?.name ?? "Dose"} · ${new Date(d.scheduled_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} · ${d.status}`;
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
    </div>
  );
}