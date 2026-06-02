import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Droplets, FlaskConical } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { listHydrationForDay } from "@/lib/hydration.functions";
import { listAurasForDay } from "@/lib/auras.functions";

/**
 * Quiet pattern hint surfaced on Today when the signature
 * "lots of water, no electrolytes, aura present" combo appears.
 * Not a diagnosis — a nudge. Tap-through goes to /hydration.
 */
export function PatternHintCard() {
  const day = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const from = day.toISOString();
  const to = new Date(day.getTime() + 86400000).toISOString();

  const listH = useServerFn(listHydrationForDay);
  const listA = useServerFn(listAurasForDay);

  const hydration = useQuery({
    queryKey: ["hydration", day.toISOString()],
    queryFn: () => listH({ data: { from, to } }),
  });
  const auras = useQuery({
    queryKey: ["auras", day.toISOString()],
    queryFn: () => listA({ data: { from, to } }),
  });

  const hint = useMemo(() => {
    const rows = hydration.data ?? [];
    const a = auras.data ?? [];
    const now = Date.now();
    const sixHoursAgo = now - 6 * 3600 * 1000;

    let waterRecent = 0;
    let sodiumToday = 0;
    for (const r of rows) {
      const t = new Date(r.consumed_at).getTime();
      if (r.kind === "water" && t >= sixHoursAgo) waterRecent += r.volume_ml;
      sodiumToday += r.sodium_mg ?? 0;
    }
    const lowSodium = sodiumToday < 200;
    const highWater = waterRecent >= 1500;
    const hasAura = a.length > 0;

    if (highWater && lowSodium && hasAura) return "high-risk" as const;
    if (highWater && lowSodium) return "watch" as const;
    return null;
  }, [hydration.data, auras.data]);

  if (!hint) return null;

  const isAlert = hint === "high-risk";

  return (
    <Link
      to="/hydration"
      className={
        "mt-6 block rounded-2xl ring-1 p-4 sm:p-5 transition " +
        (isAlert
          ? "ring-amber-400/50 bg-amber-400/10 hover:bg-amber-400/15"
          : "ring-border bg-card hover:bg-secondary/40")
      }
    >
      <div className="flex items-start gap-3">
        <div
          className={
            "mt-0.5 grid h-8 w-8 place-items-center rounded-full " +
            (isAlert ? "bg-amber-400/20 text-amber-500" : "bg-muted text-muted-foreground")
          }
        >
          {isAlert ? <AlertTriangle className="h-4 w-4" /> : <Droplets className="h-4 w-4" />}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            {isAlert
              ? "Heads up — a pattern to watch right now"
              : "A lot of plain water with no electrolytes"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            {isAlert
              ? "High water intake in the last 6 hours, little to no sodium, and an aura logged today. This combo can drop sodium — a known trigger. Consider electrolytes and tell someone you trust."
              : "Drinking a lot of plain water without sodium can dilute electrolytes over time. Add a pinch of salt or an electrolyte drink if you feel off."}
          </p>
          <p className="mt-2 inline-flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">
            <FlaskConical className="h-3 w-3" /> Tap for the hydration day view
          </p>
        </div>
      </div>
    </Link>
  );
}