import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Pill, AlertCircle, CheckCheck } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { MedicationFormSheet } from "@/components/meds/medication-form-sheet";
import { MedRemindersBanner } from "@/components/meds/med-reminders-banner";
import { scheduleMedications } from "@/lib/med-notifications";
import { MetricNumber } from "@/components/ui-oura/metric-number";
import { ProgressPill } from "@/components/ui-oura/progress-pill";
import { useRouteTheme } from "@/lib/use-route-theme";
import { NarrativeBlock } from "@/components/ui-oura/v2/narrative-block";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { MedKind } from "@/components/meds/medication-form-sheet";

type Medication = {
  id: string;
  name: string;
  dosage: string | null;
  times_of_day: string[];
  pills_remaining: number | null;
  refill_threshold: number | null;
  is_rescue: boolean;
  kind: MedKind;
  active: boolean;
};

type TodayDose = {
  id: string;
  scheduled_at: string;
  status: string;
  medication: { id: string; name: string; dosage: string | null; kind: string; is_rescue: boolean } | null;
};

type FilterKind = "all" | "medication" | "supplement" | "vitamin" | "rescue";

const FILTER_CHIPS: { value: FilterKind; label: string }[] = [
  { value: "all", label: "All" },
  { value: "medication", label: "Medications" },
  { value: "supplement", label: "Supplements" },
  { value: "vitamin", label: "Vitamins" },
  { value: "rescue", label: "Rescue" },
];

const KIND_LABELS: Record<MedKind, string> = {
  medication: "Medications",
  supplement: "Supplements",
  vitamin: "Vitamins",
  herbal: "Herbal",
  rescue: "Rescue",
};

export const Route = createFileRoute("/_app/meds")({
  head: () => ({ meta: [{ title: "Meds — Purple" }] }),
  component: MedsPage,
});

function isRescueMed(m: Medication): boolean {
  return m.kind === "rescue" || m.is_rescue;
}

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
  const [todayDoses, setTodayDoses] = React.useState<TodayDose[] | null>(null);
  const [filter, setFilter] = React.useState<FilterKind>("all");
  const [open, setOpen] = React.useState(false);
  const [markingAll, setMarkingAll] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!userId) return;
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(23, 59, 59, 999);

    const [{ data, error }, { data: doses }] = await Promise.all([
      supabase
        .from("medications")
        .select("id, name, dosage, times_of_day, pills_remaining, refill_threshold, is_rescue, kind, active")
        .eq("active", true)
        .order("kind", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("medication_doses")
        .select("id, scheduled_at, status, medication:medications(id, name, dosage, kind, is_rescue)")
        .gte("scheduled_at", start.toISOString())
        .lte("scheduled_at", end.toISOString())
        .order("scheduled_at", { ascending: true }),
    ]);

    if (error) { console.error(error); return; }
    setMeds((data as Medication[]) ?? []);
    const scheduledDoses = ((doses as unknown as TodayDose[]) ?? []).filter(
      (d) => d.medication && d.medication.kind !== "rescue" && !d.medication.is_rescue,
    );
    setTodayDoses(scheduledDoses);
  }, [userId]);

  React.useEffect(() => { void load(); }, [load]);

  React.useEffect(() => {
    if (!meds) return;
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const scheduled = meds
      .filter((m) => !isRescueMed(m) && (m.times_of_day?.length ?? 0) > 0)
      .map((m) => ({
        id: m.id,
        name: m.name,
        dosage: m.dosage,
        times_of_day: m.times_of_day,
        kind: m.kind,
        is_rescue: m.is_rescue,
      }));
    void scheduleMedications(scheduled);
  }, [meds]);

  const isFirst = (meds?.filter((m) => !isRescueMed(m)).length ?? 0) === 0;

  const filteredMeds = React.useMemo(() => {
    if (!meds) return null;
    if (filter === "all") return meds;
    if (filter === "rescue") return meds.filter((m) => isRescueMed(m));
    return meds.filter((m) => m.kind === filter);
  }, [meds, filter]);

  const groupedMeds = React.useMemo(() => {
    if (!filteredMeds || filter !== "all") return null;
    const groups = new Map<MedKind, Medication[]>();
    for (const m of filteredMeds) {
      const key = isRescueMed(m) ? "rescue" : m.kind;
      const list = groups.get(key) ?? [];
      list.push(m);
      groups.set(key, list);
    }
    return groups;
  }, [filteredMeds, filter]);

  const pendingToday = todayDoses?.filter((d) => d.status === "pending") ?? [];

  const markAllTaken = async () => {
    if (pendingToday.length === 0 || markingAll) return;
    setMarkingAll(true);
    const now = new Date().toISOString();
    const ids = pendingToday.map((d) => d.id);
    const { error } = await supabase
      .from("medication_doses")
      .update({ status: "taken", taken_at: now })
      .in("id", ids);
    setMarkingAll(false);
    if (error) {
      toast.error("Could not mark doses");
      return;
    }
    toast.success("All pending doses marked taken");
    void load();
  };

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

      <div className="mt-6">
        <MedRemindersBanner />
      </div>

      {meds && meds.length > 0 && (
        <>
          <TodayDosesSection
            doses={todayDoses}
            pendingCount={pendingToday.length}
            onMarkAll={markAllTaken}
            markingAll={markingAll}
          />
          <AdherenceCard />
        </>
      )}

      {meds && meds.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip.value}
              type="button"
              onClick={() => setFilter(chip.value)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                filter === chip.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

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
      ) : filter === "all" && groupedMeds ? (
        <div className="mt-8 space-y-6">
          {(["medication", "supplement", "vitamin", "herbal", "rescue"] as MedKind[]).map((kind) => {
            const list = groupedMeds.get(kind);
            if (!list?.length) return null;
            return (
              <section key={kind}>
                <h2 className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
                  {KIND_LABELS[kind]}
                </h2>
                <ul className="space-y-2">
                  {list.map((m) => <MedRow key={m.id} med={m} />)}
                </ul>
              </section>
            );
          })}
        </div>
      ) : (
        <ul className="mt-8 space-y-2">
          {(filteredMeds ?? []).map((m) => <MedRow key={m.id} med={m} />)}
        </ul>
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

function TodayDosesSection({
  doses,
  pendingCount,
  onMarkAll,
  markingAll,
}: {
  doses: TodayDose[] | null;
  pendingCount: number;
  onMarkAll: () => void;
  markingAll: boolean;
}) {
  return (
    <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-serif text-xl text-foreground">Today&apos;s doses</h2>
        {pendingCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            onClick={onMarkAll}
            disabled={markingAll}
          >
            <CheckCheck className="h-3.5 w-3.5 mr-1" />
            Mark all taken
          </Button>
        )}
      </div>
      {doses === null ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
      ) : doses.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No scheduled doses today.</p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {doses.map((d) => (
            <li key={d.id} className="flex items-center justify-between py-2 text-sm">
              <span className="text-muted-foreground tabular-nums">
                {format(new Date(d.scheduled_at), "h:mm a")}
              </span>
              <span className="text-foreground truncate mx-3 flex-1">
                {d.medication?.name ?? "Medication"}
              </span>
              <span className="capitalize text-muted-foreground">{d.status}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function MedRow({ med }: { med: Medication }) {
  const threshold = med.refill_threshold ?? 7;
  const lowStock = med.pills_remaining !== null && med.pills_remaining <= threshold;
  return (
    <li>
      <Link
        to="/meds/$medId"
        params={{ medId: med.id }}
        className="block rounded-2xl border border-border bg-card p-5 hover:border-foreground/20 transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-serif text-lg text-foreground truncate">{med.name}</p>
              {lowStock && (
                <span className="rounded-full bg-destructive/15 text-destructive px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                  Refill soon
                </span>
              )}
            </div>
            {med.dosage && <p className="text-sm text-muted-foreground">{med.dosage}</p>}
            {!isRescueMed(med) && med.times_of_day?.length > 0 && (
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
            {isRescueMed(med) && (
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
