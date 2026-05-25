import * as React from "react";
import { format } from "date-fns";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { toast } from "sonner";
import { ChevronRight, Pill } from "lucide-react";

type Dose = {
  id: string;
  scheduled_at: string;
  status: string;
  medication: {
    id: string;
    name: string;
    dosage: string | null;
    kind: string;
    is_rescue: boolean;
  } | null;
};

function statusPillClass(status: string) {
  switch (status) {
    case "taken":
      return "bg-[color:var(--success)]/15 text-[color:var(--success)] ring-1 ring-[color:var(--success)]/30";
    case "missed":
      return "bg-destructive/15 text-destructive ring-1 ring-destructive/30";
    case "skipped":
      return "bg-muted text-muted-foreground ring-1 ring-border";
    default:
      return "bg-primary/15 text-primary ring-1 ring-primary/30";
  }
}

function isScheduledMed(d: Dose): boolean {
  if (!d.medication) return false;
  return d.medication.kind !== "rescue" && !d.medication.is_rescue;
}

export function TodayDoses() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [doses, setDoses] = React.useState<Dose[] | null>(null);

  const load = React.useCallback(async () => {
    if (!userId) return;
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(23, 59, 59, 999);
    const { data, error } = await supabase
      .from("medication_doses")
      .select("id, scheduled_at, status, medication:medications(id, name, dosage, kind, is_rescue)")
      .gte("scheduled_at", start.toISOString())
      .lte("scheduled_at", end.toISOString())
      .order("scheduled_at", { ascending: true });
    if (error) {
      console.error(error);
      return;
    }
    const rows = ((data as unknown as Dose[]) ?? []).filter(isScheduledMed);
    setDoses(rows);
  }, [userId]);

  React.useEffect(() => { void load(); }, [load]);

  const markTaken = async (id: string) => {
    const prev = doses;
    setDoses((d) => d?.map((x) => (x.id === id ? { ...x, status: "taken" } : x)) ?? null);
    const { error } = await supabase
      .from("medication_doses")
      .update({ status: "taken", taken_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      setDoses(prev);
      toast.error("Could not mark dose");
    }
  };

  if (!userId) return null;

  return (
    <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl text-foreground">Today</h2>
        <Link
          to="/meds"
          className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground gap-0.5"
        >
          Medications <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {doses === null ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
      ) : doses.length === 0 ? (
        <div className="mt-4 flex items-start gap-3 rounded-xl bg-secondary/60 p-4">
          <Pill className="h-4 w-4 mt-0.5 text-secondary-foreground/70" />
          <p className="text-sm text-secondary-foreground">
            No medications scheduled for today.{" "}
            <Link to="/meds" className="underline underline-offset-2">Add one</Link>.
          </p>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {doses.map((d) => (
            <li key={d.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <span
                className={cn(
                  "inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-medium tabular-nums",
                  statusPillClass(d.status),
                )}
              >
                {format(new Date(d.scheduled_at), "h:mm a")}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">
                  {d.medication?.name ?? "Medication"}
                </p>
                {d.medication?.dosage && (
                  <p className="text-xs text-muted-foreground truncate">{d.medication.dosage}</p>
                )}
              </div>
              {d.status === "pending" ? (
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => markTaken(d.id)}>
                  Taken
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground capitalize">{d.status}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
