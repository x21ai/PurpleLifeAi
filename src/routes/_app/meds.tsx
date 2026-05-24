import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Pill, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { MedicationFormSheet } from "@/components/meds/medication-form-sheet";
import { scheduleMedications } from "@/lib/med-notifications";
import { MetricNumber } from "@/components/ui-oura/metric-number";
import { ProgressPill } from "@/components/ui-oura/progress-pill";
import { useRouteTheme } from "@/lib/use-route-theme";
import { NarrativeBlock } from "@/components/ui-oura/v2/narrative-block";

type Medication = {
  id: string;
  name: string;
  dosage: string | null;
  times_of_day: string[];
  pills_remaining: number | null;
  is_rescue: boolean;
  active: boolean;
};

export const Route = createFileRoute("/_app/meds")({
  head: () => ({ meta: [{ title: "Meds — Purple" }] }),
  component: MedsPage,
});

function formatTime(t: string): string {
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr ?? "0", 10);
  const m = parseInt(mStr ?? "0", 10);
  const am = h < 12;
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(m).padStart(2, "0")} ${am ? "AM" : "PM"}`;
}

function MedsPage() {
  useRouteTheme("light");
  const { session } = useAuth();
  const userId = session?.user.id;
  const [meds, setMeds] = React.useState<Medication[] | null>(null);
  const [open, setOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("medications")
      .select("id, name, dosage, times_of_day, pills_remaining, is_rescue, active")
      .eq("active", true)
      .order("is_rescue", { ascending: true })
      .order("name", { ascending: true });
    if (error) { console.error(error); return; }
    setMeds((data as Medication[]) ?? []);
  }, [userId]);

  React.useEffect(() => { void load(); }, [load]);

  // Re-arm reminders whenever the list changes.
  React.useEffect(() => {
    if (!meds) return;
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const scheduled = meds
      .filter((m) => !m.is_rescue && (m.times_of_day?.length ?? 0) > 0)
      .map((m) => ({ id: m.id, name: m.name, dosage: m.dosage, times_of_day: m.times_of_day }));
    void scheduleMedications(scheduled);
  }, [meds]);

  const isFirst = (meds?.filter((m) => !m.is_rescue).length ?? 0) === 0;
  const scheduled = meds?.filter((m) => !m.is_rescue) ?? [];
  const rescue = meds?.filter((m) => m.is_rescue) ?? [];

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-10 lg:px-16 pt-12 sm:pt-20 lg:pt-24 pb-32 relative">
      <p className="label-eyebrow text-muted-foreground">Medications</p>
      <h1 className="mt-3 font-serif text-[44px] sm:text-6xl lg:text-7xl leading-[1.02] tracking-[-0.02em] text-foreground">
        Your schedule,<br/>your record.
      </h1>
      <div className="mt-8">
        <NarrativeBlock>
          Tap a med to see how you've been doing. Purple keeps a quiet ledger and nudges only when it matters.
        </NarrativeBlock>
      </div>

      {meds && meds.length > 0 && <AdherenceCard />}

      {meds === null ? (
        <p className="mt-10 text-sm text-muted-foreground">Loading…</p>
      ) : meds.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <Pill className="h-6 w-6 mx-auto text-muted-foreground" />
          <p className="mt-3 font-serif text-lg text-foreground">Add the medications you take.</p>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
            I will remind you and watch for missed doses.
          </p>
          <Button className="mt-5 rounded-full" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add a medication
          </Button>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {scheduled.length > 0 && (
            <section>
              <h2 className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Scheduled</h2>
              <ul className="space-y-2">
                {scheduled.map((m) => <MedRow key={m.id} med={m} />)}
              </ul>
            </section>
          )}
          {rescue.length > 0 && (
            <section>
              <h2 className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Rescue</h2>
              <ul className="space-y-2">
                {rescue.map((m) => <MedRow key={m.id} med={m} />)}
              </ul>
            </section>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Add medication"
        className="fixed bottom-24 sm:bottom-8 right-5 sm:right-8 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
      >
        <Plus className="h-6 w-6" />
      </button>

      <MedicationFormSheet
        open={open}
        onOpenChange={setOpen}
        onSaved={load}
        isFirstMedication={isFirst}
      />
    </div>
  );
}

function MedRow({ med }: { med: Medication }) {
  const lowStock = med.pills_remaining !== null && med.pills_remaining <= 7;
  return (
    <li>
      <Link
        to="/meds/$medId"
        params={{ medId: med.id }}
        className="block rounded-2xl border border-border bg-card p-5 hover:border-foreground/20 transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-serif text-lg text-foreground truncate">{med.name}</p>
            {med.dosage && <p className="text-sm text-muted-foreground">{med.dosage}</p>}
            {!med.is_rescue && med.times_of_day?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {med.times_of_day.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium tabular-nums text-secondary-foreground"
                  >
                    {formatTime(t)}
                  </span>
                ))}
              </div>
            )}
            {med.is_rescue && (
              <p className="mt-3 label-eyebrow">As needed</p>
            )}
          </div>
          {med.pills_remaining !== null && (
            <div className={`text-right shrink-0 ${lowStock ? "text-destructive" : "text-muted-foreground"}`}>
              <p className="label-eyebrow">Pills</p>
              <p className="font-serif text-2xl tabular-nums flex items-center gap-1 justify-end mt-1">
                {lowStock && <AlertCircle className="h-3.5 w-3.5" />}
                {med.pills_remaining}
              </p>
            </div>
          )}
        </div>
      </Link>
    </li>
  );
}

function AdherenceCard() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [pct, setPct] = React.useState<number | null>(null);
  const [counts, setCounts] = React.useState<{ taken: number; total: number } | null>(null);

  React.useEffect(() => {
    if (!userId) return;
    const since = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();
    const now = new Date().toISOString();
    void (async () => {
      const { data } = await supabase
        .from("medication_doses")
        .select("status")
        .gte("scheduled_at", since)
        .lte("scheduled_at", now);
      const rows = (data ?? []) as { status: string }[];
      const total = rows.length;
      const taken = rows.filter((r) => r.status === "taken").length;
      setCounts({ taken, total });
      setPct(total === 0 ? null : Math.round((taken / total) * 100));
    })();
  }, [userId]);

  return (
    <section className="mt-10 border-y border-border py-7">
      <div className="flex items-end justify-between gap-6">
        <MetricNumber
          size="lg"
          value={pct == null ? "—" : `${pct}%`}
          label="Adherence · 14d"
        />
        {counts && counts.total > 0 && (
          <p className="text-xs text-muted-foreground pb-2 tabular-nums">
            {counts.taken} of {counts.total} doses
          </p>
        )}
      </div>
      <div className="mt-5">
        <ProgressPill
          label="On schedule"
          value={pct == null ? "—" : `${pct}%`}
          pct={pct ?? 0}
          tone={pct != null && pct < 70 ? "alert" : "ink"}
        />
      </div>
    </section>
  );
}