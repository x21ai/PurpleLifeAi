import * as React from "react";
import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Plus } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { toast } from "sonner";
import { useRouteTheme } from "@/lib/use-route-theme";

type Med = {
  id: string;
  name: string;
  dosage: string | null;
  prescriber: string | null;
  prescriber_name: string | null;
  pharmacy_name: string | null;
  prescription_number: string | null;
  times_of_day: string[];
  pills_remaining: number | null;
  refill_threshold: number | null;
  is_rescue: boolean;
  kind: string;
  active: boolean;
  notes: string | null;
};

type Dose = { id: string; scheduled_at: string; status: string };

type SideEffect = {
  id: string;
  side_effect: string;
  severity: number | null;
  noted_at: string;
};

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

function isRescueMed(m: Med): boolean {
  return m.kind === "rescue" || m.is_rescue;
}

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
  const [sideEffects, setSideEffects] = React.useState<SideEffect[]>([]);
  const [sideEffectOpen, setSideEffectOpen] = React.useState(false);
  const [sideEffectText, setSideEffectText] = React.useState("");
  const [sideEffectSeverity, setSideEffectSeverity] = React.useState(5);
  const [savingSideEffect, setSavingSideEffect] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!userId) return;
    const [{ data: m }, { data: adh }, { data: doses }, { data: effects }] = await Promise.all([
      supabase.from("medications").select("*").eq("id", medId).maybeSingle(),
      supabase.rpc("medication_adherence", { med_id: medId, days_back: 14 }),
      supabase
        .from("medication_doses")
        .select("id, scheduled_at, status")
        .eq("medication_id", medId)
        .order("scheduled_at", { ascending: false })
        .limit(14),
      supabase
        .from("medication_side_effects")
        .select("id, side_effect, severity, noted_at")
        .eq("medication_id", medId)
        .order("noted_at", { ascending: false }),
    ]);
    setMed((m as Med) ?? null);
    const row = (adh as Array<{ scheduled_count: number; taken_count: number; adherence_pct: number }>)?.[0];
    if (row) setAdherence({ scheduled: Number(row.scheduled_count), taken: Number(row.taken_count), pct: Number(row.adherence_pct) });
    setRecent((doses as Dose[]) ?? []);
    setSideEffects((effects as SideEffect[]) ?? []);
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

  const logSideEffect = async () => {
    if (!userId || !med || !sideEffectText.trim() || savingSideEffect) return;
    setSavingSideEffect(true);
    const { error } = await supabase.from("medication_side_effects").insert({
      user_id: userId,
      medication_id: med.id,
      side_effect: sideEffectText.trim(),
      severity: sideEffectSeverity,
    });
    setSavingSideEffect(false);
    if (error) {
      toast.error("Could not log side effect");
      return;
    }
    toast.success("Side effect logged");
    setSideEffectText("");
    setSideEffectSeverity(5);
    setSideEffectOpen(false);
    void load();
  };

  if (!med) {
    return <div className="mx-auto max-w-2xl px-5 pt-16 text-sm text-muted-foreground">Loading…</div>;
  }

  const prescriber = med.prescriber_name || med.prescriber;
  const threshold = med.refill_threshold ?? 7;
  const lowStock = med.pills_remaining !== null && med.pills_remaining <= threshold;

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-10 lg:px-16 pt-10 sm:pt-16 lg:pt-20 pb-24">
      <Link to="/meds" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground gap-1">
        <ArrowLeft className="h-4 w-4" /> Medications
      </Link>

      <h1 className="mt-6 font-serif text-[44px] sm:text-6xl lg:text-7xl leading-[1.02] tracking-[-0.02em] text-foreground">
        {med.name}
      </h1>
      {med.dosage && <p className="mt-3 font-serif text-xl text-foreground/70">{med.dosage}</p>}
      {prescriber && <p className="mt-1 text-sm text-muted-foreground">Prescribed by {prescriber}</p>}
      {med.pharmacy_name && <p className="mt-1 text-sm text-muted-foreground">Pharmacy: {med.pharmacy_name}</p>}

      {!isRescueMed(med) && (
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
        {isRescueMed(med) ? (
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
          <p className={`mt-4 text-sm ${lowStock ? "text-destructive" : "text-muted-foreground"}`}>
            Pills remaining: <span className="font-medium">{med.pills_remaining}</span>
            {lowStock && " — time to refill"}
          </p>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-xl text-foreground">Side effects</h2>
          <Button size="sm" variant="outline" className="rounded-full" onClick={() => setSideEffectOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Log side effect
          </Button>
        </div>
        {sideEffects.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Nothing logged yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {sideEffects.map((e) => (
              <li key={e.id} className="py-3 text-sm">
                <p className="text-foreground">{e.side_effect}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Severity {e.severity ?? "—"}/10 · {format(new Date(e.noted_at), "MMM d, yyyy")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-dashed border-border bg-card/50 p-5 sm:p-6">
        <h2 className="font-serif text-xl text-foreground">Interactions</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We&apos;re working on interaction warnings. For now, please confirm with your pharmacist when adding a new medication.
        </p>
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

      <Sheet open={sideEffectOpen} onOpenChange={setSideEffectOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="font-serif font-normal">Log a side effect</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="side-effect">What did you notice?</Label>
              <Input
                id="side-effect"
                value={sideEffectText}
                onChange={(e) => setSideEffectText(e.target.value)}
                placeholder="e.g. fatigue, dizziness"
              />
            </div>
            <div className="space-y-2">
              <Label>Severity: {sideEffectSeverity}/10</Label>
              <Slider
                min={1}
                max={10}
                step={1}
                value={[sideEffectSeverity]}
                onValueChange={(v) => setSideEffectSeverity(v[0] ?? 5)}
              />
            </div>
            <Button className="w-full rounded-full" onClick={logSideEffect} disabled={!sideEffectText.trim() || savingSideEffect}>
              Save
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
