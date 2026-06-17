import * as React from "react";
import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Plus, Edit3, Archive, ArchiveRestore, Trash2, CalendarDays } from "lucide-react";
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
  head: () => ({ meta: [{ title: "Medication · Purple" }] }),
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
  const { t } = useTranslation();
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
  const [editOpen, setEditOpen] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [homeTz, setHomeTz] = React.useState<string>("UTC");

  const load = React.useCallback(async () => {
    if (!userId) return;
    const [{ data: m }, { data: adh }, { data: doses }, { data: effects }, { data: prof }] = await Promise.all([
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
      supabase.from("profiles").select("timezone").eq("id", userId).maybeSingle(),
    ]);
    setMed((m as Med) ?? null);
    const row = (adh as Array<{ scheduled_count: number; taken_count: number; adherence_pct: number }>)?.[0];
    if (row) setAdherence({ scheduled: Number(row.scheduled_count), taken: Number(row.taken_count), pct: Number(row.adherence_pct) });
    setRecent((doses as Dose[]) ?? []);
    setSideEffects((effects as SideEffect[]) ?? []);
    setHomeTz((prof as { timezone: string | null } | null)?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC");
  }, [medId, userId]);

  React.useEffect(() => { void load(); }, [load]);

  const archive = async () => {
    if (!med) return;
    if (!window.confirm(`Archive ${med.name}? You can re-add it later.`)) return;
    const { error } = await supabase.from("medications").update({ active: false }).eq("id", med.id);
    if (error) { toast.error(userMessage(error, "That didn't work. Try again in a moment.")); return; }
    toast.success("Medication archived");
    navigate({ to: "/meds" });
  };

  const restore = async () => {
    if (!med) return;
    const { error } = await supabase.from("medications").update({ active: true }).eq("id", med.id);
    if (error) { toast.error(userMessage(error, "That didn't work. Try again in a moment.")); return; }
    toast.success("Medication restored");
    void load();
  };

  const destroy = async () => {
    if (!med) return;
    await supabase.from("medication_doses").delete().eq("medication_id", med.id);
    await supabase.from("medication_side_effects").delete().eq("medication_id", med.id);
    const { error } = await supabase.from("medications").delete().eq("id", med.id);
    if (error) { toast.error(userMessage(error, "That didn't work. Try again in a moment.")); return; }
    toast.success(`${med.name} deleted`);
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

  const exportToCalendar = () => {
    if (!med) return;
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

  if (!med) {
    return <div className="mx-auto max-w-2xl px-5 pt-16 text-sm text-muted-foreground">Loading…</div>;
  }

  const prescriber = med.prescriber_name || med.prescriber;
  const threshold = med.refill_threshold ?? 7;
  const lowStock = med.pills_remaining !== null && med.pills_remaining <= threshold;

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-10 lg:px-16 pt-10 sm:pt-16 lg:pt-20 pb-24">
      <Link to="/meds" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground gap-1">
        <ArrowLeft className="h-4 w-4" /> {t("nav.medications")}
      </Link>

      <h1 className="mt-6 font-serif text-[44px] sm:text-6xl lg:text-7xl leading-[1.02] tracking-[-0.02em] text-foreground">
        {med.name}
      </h1>
      {!med.active && (
        <span className="mt-3 inline-block rounded-full bg-muted text-muted-foreground px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
          {t("meds.archived")}
        </span>
      )}
      {(() => {
        const strength =
          (med.dosage && med.dosage.trim()) ||
          (med.dosage_amount != null
            ? `${med.dosage_amount}${med.dosage_unit ? ` ${med.dosage_unit}` : ""}`
            : null);
        return strength ? (
          <p className="mt-3 font-serif text-xl text-foreground/70">{strength}</p>
        ) : null;
      })()}
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
            <p className="mt-4 text-sm text-muted-foreground">
              Adherence shows up here once a few scheduled doses have passed. Nothing to do yet.
            </p>
          )}
        </section>
      )}

      <section className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="font-serif text-xl text-foreground">Schedule</h2>
        {isRescueMed(med) ? (
          <p className="mt-2 text-sm text-muted-foreground">Rescue medication, taken as needed.</p>
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
            {lowStock && ", time to refill"}
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
                  Severity {e.severity ?? "–"}/10 · {format(new Date(e.noted_at), "MMM d, yyyy")}
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

      <div className="mt-8 flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setEditOpen(true)}>
          <Edit3 className="h-4 w-4 mr-1.5" /> Edit
        </Button>
        {!isRescueMed(med) && med.times_of_day.length > 0 && (
          <Button variant="outline" onClick={exportToCalendar}>
            <CalendarDays className="h-4 w-4 mr-1.5" /> Export to calendar
          </Button>
        )}
        {med.active ? (
          <Button variant="outline" onClick={archive}>
            <Archive className="h-4 w-4 mr-1.5" /> Archive
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={restore}>
              <ArchiveRestore className="h-4 w-4 mr-1.5" /> Restore
            </Button>
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(true)}
              className="text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60"
            >
              <Trash2 className="h-4 w-4 mr-1.5" /> Delete permanently
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
