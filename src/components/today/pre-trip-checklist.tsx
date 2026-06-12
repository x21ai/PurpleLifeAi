import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Plane, Check, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";

type PlannedTrip = {
  id: string;
  label: string | null;
  destination_tz: string;
  depart_at: string;
  schedule_generated_at: string | null;
};

type Item = { key: string; label: string; autoDone?: boolean };

const STORAGE_PREFIX = "purple-trip-checklist-";

/**
 * Shown on Today when the user's nearest planned trip departs within 7 days.
 * Items persisted per-trip in localStorage. Some items derive from data
 * (e.g. schedule generated) so they auto-tick without user input.
 */
export function PreTripChecklist() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [trip, setTrip] = React.useState<PlannedTrip | null>(null);
  const [rescueCount, setRescueCount] = React.useState<number>(0);
  const [done, setDone] = React.useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = React.useState(false);

  React.useEffect(() => {
    if (!userId) return;
    void (async () => {
      const nowIso = new Date().toISOString();
      const sevenDays = new Date(Date.now() + 7 * 86_400_000).toISOString();
      const { data: trips } = await supabase
        .from("trips")
        .select("id, label, destination_tz, depart_at, schedule_generated_at, status")
        .gte("depart_at", nowIso)
        .lte("depart_at", sevenDays)
        .neq("status", "cancelled")
        .order("depart_at", { ascending: true })
        .limit(1);
      const t = (trips ?? [])[0] as PlannedTrip | undefined;
      setTrip(t ?? null);
      if (t) {
        const { count } = await supabase
          .from("medications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("active", true)
          .eq("is_rescue", true);
        setRescueCount(count ?? 0);
        try {
          const raw = localStorage.getItem(STORAGE_PREFIX + t.id);
          setDone(raw ? JSON.parse(raw) : {});
        } catch {
          setDone({});
        }
      }
    })();
  }, [userId]);

  if (!trip) return null;

  const items: Item[] = [
    {
      key: "schedule",
      label: "Generate medication schedule for the trip",
      autoDone: !!trip.schedule_generated_at,
    },
    ...(rescueCount > 0 ? [{ key: "rescue", label: "Pack rescue medication" }] : []),
    { key: "refills", label: "Enough pills to cover the trip" },
    { key: "doctor_letter", label: "Doctor letter / prescription copy" },
    { key: "id_card", label: "Medical ID / emergency contacts handy" },
  ];

  const isChecked = (it: Item) => it.autoDone || !!done[it.key];
  const remaining = items.filter((it) => !isChecked(it)).length;

  const toggle = (key: string) => {
    const next = { ...done, [key]: !done[key] };
    setDone(next);
    try {
      localStorage.setItem(STORAGE_PREFIX + trip.id, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const departLocal = new Date(trip.depart_at).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const destShort = (
    trip.label?.trim() ||
    trip.destination_tz.split("/").pop() ||
    trip.destination_tz
  ).replace(/_/g, " ");

  return (
    <aside
      aria-label="Pre-trip checklist"
      className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5"
    >
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="flex w-full items-start justify-between gap-3 text-left"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-primary">
            <Plane className="h-3.5 w-3.5" />
            <p className="label-eyebrow text-primary">Trip in {departLocal}</p>
          </div>
          <p className="mt-1.5 text-sm text-foreground">
            {destShort},{" "}
            {remaining === 0
              ? "you're all set"
              : `${remaining} thing${remaining === 1 ? "" : "s"} to check off`}
          </p>
        </div>
        <ChevronRight
          className={`h-4 w-4 mt-0.5 text-muted-foreground transition-transform ${collapsed ? "" : "rotate-90"}`}
        />
      </button>
      {!collapsed && (
        <ul className="mt-3 space-y-1.5">
          {items.map((it) => {
            const checked = isChecked(it);
            return (
              <li key={it.key}>
                <button
                  type="button"
                  disabled={it.autoDone}
                  onClick={() => !it.autoDone && toggle(it.key)}
                  className="flex w-full items-center gap-2.5 rounded-lg py-1 text-left text-sm disabled:cursor-default"
                >
                  <span
                    aria-hidden
                    className={`grid h-5 w-5 place-items-center rounded-md border ${
                      checked
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background"
                    }`}
                  >
                    {checked && <Check className="h-3 w-3" />}
                  </span>
                  <span
                    className={checked ? "text-muted-foreground line-through" : "text-foreground"}
                  >
                    {it.label}
                  </span>
                </button>
              </li>
            );
          })}
          <li className="pt-2">
            <Link
              to="/settings/travel"
              className="text-xs text-primary underline-offset-2 hover:underline"
            >
              Open travel settings →
            </Link>
          </li>
        </ul>
      )}
    </aside>
  );
}
