import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Pill, AlertCircle, CheckCheck, MoreVertical, Edit3, Archive, ArchiveRestore, Trash2, CalendarDays, Camera, Image as ImageIcon, Mic, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { MedicationFormSheet, type MedPrefill } from "@/components/meds/medication-form-sheet";
import { ScanMedSheet } from "@/components/meds/scan-med-sheet";
import { VoiceMedSheet } from "@/components/meds/voice-med-sheet";
import { MedsMiniTimeline } from "@/components/meds/meds-mini-timeline";
import { MedRemindersBanner } from "@/components/meds/med-reminders-banner";
import { scheduleMedications } from "@/lib/med-notifications";
import { MetricNumber } from "@/components/ui-oura/metric-number";
import { ProgressPill } from "@/components/ui-oura/progress-pill";
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
import type { MedKind } from "@/components/meds/medication-form-sheet";
import { RefillForecastCard, AdherenceExtrasCard } from "@/components/meds/med-intelligence-cards";
import { buildIcs, downloadIcs, medicationToIcsEvents } from "@/lib/ics";
import { userMessage } from "@/lib/user-message";

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
  const { t } = useTranslation();
  const { session } = useAuth();
  const userId = session?.user.id;
  const [meds, setMeds] = React.useState<Medication[] | null>(null);
  const [todayDoses, setTodayDoses] = React.useState<TodayDose[] | null>(null);
  const [filter, setFilter] = React.useState<FilterKind>("all");
  const [tab, setTab] = React.useState<"active" | "archive">("active");
  const [open, setOpen] = React.useState(false);
  const [editingMedId, setEditingMedId] = React.useState<string | null>(null);
  const [markingAll, setMarkingAll] = React.useState(false);
  const [scanOpen, setScanOpen] = React.useState(false);
  const [scanMode, setScanMode] = React.useState<"camera" | "library">("camera");
  const [voiceOpen, setVoiceOpen] = React.useState(false);
  const [aiMenuOpen, setAiMenuOpen] = React.useState(false);
  const [prefill, setPrefill] = React.useState<MedPrefill | null>(null);

  const load = React.useCallback(async () => {
    if (!userId) return;
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(23, 59, 59, 999);

    const [{ data, error }, { data: doses }] = await Promise.all([
      supabase
        .from("medications")
        .select("id, name, dosage, times_of_day, pills_remaining, refill_threshold, is_rescue, kind, active")
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

  const handleEdit = (id: string) => {
    setEditingMedId(id);
    setOpen(true);
  };

  const exportAllToCalendar = async () => {
    if (!userId) return;
    const scheduled = activeMeds.filter((m) => !isRescueMed(m) && (m.times_of_day?.length ?? 0) > 0);
    if (scheduled.length === 0) {
      toast.error("No scheduled medications to export");
      return;
    }
    const { data: prof } = await supabase
      .from("profiles")
      .select("timezone")
      .eq("id", userId)
      .maybeSingle();
    const homeTz = (prof?.timezone as string | null) || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
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

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-10 lg:px-16 pt-12 sm:pt-20 lg:pt-24 pb-32 relative">
      <p className="label-eyebrow text-muted-foreground">{t("meds.eyebrow")}</p>
      <h1 className="mt-3 font-serif text-[44px] sm:text-6xl lg:text-7xl leading-[1.02] tracking-[-0.02em] text-foreground">
        {t("meds.title1")}<br/>{t("meds.title2")}
      </h1>
      <div className="mt-8">
        <NarrativeBlock>
          {t("meds.intro")}
        </NarrativeBlock>
      </div>

      <div className="mt-6">
        <MedRemindersBanner />
      </div>

      {activeMeds.length > 0 && (
        <div className="mt-6">
          <MedsMiniTimeline />
        </div>
      )}

      {activeMeds.length > 0 && <RefillForecastCard />}

      {activeMeds.length > 0 && (
        <>
          <TodayDosesSection
            doses={todayDoses}
            pendingCount={pendingToday.length}
            onMarkAll={markAllTaken}
            markingAll={markingAll}
          />
          <AdherenceCard />
          <AdherenceExtrasCard />
        </>
      )}

      {meds && meds.length > 0 && (
        <div className="mt-8 flex items-center gap-2 border-b border-border">
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
              {tabKey === "active" ? t("meds.tabActive") : t("meds.tabArchive")} {tabKey === "archive" && archivedMeds.length > 0 && (
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
          {(["medication", "supplement", "vitamin", "herbal", "rescue"] as MedKind[]).map((kind) => {
            const list = groupedMeds.get(kind);
            if (!list?.length) return null;
            return (
              <section key={kind}>
                <h2 className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
                  {t(KIND_LABEL_KEYS[kind])}
                </h2>
                <ul className="space-y-2">
                  {list.map((m) => <MedRow key={m.id} med={m} onEdit={handleEdit} onChanged={load} />)}
                </ul>
              </section>
            );
          })}
        </div>
      ) : (
        <ul className="mt-8 space-y-2">
          {(filteredMeds ?? []).map((m) => <MedRow key={m.id} med={m} onEdit={handleEdit} onChanged={load} />)}
        </ul>
      )}

      <div
        className="fixed bottom-24 md:bottom-8 right-5 md:right-8 z-40 flex flex-col gap-2"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        <DropdownMenu open={aiMenuOpen} onOpenChange={setAiMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Add with AI"
              className="h-12 w-12 rounded-full bg-card text-foreground ring-1 ring-border shadow-md hover:shadow-lg transition-shadow flex items-center justify-center"
            >
              <Sparkles className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56">
            <DropdownMenuItem onClick={() => { setScanMode("camera"); setScanOpen(true); }}>
              <Camera className="h-4 w-4 mr-2" /> Scan bottle
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setScanMode("library"); setScanOpen(true); }}>
              <ImageIcon className="h-4 w-4 mr-2" /> Upload prescription photo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setVoiceOpen(true)}>
              <Mic className="h-4 w-4 mr-2" /> Voice
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <button
          type="button"
          onClick={() => { setPrefill(null); setOpen(true); }}
          aria-label={t("meds.addMedication")}
          className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      <MedicationFormSheet
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) { setEditingMedId(null); setPrefill(null); }
        }}
        onSaved={load}
        isFirstMedication={isFirst}
        editingMedId={editingMedId}
        prefill={prefill}
      />

      <ScanMedSheet
        open={scanOpen}
        onOpenChange={setScanOpen}
        mode={scanMode}
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
  const { t } = useTranslation();
  return (
    <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-serif text-xl text-foreground">{t("meds.todayDoses")}</h2>
        {pendingCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            onClick={onMarkAll}
            disabled={markingAll}
          >
            <CheckCheck className="h-3.5 w-3.5 mr-1" />
            {t("meds.markAllTaken")}
          </Button>
        )}
      </div>
      {doses === null ? (
        <p className="mt-4 text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : doses.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{t("meds.noDosesToday")}</p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {doses.map((d) => (
            <li key={d.id} className="flex items-center justify-between py-2 text-sm">
              <span className="text-muted-foreground tabular-nums">
                {formatLocaleTime(d.scheduled_at)}
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

function MedRow({ med, onEdit, onChanged }: { med: Medication; onEdit: (id: string) => void; onChanged: () => void | Promise<void> }) {
  const threshold = med.refill_threshold ?? 7;
  const lowStock = med.pills_remaining !== null && med.pills_remaining <= threshold;
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const archive = async () => {
    const { error } = await supabase.from("medications").update({ active: false }).eq("id", med.id);
    if (error) { toast.error(userMessage(error, "That didn't work. Try again in a moment.")); return; }
    toast.success(`${med.name} archived`);
    void onChanged();
  };
  const restore = async () => {
    const { error } = await supabase.from("medications").update({ active: true }).eq("id", med.id);
    if (error) { toast.error(userMessage(error, "That didn't work. Try again in a moment.")); return; }
    toast.success(`${med.name} restored`);
    void onChanged();
  };
  const destroy = async () => {
    await supabase.from("medication_doses").delete().eq("medication_id", med.id);
    await supabase.from("medication_side_effects").delete().eq("medication_id", med.id);
    const { error } = await supabase.from("medications").delete().eq("id", med.id);
    if (error) { toast.error(userMessage(error, "That didn't work. Try again in a moment.")); return; }
    toast.success(`${med.name} deleted`);
    void onChanged();
  };

  return (
    <li className="relative">
      <Link
        to="/meds/$medId"
        params={{ medId: med.id }}
        className={cn(
          "block rounded-2xl border border-border bg-card p-5 hover:border-foreground/20 transition-colors",
          !med.active && "opacity-70",
        )}
      >
        <div className="flex items-start justify-between gap-3 pr-8">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-serif text-lg text-foreground truncate">{med.name}</p>
              {lowStock && (
                <span className="rounded-full bg-destructive/15 text-destructive px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                  Refill soon
                </span>
              )}
              {!med.active && (
                <span className="rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                  Archived
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

      <div className="absolute top-3 right-3">
        <DropdownMenu>
          <DropdownMenuTrigger
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
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
              This removes the medication along with its dose history and logged side effects. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={destroy} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
          value={pct == null ? "–" : `${pct}%`}
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
          value={pct == null ? "–" : `${pct}%`}
          pct={pct ?? 0}
          tone={pct != null && pct < 70 ? "alert" : "ink"}
        />
      </div>
    </section>
  );
}
