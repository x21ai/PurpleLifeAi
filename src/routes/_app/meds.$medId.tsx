import * as React from "react";
import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import {
  ArrowLeft,
  Plus,
  Edit3,
  Archive,
  ArchiveRestore,
  Trash2,
  CalendarDays,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Sheet, SheetContent, SheetColumn, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MedicationFormSheet } from "@/components/meds/medication-form-sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { toast } from "sonner";
import { useRouteTheme } from "@/lib/use-route-theme";
import { buildIcs, downloadIcs, medicationToIcsEvents } from "@/lib/ics";
import { useTranslation } from "react-i18next";
import { userMessage } from "@/lib/user-message";
import { cn } from "@/lib/utils";

type Med = {
  id: string;
  name: string;
  dosage: string | null;
  dosage_amount: number | null;
  dosage_unit: string | null;
  dosage_form: string | null;
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
  start_date: string | null;
  end_date: string | null;
};

type Dose = {
  id: string;
  scheduled_at: string;
  status: string;
  amount: number | null;
  unit: string | null;
};

type DoseStatus = "taken" | "skipped" | "missed" | "pending";

const DOSE_STATUSES: DoseStatus[] = ["taken", "skipped", "missed", "pending"];

/** Local datetime-input value (YYYY-MM-DDTHH:mm) from an ISO timestamp. */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Format a YYYY-MM-DD date string for display without tz roll-over. */
function formatDateOnly(dateStr: string): string {
  return format(new Date(`${dateStr}T12:00:00`), "MMM d, yyyy");
}

/** True when a YYYY-MM-DD start date is after today (med not started yet). */
function isFutureDate(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const today = new Date();
  const todayYmd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return dateStr > todayYmd;
}

type SideEffect = {
  id: string;
  side_effect: string;
  severity: number | null;
  noted_at: string;
};

const DOSE_PAGE = 14;

export const Route = createFileRoute("/_app/meds/$medId")({
  head: () => ({ meta: [{ title: "Medication · Purple" }] }),
  component: MedDetail,
  pendingComponent: MedDetailPending,
  errorComponent: ({ reset }) => {
    const router = useRouter();
    return (
      <div className="mx-auto max-w-3xl px-5 pt-16">
        <p className="text-sm text-muted-foreground">Could not load medication.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => {
            router.invalidate();
            reset();
          }}
        >
          Try again
        </Button>
      </div>
    );
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-5 pt-16">
      <p className="text-sm text-muted-foreground">Medication not found.</p>
      <Link to="/meds" className="text-sm text-primary underline mt-2 inline-block">
        Back to medications
      </Link>
    </div>
  ),
});

function MedDetailPending() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-3xl px-5 pt-16 text-sm text-muted-foreground animate-pulse">
      {t("meds.detail.loading")}
    </div>
  );
}

function isRescueMed(m: Med): boolean {
  return m.kind === "rescue" || m.is_rescue;
}

function formatTime(t: string): string {
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr ?? "0", 10);
  const m = parseInt(mStr ?? "0", 10);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

function medStrengthDisplay(m: Med): string | null {
  if (m.dosage && m.dosage.trim()) return m.dosage;
  if (m.dosage_amount != null) {
    const unit = m.dosage_unit ? ` ${m.dosage_unit}` : "";
    const form = m.dosage_form ? ` ${m.dosage_form}` : "";
    return `${m.dosage_amount}${unit}${form}`;
  }
  return null;
}

function doseStatusClass(status: string): string {
  if (status === "taken") return "bg-primary/15 text-primary";
  if (status === "missed") return "bg-destructive/15 text-destructive";
  if (status === "skipped") return "bg-muted text-muted-foreground";
  return "bg-secondary text-secondary-foreground";
}

function MedDetail() {
  useRouteTheme("light");
  const { t } = useTranslation();
  const { medId } = Route.useParams();
  const { session } = useAuth();
  const userId = session?.user.id;
  const navigate = useNavigate();
  const [med, setMed] = React.useState<Med | null>(null);
  const [adherence, setAdherence] = React.useState<{
    scheduled: number;
    taken: number;
    pct: number;
  } | null>(null);
  const [recent, setRecent] = React.useState<Dose[]>([]);
  const [doseLimit, setDoseLimit] = React.useState(DOSE_PAGE);
  const [hasMoreDoses, setHasMoreDoses] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [sideEffects, setSideEffects] = React.useState<SideEffect[]>([]);
  const [sideEffectOpen, setSideEffectOpen] = React.useState(false);
  const [sideEffectText, setSideEffectText] = React.useState("");
  const [sideEffectSeverity, setSideEffectSeverity] = React.useState(5);
  const [savingSideEffect, setSavingSideEffect] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [homeTz, setHomeTz] = React.useState<string>("UTC");
  const [loaded, setLoaded] = React.useState(false);

  // Dose-history editing (backfill the past).
  const [doseEditOpen, setDoseEditOpen] = React.useState(false);
  const [editingDose, setEditingDose] = React.useState<Dose | null>(null);
  const [doseWhen, setDoseWhen] = React.useState("");
  const [doseStatus, setDoseStatus] = React.useState<DoseStatus>("taken");
  const [doseAmount, setDoseAmount] = React.useState("");
  const [doseUnit, setDoseUnit] = React.useState("");
  const [savingDose, setSavingDose] = React.useState(false);

  React.useEffect(() => {
    setLoaded(false);
    setMed(null);
    setAdherence(null);
    setRecent([]);
    setDoseLimit(DOSE_PAGE);
    setHasMoreDoses(false);
    setSideEffects([]);
  }, [medId]);

  const loadDoses = React.useCallback(
    async (limit: number) => {
      const { data: doses } = await supabase
        .from("medication_doses")
        .select("id, scheduled_at, status, amount, unit")
        .eq("medication_id", medId)
        .order("scheduled_at", { ascending: false })
        .limit(limit + 1);
      const rows = (doses as Dose[]) ?? [];
      setHasMoreDoses(rows.length > limit);
      setRecent(rows.slice(0, limit));
    },
    [medId],
  );

  const load = React.useCallback(async () => {
    if (!userId) return;
    const [{ data: m }, { data: adh }, { data: effects }, { data: prof }] = await Promise.all([
      supabase.from("medications").select("*").eq("id", medId).maybeSingle(),
      supabase.rpc("medication_adherence", { med_id: medId, days_back: 14 }),
      supabase
        .from("medication_side_effects")
        .select("id, side_effect, severity, noted_at")
        .eq("medication_id", medId)
        .order("noted_at", { ascending: false }),
      supabase.from("profiles").select("timezone").eq("id", userId).maybeSingle(),
    ]);
    setMed((m as Med) ?? null);
    const row = (
      adh as Array<{ scheduled_count: number; taken_count: number; adherence_pct: number }>
    )?.[0];
    if (row)
      setAdherence({
        scheduled: Number(row.scheduled_count),
        taken: Number(row.taken_count),
        pct: Number(row.adherence_pct),
      });
    setSideEffects((effects as SideEffect[]) ?? []);
    setHomeTz(
      (prof as { timezone: string | null } | null)?.timezone ??
        Intl.DateTimeFormat().resolvedOptions().timeZone ??
        "UTC",
    );
    await loadDoses(DOSE_PAGE);
    setLoaded(true);
  }, [medId, userId, loadDoses]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    if (loaded && med) window.scrollTo(0, 0);
  }, [medId, loaded, med]);

  const loadMoreDoses = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    const next = doseLimit + DOSE_PAGE;
    await loadDoses(next);
    setDoseLimit(next);
    setLoadingMore(false);
  };

  const openEditDose = (dose: Dose | null) => {
    setEditingDose(dose);
    if (dose) {
      setDoseWhen(toLocalInput(dose.scheduled_at));
      setDoseStatus(
        (DOSE_STATUSES.includes(dose.status as DoseStatus) ? dose.status : "taken") as DoseStatus,
      );
      setDoseAmount(dose.amount != null ? String(dose.amount) : "");
      setDoseUnit(dose.unit ?? med?.dosage_unit ?? "");
    } else {
      setDoseWhen(toLocalInput(new Date().toISOString()));
      setDoseStatus("taken");
      setDoseAmount(med?.dosage_amount != null ? String(med.dosage_amount) : "");
      setDoseUnit(med?.dosage_unit ?? "");
    }
    setDoseEditOpen(true);
  };

  const saveDose = async () => {
    if (!userId || !med || savingDose || !doseWhen) return;
    setSavingDose(true);
    const scheduledAt = new Date(doseWhen).toISOString();
    const amount = doseAmount.trim() ? parseFloat(doseAmount) : null;
    const unit = doseUnit.trim() || null;
    const takenAt = doseStatus === "taken" ? scheduledAt : null;
    // Pill counts are adjusted automatically by the DB trigger
    // trg_medication_doses_pill_stock when a dose enters/leaves 'taken'.
    let error: unknown = null;
    if (editingDose) {
      error = (
        await supabase
          .from("medication_doses")
          .update({
            scheduled_at: scheduledAt,
            status: doseStatus,
            amount,
            unit,
            taken_at: takenAt,
          })
          .eq("id", editingDose.id)
      ).error;
    } else {
      error = (
        await supabase.from("medication_doses").insert({
          user_id: userId,
          medication_id: med.id,
          scheduled_at: scheduledAt,
          status: doseStatus,
          amount,
          unit,
          taken_at: takenAt,
          created_by_kind: "user",
        })
      ).error;
    }
    setSavingDose(false);
    if (error) {
      toast.error(userMessage(error, "That didn't work. Try again in a moment."));
      return;
    }
    toast.success(editingDose ? "Dose updated" : "Dose added");
    setDoseEditOpen(false);
    setEditingDose(null);
    await load();
    await loadDoses(doseLimit);
  };

  if (!loaded) {
    return <MedDetailPending />;
  }

  if (!med) {
    return (
      <div className="mx-auto max-w-3xl px-5 pt-16">
        <p className="text-sm text-muted-foreground">{t("meds.detail.notFound")}</p>
        <Link to="/meds" className="text-sm text-primary underline mt-2 inline-block">
          {t("meds.detail.back")}
        </Link>
      </div>
    );
  }

  const archive = async () => {
    if (!window.confirm(`Archive ${med.name}? You can re-add it later.`)) return;
    const { error } = await supabase.from("medications").update({ active: false }).eq("id", med.id);
    if (error) {
      toast.error(userMessage(error, "That didn't work. Try again in a moment."));
      return;
    }
    toast.success("Medication archived");
    navigate({ to: "/meds" });
  };

  const restore = async () => {
    const { error } = await supabase.from("medications").update({ active: true }).eq("id", med.id);
    if (error) {
      toast.error(userMessage(error, "That didn't work. Try again in a moment."));
      return;
    }
    toast.success("Medication restored");
    void load();
  };

  const destroy = async () => {
    await supabase.from("medication_doses").delete().eq("medication_id", med.id);
    await supabase.from("medication_side_effects").delete().eq("medication_id", med.id);
    const { error } = await supabase.from("medications").delete().eq("id", med.id);
    if (error) {
      toast.error(userMessage(error, "That didn't work. Try again in a moment."));
      return;
    }
    toast.success(`${med.name} deleted`);
    navigate({ to: "/meds" });
  };

  const logSideEffect = async () => {
    if (!userId || !sideEffectText.trim() || savingSideEffect) return;
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

  const exportToCalendar = () => {
    if (isRescueMed(med) || med.times_of_day.length === 0) {
      toast.error("No schedule to export for this medication.");
      return;
    }
    const events = medicationToIcsEvents({
      medId: med.id,
      medName: med.name,
      dosage: med.dosage,
      timesOfDay: med.times_of_day,
      days: 30,
      homeTz,
    });
    if (events.length === 0) {
      toast.error("Could not build calendar events.");
      return;
    }
    const ics = buildIcs(`${med.name} · Purple`, events);
    downloadIcs(`${med.name.replace(/\s+/g, "-").toLowerCase()}-30d`, ics);
    toast.success("Calendar file downloaded. Open it to add to Apple or Google Calendar.");
  };

  const prescriber = med.prescriber_name || med.prescriber;
  const threshold = med.refill_threshold ?? 7;
  const lowStock = med.pills_remaining !== null && med.pills_remaining <= threshold;
  const strength = medStrengthDisplay(med);
  const startsInFuture = isFutureDate(med.start_date);

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-10 lg:px-16 pt-10 sm:pt-16 lg:pt-20 pb-24">
      <div className="flex items-start justify-between gap-4">
        <Link
          to="/meds"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground gap-1"
        >
          <ArrowLeft className="h-4 w-4" /> {t("nav.medications")}
        </Link>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => setEditOpen(true)}
          >
            <Edit3 className="h-3.5 w-3.5 mr-1" /> {t("meds.detail.edit")}
          </Button>
          {med.active ? (
            <Button variant="outline" size="sm" className="rounded-full" onClick={archive}>
              <Archive className="h-3.5 w-3.5 mr-1" /> {t("meds.detail.archive")}
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="rounded-full" onClick={restore}>
              <ArchiveRestore className="h-3.5 w-3.5 mr-1" /> {t("meds.detail.restore")}
            </Button>
          )}
        </div>
      </div>

      <p className="mt-6 label-eyebrow text-muted-foreground">{t("meds.detail.eyebrow")}</p>
      <h1 className="mt-2 app-hero-title text-[32px] sm:text-[40px] text-foreground">
        {med.name}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("meds.detail.subtitle")}</p>
      {!med.active && (
        <span className="mt-3 inline-block rounded-full bg-muted text-muted-foreground px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
          {t("meds.archived")}
        </span>
      )}
      {strength && <p className="mt-3 font-serif text-xl text-foreground/70">{strength}</p>}
      {prescriber && (
        <p className="mt-1 text-sm text-muted-foreground">
          {t("meds.detail.prescribedBy", { name: prescriber })}
        </p>
      )}
      {med.pharmacy_name && (
        <p className="mt-1 text-sm text-muted-foreground">
          {t("meds.detail.pharmacyLabel", { name: med.pharmacy_name })}
        </p>
      )}
      {startsInFuture && med.start_date && (
        <p className="mt-1 text-sm text-primary">
          {t("meds.detail.scheduledToStart", { date: formatDateOnly(med.start_date) })}
        </p>
      )}
      {!startsInFuture && med.start_date && (
        <p className="mt-1 text-xs text-muted-foreground">
          {t("meds.detail.startsOn", { date: formatDateOnly(med.start_date) })}
        </p>
      )}
      {med.end_date && (
        <p className="mt-1 text-xs text-muted-foreground">
          {t("meds.detail.stopsOn", { date: formatDateOnly(med.end_date) })}
        </p>
      )}

      {!isRescueMed(med) && !startsInFuture && (
        <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            {t("meds.detail.adherence")}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{t("meds.detail.last14Days")}</p>
          {adherence ? (
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-5xl font-medium tabular-nums text-primary">
                {adherence.pct}%
              </span>
              <span className="text-sm text-muted-foreground">
                {t("meds.detail.dosesTaken", {
                  taken: adherence.taken,
                  scheduled: adherence.scheduled,
                })}
              </span>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">{t("meds.detail.adherenceEmpty")}</p>
          )}
        </section>
      )}

      <p className="mt-8 mb-2 px-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
        {t("meds.detail.doseHistory")}
      </p>
      <section className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border gap-3">
          <p className="text-xs text-muted-foreground min-w-0">{t("meds.detail.historyHint")}</p>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full h-8 shrink-0"
            onClick={() => openEditDose(null)}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> {t("meds.detail.addPastDose")}
          </Button>
        </div>
        {recent.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">
            {t("meds.detail.noDoseHistory")}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {recent.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => openEditDose(d)}
                  className="flex w-full items-center justify-between px-5 py-3 text-sm text-left hover:bg-secondary/40 transition-colors"
                >
                  <span className="text-muted-foreground tabular-nums">
                    {format(new Date(d.scheduled_at), "MMM d, yyyy · h:mm a")}
                  </span>
                  <span className="flex items-center gap-2 shrink-0">
                    {d.amount != null && (
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {d.amount}
                        {d.unit ? ` ${d.unit}` : ""}
                      </span>
                    )}
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide capitalize",
                        doseStatusClass(d.status),
                      )}
                    >
                      {d.status}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {hasMoreDoses && (
          <div className="border-t border-border px-5 py-3">
            <Button
              variant="ghost"
              size="sm"
              className="w-full rounded-full"
              disabled={loadingMore}
              onClick={() => void loadMoreDoses()}
            >
              {t("meds.detail.loadMore")}
            </Button>
          </div>
        )}
      </section>

      <p className="mt-6 mb-2 px-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
        {t("meds.detail.schedule")}
      </p>
      <section className="rounded-2xl border border-border bg-card px-5 py-4">
        {isRescueMed(med) ? (
          <p className="text-sm text-muted-foreground">{t("meds.detail.rescueNote")}</p>
        ) : med.times_of_day.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("meds.detail.noTimes")}</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {med.times_of_day.map((time) => (
              <li
                key={time}
                className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground tabular-nums"
              >
                {formatTime(time)}
              </li>
            ))}
          </ul>
        )}
        {med.pills_remaining !== null && (
          <p
            className={cn("mt-4 text-sm", lowStock ? "text-destructive" : "text-muted-foreground")}
          >
            {t("meds.detail.pillsRemaining")}:{" "}
            <span className="font-medium">{med.pills_remaining}</span>
            {lowStock && `, ${t("meds.detail.refillTime")}`}
          </p>
        )}
      </section>

      <p className="mt-6 mb-2 px-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
        {t("meds.detail.sideEffects")}
      </p>
      <section className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <span className="text-sm font-medium text-foreground">
            {t("meds.detail.sideEffects")}
          </span>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full h-8"
            onClick={() => setSideEffectOpen(true)}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> {t("meds.detail.logSideEffect")}
          </Button>
        </div>
        {sideEffects.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">
            {t("meds.detail.noSideEffects")}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {sideEffects.map((e) => (
              <li key={e.id} className="px-5 py-3 text-sm">
                <p className="text-foreground">{e.side_effect}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Severity {e.severity ?? "–"}/10 · {format(new Date(e.noted_at), "MMM d, yyyy")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-dashed border-border bg-card/50 px-5 py-4">
        <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
          {t("meds.detail.interactions")}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">{t("meds.detail.interactionsNote")}</p>
      </section>

      <div className="mt-8 flex flex-wrap gap-2">
        {!isRescueMed(med) && med.times_of_day.length > 0 && (
          <Button variant="outline" className="rounded-full" onClick={exportToCalendar}>
            <CalendarDays className="h-4 w-4 mr-1.5" /> {t("meds.detail.exportCalendar")}
          </Button>
        )}
        {med.active ? (
          <Button variant="outline" className="rounded-full" onClick={archive}>
            <Archive className="h-4 w-4 mr-1.5" /> {t("meds.detail.archive")}
          </Button>
        ) : (
          <>
            <Button variant="outline" className="rounded-full" onClick={restore}>
              <ArchiveRestore className="h-4 w-4 mr-1.5" /> {t("meds.detail.restore")}
            </Button>
            <Button
              variant="outline"
              className="rounded-full text-destructive hover:text-destructive border-destructive/30"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-4 w-4 mr-1.5" /> {t("meds.detail.delete")}
            </Button>
          </>
        )}
      </div>

      <MedicationFormSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={load}
        isFirstMedication={false}
        editingMedId={editOpen ? med.id : null}
      />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {med.name} permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the medication along with its dose history and logged side effects. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={destroy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={doseEditOpen} onOpenChange={setDoseEditOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetColumn className="max-w-md">
            <SheetHeader>
              <SheetTitle className="font-serif font-normal">
                {editingDose ? t("meds.detail.editDose") : t("meds.detail.addPastDose")}
              </SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dose-when">{t("meds.detail.dateTime")}</Label>
                <Input
                  id="dose-when"
                  type="datetime-local"
                  value={doseWhen}
                  onChange={(e) => setDoseWhen(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("meds.detail.status")}</Label>
                <ToggleGroup
                  type="single"
                  value={doseStatus}
                  onValueChange={(v) => v && setDoseStatus(v as DoseStatus)}
                  className="flex flex-wrap justify-start gap-1.5"
                >
                  {DOSE_STATUSES.map((s) => (
                    <ToggleGroupItem
                      key={s}
                      value={s}
                      className="rounded-full px-3 text-xs capitalize data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                    >
                      {t(`meds.detail.status_${s}`)}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dose-amount">{t("meds.detail.doseAmount")}</Label>
                <div className="flex gap-2">
                  <Input
                    id="dose-amount"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    value={doseAmount}
                    onChange={(e) => setDoseAmount(e.target.value)}
                    placeholder={med.dosage_amount != null ? String(med.dosage_amount) : "amount"}
                    className="max-w-[140px]"
                  />
                  <Input
                    value={doseUnit}
                    onChange={(e) => setDoseUnit(e.target.value)}
                    placeholder={med.dosage_unit ?? "mg"}
                    className="max-w-[100px]"
                  />
                </div>
              </div>
              <Button
                className="w-full rounded-full"
                onClick={saveDose}
                disabled={!doseWhen || savingDose}
              >
                {t("meds.detail.save")}
              </Button>
            </div>
          </SheetColumn>
        </SheetContent>
      </Sheet>

      <Sheet open={sideEffectOpen} onOpenChange={setSideEffectOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetColumn className="max-w-md">
            <SheetHeader>
              <SheetTitle className="font-serif font-normal">
                {t("meds.detail.logSideEffect")}
              </SheetTitle>
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
              <Button
                className="w-full rounded-full"
                onClick={logSideEffect}
                disabled={!sideEffectText.trim() || savingSideEffect}
              >
                Save
              </Button>
            </div>
          </SheetColumn>
        </SheetContent>
      </Sheet>
    </div>
  );
}
