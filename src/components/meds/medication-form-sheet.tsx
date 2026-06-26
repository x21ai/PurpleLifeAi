import * as React from "react";
import { Plus, X, Loader2, ChevronDown, Volume2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { toast } from "sonner";
import { requestPermission, scheduleMedications } from "@/lib/med-notifications";
import type { MedDictEntry } from "@/lib/med-dictionary";
import {
  ALARM_SOUNDS,
  DEFAULT_ALARM_SOUND,
  playAlarmOnce,
  type AlarmSoundId,
} from "@/lib/alarm-sounds";
import { useServerFn } from "@tanstack/react-start";
import { MedNameSearch } from "@/components/meds/med-name-search";
import { getDrugDefaults } from "@/lib/drug-db.functions";
import { TimePicker12h } from "@/components/ui/time-picker-12h";
import {
  GroupedFormCard,
  GroupedFormField,
  GroupedFormInsetButton,
  GroupedFormLabel,
  GroupedFormRow,
  GroupedFormSwitchRow,
  FormSectionSkeleton,
} from "@/components/meds/grouped-form-section";

export type MedKind = "medication" | "supplement" | "vitamin" | "herbal" | "rescue";

export type MedPrefill = {
  name?: string | null;
  dosage_amount?: number | null;
  dosage_unit?: string | null;
  dosage_form?: string | null;
  with_food?: boolean | null;
  times_per_day?: number | null;
  prescriber_name?: string | null;
  pharmacy_name?: string | null;
  prescription_number?: string | null;
  pills_remaining?: number | null;
};

const KIND_OPTIONS: MedKind[] = ["medication", "supplement", "vitamin", "herbal", "rescue"];

const DOSAGE_FORMS = [
  "pill",
  "capsule",
  "tablet",
  "liquid",
  "injection",
  "drops",
  "patch",
  "inhaler",
  "powder",
  "gummy",
  "other",
] as const;

const DOSAGE_UNITS = ["mg", "mcg", "mL", "g", "IU", "drops", "sprays", "units"];

const REFILL_PRESETS = ["3", "7", "14", "30"] as const;

function todayIso(time: string): string {
  const [h, m] = time.split(":");
  const d = new Date();
  d.setHours(parseInt(h, 10) || 0, parseInt(m, 10) || 0, 0, 0);
  return d.toISOString();
}

function formatDosageText(amount: string, unit: string): string | null {
  const n = amount.trim();
  const u = unit.trim();
  if (!n && !u) return null;
  if (n && u) return `${n} ${u}`;
  return n || u;
}

function applyDictEntry(
  entry: MedDictEntry,
  setters: {
    setName: (v: string) => void;
    setKind: (v: MedKind) => void;
    setDosageForm: (v: string) => void;
    setDosageAmount: (v: string) => void;
    setDosageUnit: (v: string) => void;
    setUnitMode: (v: "preset" | "custom") => void;
  },
) {
  setters.setName(entry.label);
  setters.setKind(entry.kind);
  if (entry.defaultForm) setters.setDosageForm(entry.defaultForm);
  if (entry.defaultUnit) {
    setters.setDosageUnit(entry.defaultUnit);
    setters.setUnitMode(DOSAGE_UNITS.includes(entry.defaultUnit) ? "preset" : "custom");
  }
  if (entry.commonStrengths?.[0]) setters.setDosageAmount(entry.commonStrengths[0]);
}

export function MedicationFormSheet({
  open,
  onOpenChange,
  onSaved,
  isFirstMedication,
  editingMedId,
  prefill,
  userMedNames = [],
  intent = "new",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: () => void;
  isFirstMedication: boolean;
  editingMedId?: string | null;
  prefill?: MedPrefill | null;
  userMedNames?: string[];
  intent?: "new" | "past";
}) {
  const { t } = useTranslation();
  const { session } = useAuth();
  const userId = session?.user.id;
  const [name, setName] = React.useState("");
  const [kind, setKind] = React.useState<MedKind>("medication");
  const [dosageForm, setDosageForm] = React.useState<string>("");
  const [dosageAmount, setDosageAmount] = React.useState("");
  const [dosageUnit, setDosageUnit] = React.useState("mg");
  const [unitMode, setUnitMode] = React.useState<"preset" | "custom">("preset");
  const [withFood, setWithFood] = React.useState(false);
  const [criticalAlarm, setCriticalAlarm] = React.useState(false);
  const [alarmSound, setAlarmSound] = React.useState<AlarmSoundId>(DEFAULT_ALARM_SOUND);
  const [times, setTimes] = React.useState<string[]>(["08:00"]);
  const [timeAmounts, setTimeAmounts] = React.useState<string[]>([""]);
  const [pillsRemaining, setPillsRemaining] = React.useState("");
  const [refillThreshold, setRefillThreshold] = React.useState("7");
  const [refillMode, setRefillMode] = React.useState<"preset" | "custom">("preset");
  const [prescriberName, setPrescriberName] = React.useState("");
  const [pharmacyName, setPharmacyName] = React.useState("");
  const [prescriptionNumber, setPrescriptionNumber] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [prescriberOpen, setPrescriberOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [formLoading, setFormLoading] = React.useState(false);

  const isRescue = kind === "rescue";
  const isEditing = !!editingMedId;

  const dictSetters = React.useMemo(
    () => ({ setName, setKind, setDosageForm, setDosageAmount, setDosageUnit, setUnitMode }),
    [],
  );

  // Mirror the editable dose fields so the async drug-DB enrich can read the
  // latest values and fill only what the user has not already set.
  const fieldsRef = React.useRef({ dosageForm, dosageUnit, dosageAmount });
  React.useEffect(() => {
    fieldsRef.current = { dosageForm, dosageUnit, dosageAmount };
  });

  const lookupDrug = useServerFn(getDrugDefaults);
  const enrichFromDrugDb = React.useCallback(
    async (medName: string) => {
      try {
        const db = await lookupDrug({ data: { name: medName } });
        if (!db) return;
        const cur = fieldsRef.current;
        if (db.dosageForm && !cur.dosageForm) setDosageForm(db.dosageForm);
        if (db.defaultUnit && (!cur.dosageUnit || cur.dosageUnit === "mg")) {
          setDosageUnit(db.defaultUnit);
          setUnitMode(DOSAGE_UNITS.includes(db.defaultUnit) ? "preset" : "custom");
        }
        if (db.commonStrengths.length > 0 && !cur.dosageAmount) {
          setDosageAmount(db.commonStrengths[0]);
        }
      } catch {
        /* offline or lookup failed; local defaults stand */
      }
    },
    [lookupDrug],
  );

  React.useEffect(() => {
    if (!open) {
      setName("");
      setKind("medication");
      setDosageForm("");
      setDosageAmount("");
      setDosageUnit("mg");
      setUnitMode("preset");
      setWithFood(false);
      setCriticalAlarm(false);
      setAlarmSound(DEFAULT_ALARM_SOUND);
      setTimes(["08:00"]);
      setTimeAmounts([""]);
      setPillsRemaining("");
      setRefillThreshold("7");
      setRefillMode("preset");
      setPrescriberName("");
      setPharmacyName("");
      setPrescriptionNumber("");
      setStartDate("");
      setEndDate("");
      setPrescriberOpen(false);
      setFormLoading(false);
    }
  }, [open]);

  React.useEffect(() => {
    if (!open || editingMedId || !prefill) return;
    if (prefill.name) setName(prefill.name);
    if (prefill.dosage_form) setDosageForm(prefill.dosage_form);
    if (prefill.dosage_amount != null) setDosageAmount(String(prefill.dosage_amount));
    if (prefill.dosage_unit) {
      setDosageUnit(prefill.dosage_unit);
      setUnitMode(DOSAGE_UNITS.includes(prefill.dosage_unit) ? "preset" : "custom");
    }
    if (prefill.with_food != null) setWithFood(prefill.with_food);
    if (prefill.prescriber_name) setPrescriberName(prefill.prescriber_name);
    if (prefill.pharmacy_name) setPharmacyName(prefill.pharmacy_name);
    if (prefill.prescription_number) setPrescriptionNumber(prefill.prescription_number);
    if (prefill.pills_remaining != null) setPillsRemaining(String(prefill.pills_remaining));
    if (prefill.prescriber_name || prefill.pharmacy_name || prefill.prescription_number) {
      setPrescriberOpen(true);
    }
    if (prefill.times_per_day && prefill.times_per_day > 0) {
      const defaults = ["08:00", "20:00", "12:00", "16:00"];
      const n = Math.min(prefill.times_per_day, 4);
      const slots = defaults.slice(0, n).sort();
      setTimes(slots);
      setTimeAmounts(slots.map(() => ""));
    }
  }, [open, editingMedId, prefill]);

  React.useEffect(() => {
    if (!open || !editingMedId) return;
    let cancelled = false;
    setFormLoading(true);
    void (async () => {
      const { data, error } = await supabase
        .from("medications")
        .select(
          "name, kind, dosage_form, dosage_amount, dosage_unit, with_food, schedule, times_of_day, pills_remaining, refill_threshold, prescriber_name, pharmacy_name, prescription_number, is_rescue, reminder_style, alarm_sound, start_date, end_date",
        )
        .eq("id", editingMedId)
        .maybeSingle();
      if (cancelled) return;
      setFormLoading(false);
      if (error || !data) return;
      const m = data as {
        name: string;
        kind: MedKind;
        dosage_form: string | null;
        dosage_amount: number | null;
        dosage_unit: string | null;
        with_food: boolean | null;
        schedule: Array<{ time: string; amount: number | null; unit: string | null }> | null;
        times_of_day: string[] | null;
        pills_remaining: number | null;
        refill_threshold: number | null;
        prescriber_name: string | null;
        pharmacy_name: string | null;
        prescription_number: string | null;
        is_rescue: boolean;
        reminder_style: string | null;
        alarm_sound: string | null;
        start_date: string | null;
        end_date: string | null;
      };
      setName(m.name ?? "");
      const resolvedKind: MedKind = m.is_rescue ? "rescue" : ((m.kind as MedKind) ?? "medication");
      setKind(resolvedKind);
      setDosageForm(m.dosage_form ?? "");
      setDosageAmount(m.dosage_amount != null ? String(m.dosage_amount) : "");
      const unit = m.dosage_unit ?? "mg";
      setDosageUnit(unit);
      setUnitMode(DOSAGE_UNITS.includes(unit) ? "preset" : "custom");
      setWithFood(!!m.with_food);
      setCriticalAlarm(m.reminder_style === "critical");
      setAlarmSound((m.alarm_sound as AlarmSoundId) ?? DEFAULT_ALARM_SOUND);
      const schedule = Array.isArray(m.schedule) ? m.schedule : [];
      if (schedule.length > 0) {
        setTimes(schedule.map((s) => s.time));
        setTimeAmounts(schedule.map((s) => (s.amount != null ? String(s.amount) : "")));
      } else if (m.times_of_day && m.times_of_day.length > 0) {
        setTimes(m.times_of_day);
        setTimeAmounts(m.times_of_day.map(() => ""));
      } else {
        setTimes(["08:00"]);
        setTimeAmounts([""]);
      }
      setPillsRemaining(m.pills_remaining != null ? String(m.pills_remaining) : "");
      const thr = m.refill_threshold != null ? String(m.refill_threshold) : "7";
      setRefillThreshold(thr);
      setRefillMode(
        REFILL_PRESETS.includes(thr as (typeof REFILL_PRESETS)[number]) ? "preset" : "custom",
      );
      setPrescriberName(m.prescriber_name ?? "");
      setPharmacyName(m.pharmacy_name ?? "");
      setPrescriptionNumber(m.prescription_number ?? "");
      setStartDate(m.start_date ?? "");
      setEndDate(m.end_date ?? "");
      setPrescriberOpen(!!(m.prescriber_name || m.pharmacy_name || m.prescription_number));
    })();
    return () => {
      cancelled = true;
    };
  }, [open, editingMedId]);

  const updateTime = (idx: number, v: string) =>
    setTimes((arr) => arr.map((t, i) => (i === idx ? v : t)));
  const removeTime = (idx: number) => {
    setTimes((arr) => (arr.length === 1 ? arr : arr.filter((_, i) => i !== idx)));
    setTimeAmounts((arr) => (arr.length === 1 ? arr : arr.filter((_, i) => i !== idx)));
  };
  const addTime = () => {
    setTimes((arr) => [...arr, "20:00"]);
    setTimeAmounts((arr) => [...arr, ""]);
  };
  const updateTimeAmount = (idx: number, v: string) =>
    setTimeAmounts((arr) => arr.map((a, i) => (i === idx ? v : a)));

  const canSave = !!userId && name.trim().length > 0 && (isRescue || times.length > 0);

  const handleSave = async () => {
    if (!canSave || saving || !userId) return;
    if (!isRescue && !dosageAmount.trim()) {
      toast.error(t("meds.form.amountRequired"));
      return;
    }
    setSaving(true);
    try {
      const baseAmount = dosageAmount ? parseFloat(dosageAmount) : null;
      const unit = (dosageUnit || "mg").trim() || "mg";
      const seen = new Set<string>();
      const scheduleSlots = isRescue
        ? []
        : times
            .map((time, i) => {
              if (!/^\d{1,2}:\d{2}$/.test(time) || seen.has(time)) return null;
              seen.add(time);
              const per = timeAmounts[i]?.trim();
              const amt = per ? parseFloat(per) : baseAmount;
              return {
                time,
                amount: Number.isFinite(amt as number) ? amt : null,
                unit,
              };
            })
            .filter((s): s is { time: string; amount: number | null; unit: string } => !!s)
            .sort((a, b) => a.time.localeCompare(b.time));
      const cleanTimes = scheduleSlots.map((s) => s.time);
      const pills = pillsRemaining ? parseInt(pillsRemaining, 10) : null;
      const threshold = refillThreshold ? parseInt(refillThreshold, 10) : 7;
      const dosageText = formatDosageText(dosageAmount, dosageUnit);

      // Only create today's dose rows when the med is active today (a future
      // start date or a past stop date means no doses for today). The
      // regenerate RPC enforces the same window server-side.
      const ymd = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const todayYmd = ymd(new Date());
      const activeToday =
        (!startDate || startDate <= todayYmd) && (!endDate || endDate >= todayYmd);

      const payload = {
        name: name.trim(),
        kind,
        dosage: dosageText,
        dosage_form: dosageForm || null,
        dosage_amount: Number.isFinite(baseAmount as number) ? baseAmount : null,
        dosage_unit: dosageUnit.trim() || null,
        schedule: scheduleSlots,
        with_food: withFood,
        prescriber: prescriberName.trim() || null,
        prescriber_name: prescriberName.trim() || null,
        pharmacy_name: pharmacyName.trim() || null,
        prescription_number: prescriptionNumber.trim() || null,
        times_of_day: cleanTimes,
        is_rescue: isRescue,
        pills_remaining: Number.isFinite(pills as number) ? pills : null,
        refill_threshold: Number.isFinite(threshold) ? threshold : 7,
        reminder_style: criticalAlarm ? "critical" : "standard",
        alarm_sound: alarmSound,
        start_date: startDate || null,
        end_date: endDate || null,
      };

      let med: {
        id: string;
        name: string;
        dosage: string | null;
        times_of_day: string[];
        is_rescue: boolean;
        kind: string;
      };

      if (isEditing && editingMedId) {
        const { data, error } = await supabase
          .from("medications")
          .update(payload)
          .eq("id", editingMedId)
          .select("id, name, dosage, times_of_day, is_rescue, kind")
          .single();
        if (error || !data) throw error ?? new Error("Failed to update");
        med = data;

        const nowIso = new Date().toISOString();
        await supabase
          .from("medication_doses")
          .delete()
          .eq("medication_id", med.id)
          .eq("status", "pending")
          .gte("scheduled_at", nowIso);

        if (!isRescue && activeToday && cleanTimes.length > 0) {
          const rows = scheduleSlots
            .map((s) => ({
              user_id: userId,
              medication_id: med.id,
              scheduled_at: todayIso(s.time),
              status: "pending" as const,
              amount: s.amount,
              unit: s.unit,
            }))
            .filter((r) => r.scheduled_at >= nowIso);
          if (rows.length > 0) {
            await supabase.from("medication_doses").insert(rows);
          }
        }
      } else {
        const { data, error } = await supabase
          .from("medications")
          .insert({ ...payload, user_id: userId, active: true })
          .select("id, name, dosage, times_of_day, is_rescue, kind")
          .single();
        if (error || !data) throw error ?? new Error("Failed to save");
        med = data;

        if (!isRescue && activeToday && cleanTimes.length > 0) {
          const rows = scheduleSlots.map((s) => ({
            user_id: userId,
            medication_id: med.id,
            scheduled_at: todayIso(s.time),
            status: "pending" as const,
            amount: s.amount,
            unit: s.unit,
          }));
          await supabase.from("medication_doses").insert(rows);
        }
      }

      if (!isRescue && isFirstMedication) {
        const perm = await requestPermission();
        if (perm === "granted") {
          await scheduleMedications([
            {
              id: med.id,
              name: med.name,
              dosage: med.dosage,
              times_of_day: med.times_of_day,
              kind: med.kind,
              is_rescue: med.is_rescue,
            },
          ]);
        }
      } else if (
        !isRescue &&
        typeof window !== "undefined" &&
        "Notification" in window &&
        window.Notification.permission === "granted"
      ) {
        await scheduleMedications([
          {
            id: med.id,
            name: med.name,
            dosage: med.dosage,
            times_of_day: med.times_of_day,
            kind: med.kind,
            is_rescue: med.is_rescue,
          },
        ]);
      }

      toast.success(
        isEditing
          ? t("meds.form.updated", { name: med.name })
          : t("meds.form.saved", { name: med.name }),
      );
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz) {
          await supabase
            .from("profiles")
            .update({ timezone: tz })
            .eq("id", userId)
            .is("timezone", null);
        }
        await supabase.rpc("regenerate_today_pending_doses", { _user_id: userId });
      } catch {
        /* non-fatal */
      }
      onSaved?.();
      onOpenChange(false);
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : t("meds.form.saveFailed");
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const kindLabel = (k: MedKind) => {
    const key =
      k === "medication"
        ? "filterMedications"
        : k === "supplement"
          ? "filterSupplements"
          : k === "vitamin"
            ? "filterVitamins"
            : k === "herbal"
              ? "filterHerbal"
              : "filterRescue";
    return t(`meds.${key}`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[90dvh] sm:h-auto sm:max-h-[88dvh] flex flex-col p-0 rounded-t-2xl overflow-hidden"
      >
        <SheetHeader className="border-b border-border">
          <div className="mx-auto w-full max-w-xl flex flex-row items-center justify-between space-y-0 px-5 pt-5 pb-3 pr-14">
            <SheetTitle className="font-serif text-lg font-normal">
              {isEditing ? t("meds.form.editTitle") : t("meds.form.addTitle")}
            </SheetTitle>
            <Button
              onClick={handleSave}
              disabled={!canSave || saving || formLoading}
              size="sm"
              className="rounded-full px-5"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isEditing ? (
                t("meds.form.saveChanges")
              ) : (
                t("meds.form.save")
              )}
            </Button>
          </div>
        </SheetHeader>

        <div
          data-testid="med-form-column"
          className="flex-1 min-h-0 overflow-y-auto mx-auto w-full max-w-xl px-5 py-5"
        >
          <MedNameSearch
            value={name}
            onChange={setName}
            onSelectEntry={(entry) => applyDictEntry(entry, dictSetters)}
            onCommit={(n) => void enrichFromDrugDb(n)}
            userMedNames={userMedNames}
            disabled={formLoading}
          />

          {formLoading ? (
            <FormSectionSkeleton />
          ) : (
            <>
              <GroupedFormLabel>{t("meds.form.details")}</GroupedFormLabel>
              <GroupedFormCard>
                <GroupedFormField label={t("meds.form.type")}>
                  <ToggleGroup
                    type="single"
                    value={kind}
                    onValueChange={(v) => v && setKind(v as MedKind)}
                    className="flex flex-wrap justify-start gap-1.5"
                  >
                    {KIND_OPTIONS.map((opt) => (
                      <ToggleGroupItem
                        key={opt}
                        value={opt}
                        className="rounded-full px-3 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                      >
                        {kindLabel(opt)}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </GroupedFormField>
                <GroupedFormRow label={t("meds.form.formField")}>
                  <Select value={dosageForm} onValueChange={setDosageForm}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder={t("meds.form.selectForm")} />
                    </SelectTrigger>
                    <SelectContent>
                      {DOSAGE_FORMS.map((f) => (
                        <SelectItem key={f} value={f} className="capitalize">
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </GroupedFormRow>
                <GroupedFormField
                  label={t("meds.form.strength")}
                  subtitle={`${t("meds.form.amount")} + ${t("meds.form.unit")}`}
                >
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      value={dosageAmount}
                      onChange={(e) => setDosageAmount(e.target.value)}
                      placeholder="500"
                      className="max-w-[120px]"
                    />
                    {unitMode === "preset" ? (
                      <Select
                        value={DOSAGE_UNITS.includes(dosageUnit) ? dosageUnit : "mg"}
                        onValueChange={(v) => {
                          if (v === "__custom__") {
                            setUnitMode("custom");
                            setDosageUnit("");
                          } else {
                            setDosageUnit(v);
                          }
                        }}
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DOSAGE_UNITS.map((u) => (
                            <SelectItem key={u} value={u}>
                              {u}
                            </SelectItem>
                          ))}
                          <SelectItem value="__custom__">{t("meds.form.custom")}</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex gap-1 items-center">
                        <Input
                          value={dosageUnit}
                          onChange={(e) => setDosageUnit(e.target.value)}
                          placeholder={t("meds.form.customUnit")}
                          className="w-[100px]"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setUnitMode("preset");
                            setDosageUnit("mg");
                          }}
                        >
                          {t("meds.form.reset")}
                        </Button>
                      </div>
                    )}
                  </div>
                  {isEditing && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t("meds.form.doseChangeNote")}
                    </p>
                  )}
                </GroupedFormField>
              </GroupedFormCard>

              {!isRescue && (
                <>
                  <GroupedFormLabel>{t("meds.form.duration")}</GroupedFormLabel>
                  <GroupedFormCard>
                    <GroupedFormRow
                      label={t("meds.form.startDate")}
                      subtitle={t("meds.form.startDateHint")}
                    >
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-[160px]"
                      />
                    </GroupedFormRow>
                    <GroupedFormRow label={t("meds.form.stopDate")}>
                      <Input
                        type="date"
                        value={endDate}
                        min={startDate || undefined}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-[160px]"
                      />
                    </GroupedFormRow>
                  </GroupedFormCard>
                </>
              )}

              {isRescue ? (
                <p className="mt-4 text-sm text-muted-foreground rounded-2xl border border-border bg-secondary/40 px-5 py-4">
                  {t("meds.form.rescueNote")}
                </p>
              ) : (
                <>
                  <GroupedFormLabel>{t("meds.form.schedule")}</GroupedFormLabel>
                  <GroupedFormCard>
                    <GroupedFormField
                      label={t("meds.form.times")}
                      subtitle={t("meds.form.timesSub")}
                    >
                      <div className="space-y-2">
                        {times.map((time, idx) => (
                          <div key={`${time}-${idx}`} className="flex items-center gap-2 flex-wrap">
                            <TimePicker12h
                              value={time}
                              onChange={(v) => updateTime(idx, v)}
                              aria-label={t("meds.form.times")}
                            />
                            <Input
                              type="number"
                              inputMode="decimal"
                              min={0}
                              value={timeAmounts[idx] ?? ""}
                              onChange={(e) => updateTimeAmount(idx, e.target.value)}
                              placeholder={dosageAmount || t("meds.form.amount")}
                              className="max-w-[100px]"
                            />
                            <span className="text-xs text-muted-foreground shrink-0">
                              {dosageUnit || "mg"}
                            </span>
                            {times.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeTime(idx)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </GroupedFormField>
                    <GroupedFormInsetButton onClick={addTime}>
                      <Plus className="h-4 w-4 inline mr-1.5" />
                      {t("meds.form.addTime")}
                    </GroupedFormInsetButton>
                  </GroupedFormCard>
                </>
              )}

              <GroupedFormLabel>{t("meds.form.reminders")}</GroupedFormLabel>
              <GroupedFormCard>
                <GroupedFormSwitchRow
                  label={t("meds.form.withFood")}
                  subtitle={t("meds.form.withFoodSub")}
                  checked={withFood}
                  onCheckedChange={setWithFood}
                />
                <GroupedFormSwitchRow
                  label={t("meds.form.criticalAlarm")}
                  subtitle={t("meds.form.criticalAlarmSub")}
                  checked={criticalAlarm}
                  onCheckedChange={setCriticalAlarm}
                />
                <GroupedFormField
                  label={t("meds.form.reminderSound")}
                  subtitle={
                    criticalAlarm
                      ? t("meds.form.reminderSoundCritical")
                      : t("meds.form.reminderSoundStandard")
                  }
                >
                  <div className="flex gap-2 items-center">
                    <Select
                      value={alarmSound}
                      onValueChange={(v) => setAlarmSound(v as AlarmSoundId)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALARM_SOUNDS.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            <span className="font-medium">{s.label}</span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              {s.description}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => playAlarmOnce(alarmSound)}
                      aria-label={t("meds.form.previewSound")}
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                  </div>
                </GroupedFormField>
              </GroupedFormCard>

              {!isRescue && (
                <>
                  <GroupedFormLabel>{t("meds.form.refill")}</GroupedFormLabel>
                  <GroupedFormCard>
                    <GroupedFormRow label={t("meds.form.pillsRemaining")}>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={pillsRemaining}
                        onChange={(e) => setPillsRemaining(e.target.value)}
                        placeholder="30"
                        className="w-[100px]"
                      />
                    </GroupedFormRow>
                    <GroupedFormRow label={t("meds.form.alertWhen")}>
                      {refillMode === "preset" ? (
                        <Select
                          value={
                            REFILL_PRESETS.includes(
                              refillThreshold as (typeof REFILL_PRESETS)[number],
                            )
                              ? refillThreshold
                              : "7"
                          }
                          onValueChange={(v) => {
                            if (v === "__custom__") {
                              setRefillMode("custom");
                            } else {
                              setRefillThreshold(v);
                            }
                          }}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3">3 {t("meds.form.days")}</SelectItem>
                            <SelectItem value="7">7 {t("meds.form.days")}</SelectItem>
                            <SelectItem value="14">14 {t("meds.form.days")}</SelectItem>
                            <SelectItem value="30">30 {t("meds.form.days")}</SelectItem>
                            <SelectItem value="__custom__">{t("meds.form.custom")}</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex gap-1 items-center">
                          <Input
                            type="number"
                            inputMode="numeric"
                            min={1}
                            value={refillThreshold}
                            onChange={(e) => setRefillThreshold(e.target.value)}
                            className="w-[80px]"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setRefillMode("preset");
                              setRefillThreshold("7");
                            }}
                          >
                            {t("meds.form.reset")}
                          </Button>
                        </div>
                      )}
                    </GroupedFormRow>
                  </GroupedFormCard>
                </>
              )}

              <Collapsible open={prescriberOpen} onOpenChange={setPrescriberOpen}>
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="mt-6 flex w-full items-center justify-between px-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span>{t("meds.form.prescriberOptional")}</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${prescriberOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <GroupedFormCard className="mt-2">
                    <GroupedFormField label={t("meds.form.prescriberName")}>
                      <Input
                        value={prescriberName}
                        onChange={(e) => setPrescriberName(e.target.value)}
                        placeholder="Dr. ..."
                      />
                    </GroupedFormField>
                    <GroupedFormField label={t("meds.form.pharmacy")}>
                      <Input
                        value={pharmacyName}
                        onChange={(e) => setPharmacyName(e.target.value)}
                        placeholder={t("meds.form.pharmacy")}
                      />
                    </GroupedFormField>
                    <GroupedFormField label={t("meds.form.rxNumber")}>
                      <Input
                        value={prescriptionNumber}
                        onChange={(e) => setPrescriptionNumber(e.target.value)}
                        placeholder="Rx #"
                      />
                    </GroupedFormField>
                  </GroupedFormCard>
                </CollapsibleContent>
              </Collapsible>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
