import * as React from "react";
import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { toast } from "sonner";
import { useRouteTheme } from "@/lib/use-route-theme";

type Med = {
  id: string;
  name: string;
  dosage: string | null;
  prescriber: string | null;
  times_of_day: string[];
  pills_remaining: number | null;
  is_rescue: boolean;
  active: boolean;
  notes: string | null;
};

type Dose = { id: string; scheduled_at: string; status: string };

export const Route = createFileRoute("/_app/meds/$medId")({
  head: () => ({ meta: [{ title: "Medication — Purple" }] }),
  component: MedDetail,
  errorComponent: ({ reset }) => {
    const router = useRouter();
    return (
      <div className="mx-auto max-w-2xl px-5 pt-16">
        <p className="text-sm text-muted-foreground">Could not load medication.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => { router.invalidate(); reset(); }}
        >Try again</Button>
      </div>
    );
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-5 pt-16">
      <p className="text-sm text-muted-foreground">Medication not found.</p>
      <Link to="/meds" className="text-sm text-primary underline mt-2 inline-block">Back to medications</Link>
    </div>
  ),
});

function formatTime(t: string): string {
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr ?? "0", 10);
  const m = parseInt(mStr ?? "0", 10);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

function MedDetail() {
  useRouteTheme("light");
  const { medId } = Route.useParams();
  const { session } = useAuth();
  const userId = session?.user.id;
  const navigate = useNavigate();
  const [med, setMed] = React.useState<Med | null>(null);
  const [adherence, setAdherence] = React.useState<{ scheduled: number; taken: number; pct: number } | null>(null);
  const [recent, setRecent] = React.useState<Dose[]>([]);

  const load = React.useCallback(async () => {
    if (!userId) return;
    const [{ data: m }, { data: adh }, { data: doses }] = await Promise.all([
      supabase.from("medications").select("*").eq("id", medId).maybeSingle(),
      supabase.rpc("medication_adherence", { med_id: medId, days_back: 14 }),
      supabase
        .from("medication_doses")
        .select("id, scheduled_at, status")
        .eq("medication_id", medId)
        .order("scheduled_at", { ascending: false })
        .limit(14),
    ]);
    setMed((m as Med) ?? null);
    const row = (adh as Array<{ scheduled_count: number; taken_count: number; adherence_pct: number }>)?.[0];
    if (row) setAdherence({ scheduled: Number(row.scheduled_count), taken: Number(row.taken_count), pct: Number(row.adherence_pct) });
    setRecent((doses as Dose[]) ?? []);
  }, [medId, userId]);

  React.useEffect(() => { void load(); }, [load]);

  const archive = async () => {
    if (!med) return;
    if (!window.confirm(`Archive ${med.name}? You can re-add it later.`)) return;
    const { error } = await supabase.from("medications").update({ active: false }).eq("id", med.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Medication archived");
    navigate({ to: "/meds" });
  };

  if (!med) {
    return <div className="mx-auto max-w-2xl px-5 pt-16 text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-10 lg:px-16 pt-10 sm:pt-16 lg:pt-20 pb-24">
      <Link to="/meds" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground gap-1">
        <ArrowLeft className="h-4 w-4" /> Medications
      </Link>

      <h1 className="mt-6 font-serif text-[44px] sm:text-6xl lg:text-7xl leading-[1.02] tracking-[-0.02em] text-foreground">
        {med.name}
      </h1>
      {med.dosage && <p className="mt-3 font-serif text-xl text-foreground/70">{med.dosage}</p>}
      {med.prescriber && <p className="mt-1 text-sm text-muted-foreground">Prescribed by {med.prescriber}</p>}

      {!med.is_rescue && (
        <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="font-serif text-xl text-foreground">Adherence</h2>
          <p className="text-xs text-muted-foreground">Last 14 days</p>
          {adherence ? (
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-5xl font-medium tabular-nums text-primary">{adherence.pct}%</span>
              <span className="text-sm text-muted-foreground">
                {adherence.taken} of {adherence.scheduled} doses taken
              </span>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">No data yet.</p>
          )}
        </section>
      )}

      <section className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="font-serif text-xl text-foreground">Schedule</h2>
        {med.is_rescue ? (
          <p className="mt-2 text-sm text-muted-foreground">Rescue medication — taken as needed.</p>
        ) : med.times_of_day.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No times set.</p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-2">
            {med.times_of_day.map((t) => (
              <li key={t} className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">{formatTime(t)}</li>
            ))}
          </ul>
        )}
        {med.pills_remaining !== null && (
          <p className="mt-4 text-sm text-muted-foreground">
            Pills remaining: <span className="text-foreground font-medium">{med.pills_remaining}</span>
          </p>
        )}
      </section>

      {recent.length > 0 && (
        <section className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="font-serif text-xl text-foreground">Recent doses</h2>
          <ul className="mt-3 divide-y divide-border">
            {recent.map((d) => (
              <li key={d.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-muted-foreground">
                  {format(new Date(d.scheduled_at), "MMM d, h:mm a")}
                </span>
                <span className="capitalize text-foreground">{d.status}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8">
        <Button variant="outline" onClick={archive}>Archive medication</Button>
      </div>
    </div>
  );
}