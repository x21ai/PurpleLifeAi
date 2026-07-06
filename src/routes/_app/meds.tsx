import * as React from "react";
import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { z } from "zod";
import {
  Plus,
  Pill,
  MoreVertical,
  Edit3,
  Archive,
  ArchiveRestore,
  Trash2,
  CalendarDays,
  Camera,
  Mic,
  ChevronRight,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { MedicationFormSheet, type MedPrefill } from "@/components/meds/medication-form-sheet";
import { ScanMedSheet } from "@/components/meds/scan-med-sheet";
import { VoiceMedSheet } from "@/components/meds/voice-med-sheet";
import { TodayPanel } from "@/components/meds/today-panel";
import { ReminderNudge } from "@/components/meds/reminder-nudge";
import {
  ensureTodayDoses,
  getDosesForDate,
  fetchProfileTimezone,
  todayStringForTimezone,
  type TodayDoseRow,
} from "@/lib/meds-today";
import { scheduleMedications, cancelDoseReminder } from "@/lib/med-notifications";
import { useRouteTheme } from "@/lib/use-route-theme";
import { NarrativeBlock } from "@/components/ui-oura/v2/narrative-block";
import { toast } from "sonner";
import { cn, formatLocaleTime } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { MedKind } from "@/components/meds/medication-form-sheet";
import { RefillForecastCard, AdherenceExtrasCard } from "@/components/meds/med-intelligence-cards";
import { buildIcs, downloadIcs, medicationToIcsEvents } from "@/lib/ics";
import { userMessage } from "@/lib/user-message";

type Medication = {
  id: string;
  name: string;
  dosage: string | null;
  dosage_amount: number | null;
  dosage_unit: string | null;
  times_of_day: string[];
  pills_remaining: number | null;
  refill_threshold: number | null;
  is_rescue: boolean;
  kind: MedKind;
  active: boolean;
  start_date: string | null;
  end_date: string | null;
};

/** Free-text dosage if set, else compose from amount + unit so it never renders blank. */
function medStrength(med: {
  dosage: string | null;
  dosage_amount: number | null;
  dosage_unit: string | null;
}): string | null {
  if (med.dosage && med.dosage.trim()) return med.dosage;
  if (med.dosage_amount != null) {
    return `${med.dosage_amount}${med.dosage_unit ? ` ${med.dosage_unit}` : ""}`;
  }
  return null;
}

type TodayDose = TodayDoseRow;

type FilterKind = "all" | "medication" | "supplement" | "vitamin" | "rescue";

const FILTER_CHIPS: { value: FilterKind; labelKey: string }[] = [
  { value: "all", labelKey: "meds.filterAll" },
  { value: "medication", labelKey: "meds.filterMedications" },
  { value: "supplement", labelKey: "meds.filterSupplements" },
  { value: "vitamin", labelKey: "meds.filterVitamins" },
  { value: "rescue", labelKey: "meds.filterRescue" },
];

const KIND_LABEL_KEYS: Record<MedKind, string> = {
  medication: "meds.filterMedications",
  supplement: "meds.filterSupplements",
  vitamin: "meds.filterVitamins",
  herbal: "meds.filterHerbal",
  rescue: "meds.filterRescue",
};

export const Route = createFileRoute("/_app/meds")({
  head: () => ({ meta: [{ title: "Meds · Purple" }] }),
  validateSearch: z.object({ add: z.enum(["new", "past"]).optional() }),
  component: MedsLayout,
});

/**
 * `/meds` owns child routes (`/meds/$medId`, `/meds/history`), so this route
 * must render an Outlet for them; the library list only shows at exactly
 * `/meds`. Mirrors the settings layout pattern.
 */
function MedsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/meds") return <Outlet />;
  return <MedsPage />;
}

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

function todayYmdLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** True when a YYYY-MM-DD date is after today. */
function isFutureDateStr(dateStr: string | null): boolean {
  return !!dateStr && dateStr > todayYmdLocal();
}

/** Short date label (e.g. "Jun 25") from a YYYY-MM-DD string, tz-safe. */
function formatDateShort(dateStr: string): string {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(
    new Date(`${dateStr}T12:00:00`),
  );
}

function MedsPage() {
  useRouteTheme("light");
  const { t } = useTranslation();
  const { session } = useAuth();
  const userId = session?.user.id;
  const [meds, setMeds] = React.useState<Medication[] | null>(null);
  const [todayDoses, setTodayDoses] = React.useState<TodayDose[] | null>(null);
  const [doseTimezone, setDoseTimezone] = React.useState("UTC");
  const [doseTodayLabel, setDoseTodayLabel] = React.useState("");
  const [todayStr, setTodayStr] = React.useState("");
  const [viewDate, setViewDate] = React.useState("");
  const [filter, setFilter] = React.useState<FilterKind>("all");
  const [tab, setTab] = React.useState<"active" | "archive">("active");
  const [open, setOpen] = React.useState(false);
  const [editingMedId, setEditingMedId] = React.useState<string | null>(null);
  const [markingAll, setMarkingAll] = React.useState(false);
  const [scanOpen, setScanOpen] = React.useState(false);
  const [voiceOpen, setVoiceOpen] = React.useState(false);
  const [prefill, setPrefill] = React.useState<MedPrefill | null>(null);
  const [addIntent, setAddIntent] = React.useState<"new" | "past">("new");
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/meds" });

  // Load the doses for the currently viewed day. Today regenerates pending
  // rows; past days are fetched as-is so we never fabricate history.
  const loadDosesForView = React.useCallback(async () => {
    if (!userId) return;
    const tz = await fetchProfileTimezone(userId);
    const today = todayStringForTimezone(tz);
    setTodayStr(today);
    const target = viewDate || today;
    if (target === today) {
      const r = await ensureTodayDoses(userId);
      setTodayDoses(r.doses);
      setDoseTimezone(r.timezone);
      setDoseTodayLabel(r.todayLabel);
    } else {
      const r = await getDosesForDate(userId, target);
      setTodayDoses(r.doses);
      setDoseTimezone(r.timezone);
      setDoseTodayLabel(r.label);
    }
  }, [userId, viewDate]);

  const load = React.useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("medications")
      .select(
        "id, name, dosage, dosage_amount, dosage_unit, times_of_day, pills_remaining, refill_threshold, is_rescue, kind, active, start_date, end_date",
      )
      .order("kind", { ascending: true })
      .order("name", { ascending: true });
    if (error) {
      console.error(error);
      return;
    }
    setMeds((data as Medication[]) ?? []);
    await loadDosesForView();
  }, [userId, loadDosesForView]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    void loadDosesForView();
  }, [loadDosesForView]);

  React.useEffect(() => {
    if (!meds) return;
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const scheduled = meds
      .filter((m) => m.active && !isRescueMed(m) && (m.times_of_day?.length ?? 0) > 0)
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

  const activeMeds = React.useMemo(() => meds?.filter((m) => m.active) ?? [], [meds]);
  const archivedMeds = React.useMemo(() => meds?.filter((m) => !m.active) ?? [], [meds]);
  const isFirst = activeMeds.filter((m) => !isRescueMed(m)).length === 0;

  const filteredMeds = React.useMemo(() => {
    if (!meds) return null;
    const base = tab === "active" ? activeMeds : archivedMeds;
    if (tab === "archive") return base;
    if (filter === "all") return base;
    if (filter === "rescue") return base.filter((m) => isRescueMed(m));
    return base.filter((m) => m.kind === filter);
  }, [meds, activeMeds, archivedMeds, tab, filter]);

  const groupedMeds = React.useMemo(() => {
    if (!filteredMeds || tab !== "active" || filter !== "all") return null;
    const groups = new Map<MedKind, Medication[]>();
    for (const m of filteredMeds) {
      const key = isRescueMed(m) ? "rescue" : m.kind;
      const list = groups.get(key) ?? [];
      list.push(m);
      groups.set(key, list);
    }
    return groups;
  }, [filteredMeds, tab, filter]);

  const pendingToday = todayDoses?.filter((d) => d.status === "pending") ?? [];

  const nextDoseByMedId = React.useMemo(() => {
    const map = new Map<string, TodayDose>();
    for (const d of todayDoses ?? []) {
      const medId = d.medication?.id;
      if (!medId || d.status !== "pending") continue;
      const existing = map.get(medId);
      if (!existing || d.scheduled_at < existing.scheduled_at) map.set(medId, d);
    }
    return map;
  }, [todayDoses]);

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
    for (const id of ids) void cancelDoseReminder(id);
    void load();
  };

  // Pill stock adjustments are handled by the DB trigger
  // trg_medication_doses_pill_stock on medication_doses.

  // Per-dose action for a pending dose: Taken / Snooze / Skip.
  const doseAction = async (id: string, action: "taken" | "skip" | "snooze") => {
    let error: unknown = null;
    if (action === "taken") {
      const res = await supabase
        .from("medication_doses")
        .update({ status: "taken", taken_at: new Date().toISOString() })
        .eq("id", id);
      error = res.error;
    } else if (action === "skip") {
      error = (await supabase.from("medication_doses").update({ status: "skipped" }).eq("id", id))
        .error;
    } else {
      const snoozeUntil = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      error = (
        await supabase
          .from("medication_doses")
          .update({ scheduled_at: snoozeUntil, status: "pending" })
          .eq("id", id)
      ).error;
    }
    if (error) {
      toast.error("Could not update dose");
      return;
    }
    if (action === "taken" || action === "skip") {
      void cancelDoseReminder(id);
    }
    if (action === "snooze") toast.success("Snoozed 10 min");
    void load();
  };

  // Retroactive edit: e.g. a missed dose the user actually took.
  const doseReclassify = async (id: string, next: "taken" | "skipped" | "pending") => {
    const { error } = await supabase
      .from("medication_doses")
      .update({ status: next, taken_at: next === "taken" ? new Date().toISOString() : null })
      .eq("id", id);
    if (error) {
      toast.error("Could not update dose");
      return;
    }
    toast.success(
      next === "taken"
        ? "Marked as taken"
        : next === "skipped"
          ? "Marked as skipped"
          : "Reset to pending",
    );
    void load();
  };

  const handleEdit = (id: string) => {
    setEditingMedId(id);
    setOpen(true);
  };

  const exportAllToCalendar = async () => {
    if (!userId) return;
    const scheduled = activeMeds.filter(
      (m) => !isRescueMed(m) && (m.times_of_day?.length ?? 0) > 0,
    );
    if (scheduled.length === 0) {
      toast.error("No scheduled medications to export");
      return;
    }
    const { data: prof } = await supabase
      .from("profiles")
      .select("timezone")
      .eq("id", userId)
      .maybeSingle();
    const homeTz =
      (prof?.timezone as string | null) ||
      Intl.DateTimeFormat().resolvedOptions().timeZone ||
      "UTC";
    const events = scheduled.flatMap((m) =>
      medicationToIcsEvents({
        medId: m.id,
        medName: m.name,
        dosage: m.dosage,
        timesOfDay: m.times_of_day,
        days: 30,
        homeTz,
      }),
    );
    if (events.length === 0) {
      toast.error("No dose times to export");
      return;
    }
    const ics = buildIcs("Medications · Purple", events);
    downloadIcs("purple-medications-30d", ics);
    toast.success("Calendar file downloaded");
  };

  const hasLibrary = activeMeds.length > 0;
  const userMedNames = React.useMemo(
    () => [...new Set((meds ?? []).map((m) => m.name).filter(Boolean))],
    [meds],
  );

  const openAdd = React.useCallback(() => {
    setEditingMedId(null);
    setPrefill(null);
    setAddIntent("new");
    setOpen(true);
  }, []);

  // Deep-link from Settings → "Add past history" → Old medications.
  React.useEffect(() => {
    if (search.add === "past") {
      setEditingMedId(null);
      setPrefill(null);
      setAddIntent("past");
      setOpen(true);
      navigate({ search: {}, replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.add]);

  // 14-day adherence, surfaced inline in Today's doses (no extra click).
  const [adherence, setAdherence] = React.useState<{
    pct: number;
    taken: number;
    total: number;
  } | null>(null);
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
      setAdherence(total === 0 ? null : { pct: Math.round((taken / total) * 100), taken, total });
    })();
  }, [userId, todayDoses]);

  const actionsToolbar = (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              className="rounded-full"
              onClick={openAdd}
              aria-label={t("meds.addMedication")}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("meds.addMedication")}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              className="rounded-full"
              onClick={() => setScanOpen(true)}
              aria-label={t("meds.scanLabel")}
            >
              <Camera className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("meds.scanLabel")}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              className="rounded-full"
              onClick={() => setVoiceOpen(true)}
              aria-label={t("meds.voiceLabel")}
            >
              <Mic className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("meds.voiceLabel")}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/meds/history"
              aria-label={t("meds.history.title")}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <History className="h-4 w-4" />
            </Link>
          </TooltipTrigger>
          <TooltipContent>{t("meds.history.title")}</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-10 lg:px-16 pt-12 sm:pt-20 lg:pt-24 pb-32 relative">
      <p className="label-eyebrow text-muted-foreground">{t("meds.eyebrow")}</p>
      <h1
        className={cn(
          "mt-3 app-hero-title text-foreground",
          hasLibrary ? "text-[28px] sm:text-[36px]" : "text-[32px] sm:text-[40px]",
        )}
      >
        {t("meds.title1")}
        <br />
        {t("meds.title2")}
      </h1>

      {hasLibrary ? (
        <>
          <div className="mt-8 flex justify-end">{actionsToolbar}</div>
          <TodayPanel
            doses={todayDoses}
            timezone={doseTimezone}
            todayLabel={doseTodayLabel}
            pendingCount={pendingToday.length}
            markingAll={markingAll}
            onMarkAll={markAllTaken}
            onAction={doseAction}
            onReclassify={doseReclassify}
            onAddMed={openAdd}
            adherencePct={adherence?.pct ?? null}
            adherenceTaken={adherence?.taken ?? 0}
            adherenceTotal={adherence?.total ?? 0}
            viewDate={viewDate || todayStr}
            todayStr={todayStr}
            onChangeDate={setViewDate}
          />
        </>
      ) : (
        <>
          <div className="mt-8">
            <NarrativeBlock>{t("meds.intro")}</NarrativeBlock>
          </div>
          <div className="mt-6 flex justify-end">{actionsToolbar}</div>
          <TodayPanel
            doses={todayDoses}
            timezone={doseTimezone}
            todayLabel={doseTodayLabel}
            pendingCount={pendingToday.length}
            markingAll={markingAll}
            onMarkAll={markAllTaken}
            onAction={doseAction}
            onReclassify={doseReclassify}
            onAddMed={openAdd}
            adherencePct={adherence?.pct ?? null}
            adherenceTaken={adherence?.taken ?? 0}
            adherenceTotal={adherence?.total ?? 0}
            viewDate={viewDate || todayStr}
            todayStr={todayStr}
            onChangeDate={setViewDate}
          />
        </>
      )}

      {activeMeds.length > 0 && (
        <div className="mt-2">
          <RefillForecastCard />
          <AdherenceExtrasCard />
        </div>
      )}

      {meds && meds.length > 0 && (
        <p className="mt-10 label-eyebrow text-muted-foreground">{t("meds.libraryTitle")}</p>
      )}

      {meds && meds.length > 0 && (
        <div className="mt-3 flex items-center gap-2 border-b border-border">
          {(["active", "archive"] as const).map((tabKey) => (
            <button
              key={tabKey}
              type="button"
              onClick={() => setTab(tabKey)}
              className={cn(
                "px-3 py-2 text-sm capitalize -mb-px border-b-2 transition-colors",
                tab === tabKey
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tabKey === "active" ? t("meds.tabActive") : t("meds.tabArchive")}{" "}
              {tabKey === "archive" && archivedMeds.length > 0 && (
                <span className="ml-1 text-xs text-muted-foreground">({archivedMeds.length})</span>
              )}
            </button>
          ))}
          {activeMeds.length > 0 && (
            <button
              type="button"
              onClick={() => void exportAllToCalendar()}
              className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              title="Download a 30-day .ics with every scheduled dose"
            >
              <CalendarDays className="h-3.5 w-3.5" /> Export to calendar
            </button>
          )}
        </div>
      )}

      {tab === "active" && activeMeds.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
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
              {t(chip.labelKey)}
            </button>
          ))}
        </div>
      )}

      {meds && meds.length > 0 && (
        <p className="mt-4 text-xs text-muted-foreground">{t("meds.manageHint")}</p>
      )}

      {meds === null ? (
        <p className="mt-10 text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : meds.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <Pill className="h-6 w-6 mx-auto text-muted-foreground" />
          <p className="mt-3 font-serif text-lg text-foreground">{t("meds.emptyTitle")}</p>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
            {t("meds.emptyBody")}
          </p>
          <Button className="mt-5 rounded-full" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> {t("meds.addMedication")}
          </Button>
        </div>
      ) : tab === "archive" && archivedMeds.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <Archive className="h-6 w-6 mx-auto text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">{t("meds.noArchived")}</p>
        </div>
      ) : tab === "active" && filter === "all" && groupedMeds ? (
        <div className="mt-8 space-y-6">
          {(["medication", "supplement", "vitamin", "herbal", "rescue"] as MedKind[]).map(
            (kind) => {
              const list = groupedMeds.get(kind);
              if (!list?.length) return null;
              return (
                <section key={kind}>
                  <h2 className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-2 px-1">
                    {t(KIND_LABEL_KEYS[kind])}
                  </h2>
                  <ul className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
                    {list.map((m) => (
                      <MedRow
                        key={m.id}
                        med={m}
                        nextDose={nextDoseByMedId.get(m.id) ?? null}
                        onMarkTaken={(id) => void doseAction(id, "taken")}
                        onEdit={handleEdit}
                        onChanged={load}
                      />
                    ))}
                  </ul>
                </section>
              );
            },
          )}
        </div>
      ) : (
        <ul className="mt-8 rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
          {(filteredMeds ?? []).map((m) => (
            <MedRow
              key={m.id}
              med={m}
              nextDose={nextDoseByMedId.get(m.id) ?? null}
              onMarkTaken={(id) => void doseAction(id, "taken")}
              onEdit={handleEdit}
              onChanged={load}
            />
          ))}
        </ul>
      )}

      {hasLibrary && <ReminderNudge className="mt-10" />}

      <button
        type="button"
        onClick={() => {
          setPrefill(null);
          setEditingMedId(null);
          setOpen(true);
        }}
        aria-label={t("meds.addMedication")}
        className="native-fab-fixed fixed bottom-24 md:bottom-8 right-5 md:right-8 z-40 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center md:hidden"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        <Plus className="h-6 w-6" />
      </button>

      <MedicationFormSheet
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) {
            setEditingMedId(null);
            setPrefill(null);
            setAddIntent("new");
          }
        }}
        onSaved={load}
        isFirstMedication={isFirst}
        editingMedId={editingMedId}
        prefill={prefill}
        userMedNames={userMedNames}
        intent={addIntent}
      />

      <ScanMedSheet
        open={scanOpen}
        onOpenChange={setScanOpen}
        mode="camera"
        onRecognized={(p) => {
          setEditingMedId(null);
          setPrefill(p);
          setOpen(true);
        }}
      />

      <VoiceMedSheet
        open={voiceOpen}
        onOpenChange={setVoiceOpen}
        onRecognized={(p) => {
          setEditingMedId(null);
          setPrefill(p);
          setOpen(true);
        }}
      />
    </div>
  );
}

function MedRow({
  med,
  nextDose,
  onMarkTaken,
  onEdit,
  onChanged,
}: {
  med: Medication;
  nextDose: TodayDose | null;
  onMarkTaken: (doseId: string) => void;
  onEdit: (id: string) => void;
  onChanged: () => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const threshold = med.refill_threshold ?? 7;
  const lowStock = med.pills_remaining !== null && med.pills_remaining <= threshold;
  const outOfStock = med.pills_remaining !== null && med.pills_remaining <= 0;
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const archive = async () => {
    const { error } = await supabase.from("medications").update({ active: false }).eq("id", med.id);
    if (error) {
      toast.error(userMessage(error, "That didn't work. Try again in a moment."));
      return;
    }
    toast.success(`${med.name} archived`);
    void onChanged();
  };
  const restore = async () => {
    const { error } = await supabase.from("medications").update({ active: true }).eq("id", med.id);
    if (error) {
      toast.error(userMessage(error, "That didn't work. Try again in a moment."));
      return;
    }
    toast.success(`${med.name} restored`);
    void onChanged();
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
    void onChanged();
  };

  return (
    <li className="relative">
      <Link
        to="/meds/$medId"
        params={{ medId: med.id }}
        data-testid="med-row-link"
        aria-label={t("meds.rowAria", { name: med.name })}
        className={cn(
          "flex items-center gap-3 px-5 py-3 hover:bg-secondary/40 transition-colors pr-14",
          !med.active && "opacity-70",
        )}
      >
        <div className="min-w-0 flex-1 flex items-center gap-2">
          <p className="font-serif text-[17px] text-foreground truncate">{med.name}</p>
          {outOfStock ? (
            <span className="rounded-full bg-destructive/15 text-destructive px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide shrink-0">
              {t("meds.zeroStock")}
            </span>
          ) : lowStock && (
            <span className="rounded-full bg-destructive/15 text-destructive px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide shrink-0">
              {t("meds.refillSoon")}
            </span>
          )}
          {!med.active && (
            <span className="rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide shrink-0">
              {t("meds.archived")}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground shrink-0 tabular-nums text-right max-w-[45%] truncate">
          {medStrength(med) ?? ""}
          {outOfStock ? (
            <> · {t("meds.outOfStock")}</>
          ) : isFutureDateStr(med.start_date) ? (
            <> · {t("meds.startsShort", { date: formatDateShort(med.start_date!) })}</>
          ) : (
            <>
              {!isRescueMed(med) && nextDose && (
                <>
                  {" "}
                  · {t("meds.nextToday")} {formatLocaleTime(nextDose.scheduled_at)}
                </>
              )}
              {isRescueMed(med) && <> · {t("meds.asNeeded")}</>}
              {!isRescueMed(med) && !nextDose && med.times_of_day?.length > 0 && (
                <> · {med.times_of_day.map(formatTime).join(", ")}</>
              )}
            </>
          )}
        </p>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </Link>

      {!outOfStock && nextDose?.status === "pending" && (
        <div className="px-5 pb-3 -mt-1">
          <Button
            size="sm"
            className="rounded-full h-8 px-4"
            onClick={() => onMarkTaken(nextDose.id)}
          >
            {t("meds.markTaken")}
          </Button>
        </div>
      )}

      <div className="absolute top-3 right-3 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="h-8 w-8 inline-flex items-center justify-center rounded-full hover:bg-secondary text-muted-foreground"
            aria-label="Medication actions"
          >
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {med.active ? (
              <>
                <DropdownMenuItem onClick={() => onEdit(med.id)}>
                  <Edit3 className="h-4 w-4 mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={archive}>
                  <Archive className="h-4 w-4 mr-2" /> Archive
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem onClick={restore}>
                  <ArchiveRestore className="h-4 w-4 mr-2" /> Restore
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setConfirmDelete(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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
    </li>
  );
}
