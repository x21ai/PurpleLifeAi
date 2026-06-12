import * as React from "react";
import { Plus, X, Loader2, ChevronDown } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { searchMedDictionary, type MedDictEntry } from "@/lib/med-dictionary";
import {
  ALARM_SOUNDS,
  DEFAULT_ALARM_SOUND,
  playAlarmOnce,
  type AlarmSoundId,
} from "@/lib/alarm-sounds";
import { Volume2 } from "lucide-react";

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

const KIND_OPTIONS: { value: MedKind; label: string }[] = [
  { value: "medication", label: "Medication" },
  { value: "supplement", label: "Supplement" },
  { value: "vitamin", label: "Vitamin" },
  { value: "herbal", label: "Herbal" },
  { value: "rescue", label: "Rescue" },
];

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
  if (!n) return null; // never persist a bare unit like "mg"
  return u ? `${n} ${u}` : n;
}

export function MedicationFormSheet({
  open,
  onOpenChange,
  onSaved,
  isFirstMedication,
  editingMedId,
  prefill,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: () => void;
  isFirstMedication: boolean;
  editingMedId?: string | null;
  prefill?: MedPrefill | null;
}) {
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
  // Per-time amount overrides. Index-aligned with `times`. Empty string = use the base amount.
  const [timeAmounts, setTimeAmounts] = React.useState<string[]>([""]);
  const [pillsRemaining, setPillsRemaining] = React.useState("");
  const [refillThreshold, setRefillThreshold] = React.useState("7");
  const [refillMode, setRefillMode] = React.useState<"preset" | "custom">("preset");
  const [prescriberName, setPrescriberName] = React.useState("");
  const [pharmacyName, setPharmacyName] = React.useState("");
  const [prescriptionNumber, setPrescriptionNumber] = React.useState("");
  const [prescriberOpen, setPrescriberOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [nameFocused, setNameFocused] = React.useState(false);
  const nameSuggestions = React.useMemo<MedDictEntry[]>(
    () => (nameFocused ? searchMedDictionary(name, 8) : []),
    [name, nameFocused],
  );

  const isRescue = kind === "rescue";
  const isEditing = !!editingMedId;

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
      setPrescriberOpen(false);
      setNameFocused(false);
    }
  }, [open]);

  // Apply scan/voice prefill when sheet opens without an existing med id.
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

  // Load existing medication when opening in edit mode.
  React.useEffect(() => {
    if (!open || !editingMedId) return;
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase
        .from("medications")
        .select(
          "name, kind, dosage_form, dosage_amount, dosage_unit, with_food, schedule, times_of_day, pills_remaining, refill_threshold, prescriber_name, pharmacy_name, prescription_number, is_rescue, reminder_style, alarm_sound",
        )
        .eq("id", editingMedId)
        .maybeSingle();
      if (cancelled || error || !data) return;
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
      setPrescriberOpen(!!(m.prescriber_name || m.pharmacy_name || m.prescription_number));
    })();
    return () => {
      cancelled = true;
    };
  }, [open, editingMedId]);

  const updateTime = (idx: number, v: string) =>
    setTimes((arr) => arr.map((t, i) => (i === idx ? v : t)));
  const removeTime = (idx: number) =>
    setTimes((arr) => (arr.length === 1 ? arr : arr.filter((_, i) => i !== idx)));
  const removeTimeAmount = (idx: number) =>
    setTimeAmounts((arr) => (arr.length === 1 ? arr : arr.filter((_, i) => i !== idx)));
  const addTime = () => {
    setTimes((arr) => [...arr, "20:00"]);
    setTimeAmounts((arr) => [...arr, ""]);
  };
  const updateTimeAmount = (idx: number, v: string) =>
    setTimeAmounts((arr) => arr.map((a, i) => (i === idx ? v : a)));

  const canSave = !!userId && name.trim().length > 0 && (isRescue || times.length > 0);

  const handleSave = async () => {
    if (!canSave || saving || !userId) return;
    // Require dosage amount for non-rescue meds so today's list never shows a blank row.
    if (!isRescue && !dosageAmount.trim()) {
      toast.error("Please enter a dose amount (e.g. 750 mg).");
      return;
    }
    setSaving(true);
    try {
      // Build [{time, amount, unit}] preserving per-time amounts, dedup'd by time.
      const baseAmount = dosageAmount ? parseFloat(dosageAmount) : null;
      const unit = (dosageUnit || "mg").trim() || "mg";
      const seen = new Set<string>();
      const scheduleSlots = isRescue
        ? []
        : times
            .map((t, i) => {
              if (!/^\d{1,2}:\d{2}$/.test(t) || seen.has(t)) return null;
              seen.add(t);
              const per = timeAmounts[i]?.trim();
              const amt = per ? parseFloat(per) : baseAmount;
              return {
                time: t,
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

        // Re-sync future pending doses for today to match the new schedule.
        // Already-taken/missed doses are preserved.
        const nowIso = new Date().toISOString();
        await supabase
          .from("medication_doses")
          .delete()
          .eq("medication_id", med.id)
          .eq("status", "pending")
          .gte("scheduled_at", nowIso);

        if (!isRescue && cleanTimes.length > 0) {
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

        if (!isRescue && cleanTimes.length > 0) {
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

      toast.success(isEditing ? `${med.name} updated` : `${med.name} added`);
      // Capture the user's local timezone (one-time) and sync today's pending
      // doses on the server so they show at the times the user actually set.
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
      const message = err instanceof Error ? err.message : "Could not save medication";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] flex flex-col p-0 rounded-t-2xl">
        <SheetHeader className="px-5 pt-5 pb-3 pr-14 flex-row items-center justify-between space-y-0 border-b border-border">
          <SheetTitle className="font-serif text-lg font-normal">
            {isEditing ? "Edit medication" : "Add medication"}
          </SheetTitle>
          <Button
            onClick={handleSave}
            disabled={!canSave || saving}
            size="sm"
            className="rounded-full px-5"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isEditing ? (
              "Save changes"
            ) : (
              "Save"
            )}
          </Button>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <div className="space-y-2">
            <Label>Type</Label>
            <ToggleGroup
              type="single"
              value={kind}
              onValueChange={(v) => v && setKind(v as MedKind)}
              className="flex flex-wrap justify-start gap-1"
            >
              {KIND_OPTIONS.map((opt) => (
                <ToggleGroupItem
                  key={opt.value}
                  value={opt.value}
                  className="rounded-full px-3 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  {opt.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="med-name">Name</Label>
            <div className="relative">
              <Input
                id="med-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => setNameFocused(true)}
                onBlur={() => {
                  // Delay so click on suggestion registers.
                  setTimeout(() => setNameFocused(false), 150);
                }}
                placeholder="e.g. Keppra"
                autoComplete="off"
              />
              {nameSuggestions.length > 0 && (
                <ul
                  className="absolute z-50 mt-1 left-0 right-0 max-h-64 overflow-y-auto rounded-xl border border-border bg-popover shadow-lg"
                  role="listbox"
                >
                  {nameSuggestions.map((entry) => (
                    <li key={entry.label}>
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setName(entry.label);
                          setKind(entry.kind);
                          setNameFocused(false);
                        }}
                      >
                        <span className="text-foreground">{entry.label}</span>
                        <span className="ml-2 text-xs text-muted-foreground capitalize">
                          {entry.kind}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Form</Label>
              <Select value={dosageForm} onValueChange={setDosageForm}>
                <SelectTrigger>
                  <SelectValue placeholder="Select form" />
                </SelectTrigger>
                <SelectContent>
                  {DOSAGE_FORMS.map((f) => (
                    <SelectItem key={f} value={f} className="capitalize">
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="med-amount">Default amount</Label>
              <Input
                id="med-amount"
                type="number"
                inputMode="decimal"
                min={0}
                value={dosageAmount}
                onChange={(e) => setDosageAmount(e.target.value)}
                placeholder="500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Unit</Label>
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
                <SelectTrigger className="max-w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOSAGE_UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                  <SelectItem value="__custom__">Custom…</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="flex gap-2 items-center max-w-[260px]">
                <Input
                  autoFocus
                  value={dosageUnit}
                  onChange={(e) => setDosageUnit(e.target.value)}
                  placeholder="Custom unit"
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
                  Reset
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Take with food</p>
              <p className="text-xs text-muted-foreground mt-0.5">Reminders will mention this.</p>
            </div>
            <Switch checked={withFood} onCheckedChange={setWithFood} />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
            <div className="pr-3">
              <p className="text-sm font-medium text-foreground">Critical alarm</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sound an alarm and keep prompting until you confirm. Use for must-take doses.
              </p>
            </div>
            <Switch checked={criticalAlarm} onCheckedChange={setCriticalAlarm} />
          </div>

          <div className="space-y-2 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">Reminder sound</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {criticalAlarm
                    ? "Plays on a loop until you confirm the dose."
                    : "Plays once when the reminder fires."}
                </p>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => playAlarmOnce(alarmSound)}
                aria-label="Preview sound"
              >
                <Volume2 className="h-4 w-4" />
              </Button>
            </div>
            <Select value={alarmSound} onValueChange={(v) => setAlarmSound(v as AlarmSoundId)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALARM_SOUNDS.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="font-medium">{s.label}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{s.description}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isRescue ? (
            <p className="text-sm text-muted-foreground rounded-xl bg-secondary/60 p-4">
              Rescue meds are logged when taken, not on a schedule.
            </p>
          ) : (
            <div className="space-y-2">
              <Label>Times and per-dose amount</Label>
              <p className="text-xs text-muted-foreground -mt-1">
                Leave amount blank to use the default. E.g. 500 at 10:00, 750 at 19:00.
              </p>
              <div className="space-y-2">
                {times.map((t, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={t}
                      onChange={(e) => updateTime(idx, e.target.value)}
                      className="max-w-[130px]"
                    />
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      value={timeAmounts[idx] ?? ""}
                      onChange={(e) => updateTimeAmount(idx, e.target.value)}
                      placeholder={dosageAmount || "amount"}
                      className="max-w-[110px]"
                    />
                    <span className="text-xs text-muted-foreground shrink-0">
                      {dosageUnit || "mg"}
                    </span>
                    {times.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          removeTime(idx);
                          removeTimeAmount(idx);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addTime}>
                  <Plus className="h-4 w-4 mr-1" /> Add time
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-3 rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-medium text-foreground">Refill</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="med-pills">Pills remaining</Label>
                <Input
                  id="med-pills"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={pillsRemaining}
                  onChange={(e) => setPillsRemaining(e.target.value)}
                  placeholder="30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="med-threshold">Alert when ≤</Label>
                {refillMode === "preset" ? (
                  <Select
                    value={
                      REFILL_PRESETS.includes(refillThreshold as (typeof REFILL_PRESETS)[number])
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
                    <SelectTrigger id="med-threshold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 days</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="__custom__">Custom…</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex gap-2 items-center">
                    <Input
                      id="med-threshold"
                      autoFocus
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={refillThreshold}
                      onChange={(e) => setRefillThreshold(e.target.value)}
                      placeholder="days"
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
                      Reset
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Collapsible open={prescriberOpen} onOpenChange={setPrescriberOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between px-0 hover:bg-transparent">
                <span className="text-sm font-medium">Prescriber (optional)</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${prescriberOpen ? "rotate-180" : ""}`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              <div className="space-y-2">
                <Label htmlFor="med-prescriber">Prescriber name</Label>
                <Input
                  id="med-prescriber"
                  value={prescriberName}
                  onChange={(e) => setPrescriberName(e.target.value)}
                  placeholder="Dr. ..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="med-pharmacy">Pharmacy</Label>
                <Input
                  id="med-pharmacy"
                  value={pharmacyName}
                  onChange={(e) => setPharmacyName(e.target.value)}
                  placeholder="Pharmacy name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="med-rx">Prescription number</Label>
                <Input
                  id="med-rx"
                  value={prescriptionNumber}
                  onChange={(e) => setPrescriptionNumber(e.target.value)}
                  placeholder="Rx #"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </SheetContent>
    </Sheet>
  );
}
