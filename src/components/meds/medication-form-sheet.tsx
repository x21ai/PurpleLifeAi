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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { toast } from "sonner";
import { requestPermission, scheduleMedications } from "@/lib/med-notifications";

export type MedKind = "medication" | "supplement" | "vitamin" | "herbal" | "rescue";

const KIND_OPTIONS: { value: MedKind; label: string }[] = [
  { value: "medication", label: "Medication" },
  { value: "supplement", label: "Supplement" },
  { value: "vitamin", label: "Vitamin" },
  { value: "herbal", label: "Herbal" },
  { value: "rescue", label: "Rescue" },
];

const DOSAGE_FORMS = [
  "pill", "capsule", "tablet", "liquid", "injection", "drops", "patch", "inhaler", "powder", "gummy", "other",
] as const;

const DOSAGE_UNITS = ["mg", "mcg", "g", "ml", "IU", "drops", "sprays", "units"];

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

export function MedicationFormSheet({
  open,
  onOpenChange,
  onSaved,
  isFirstMedication,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: () => void;
  isFirstMedication: boolean;
}) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [name, setName] = React.useState("");
  const [kind, setKind] = React.useState<MedKind>("medication");
  const [dosageForm, setDosageForm] = React.useState<string>("");
  const [dosageAmount, setDosageAmount] = React.useState("");
  const [dosageUnit, setDosageUnit] = React.useState("mg");
  const [withFood, setWithFood] = React.useState(false);
  const [times, setTimes] = React.useState<string[]>(["08:00"]);
  const [pillsRemaining, setPillsRemaining] = React.useState("");
  const [refillThreshold, setRefillThreshold] = React.useState("7");
  const [prescriberName, setPrescriberName] = React.useState("");
  const [pharmacyName, setPharmacyName] = React.useState("");
  const [prescriptionNumber, setPrescriptionNumber] = React.useState("");
  const [prescriberOpen, setPrescriberOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const isRescue = kind === "rescue";

  React.useEffect(() => {
    if (!open) {
      setName("");
      setKind("medication");
      setDosageForm("");
      setDosageAmount("");
      setDosageUnit("mg");
      setWithFood(false);
      setTimes(["08:00"]);
      setPillsRemaining("");
      setRefillThreshold("7");
      setPrescriberName("");
      setPharmacyName("");
      setPrescriptionNumber("");
      setPrescriberOpen(false);
    }
  }, [open]);

  const updateTime = (idx: number, v: string) =>
    setTimes((arr) => arr.map((t, i) => (i === idx ? v : t)));
  const removeTime = (idx: number) =>
    setTimes((arr) => (arr.length === 1 ? arr : arr.filter((_, i) => i !== idx)));
  const addTime = () => setTimes((arr) => [...arr, "20:00"]);

  const canSave = !!userId && name.trim().length > 0 && (isRescue || times.length > 0);

  const handleSave = async () => {
    if (!canSave || saving || !userId) return;
    setSaving(true);
    try {
      const cleanTimes = isRescue
        ? []
        : Array.from(new Set(times.filter((t) => /^\d{1,2}:\d{2}$/.test(t)))).sort();
      const pills = pillsRemaining ? parseInt(pillsRemaining, 10) : null;
      const threshold = refillThreshold ? parseInt(refillThreshold, 10) : 7;
      const amount = dosageAmount ? parseFloat(dosageAmount) : null;
      const dosageText = formatDosageText(dosageAmount, dosageUnit);

      const { data: med, error } = await supabase
        .from("medications")
        .insert({
          user_id: userId,
          name: name.trim(),
          kind,
          dosage: dosageText,
          dosage_form: dosageForm || null,
          dosage_amount: Number.isFinite(amount as number) ? amount : null,
          dosage_unit: dosageUnit.trim() || null,
          with_food: withFood,
          prescriber: prescriberName.trim() || null,
          prescriber_name: prescriberName.trim() || null,
          pharmacy_name: pharmacyName.trim() || null,
          prescription_number: prescriptionNumber.trim() || null,
          times_of_day: cleanTimes,
          is_rescue: isRescue,
          pills_remaining: Number.isFinite(pills as number) ? pills : null,
          refill_threshold: Number.isFinite(threshold) ? threshold : 7,
          active: true,
        })
        .select("id, name, dosage, times_of_day, is_rescue, kind")
        .single();
      if (error || !med) throw error ?? new Error("Failed to save");

      if (!isRescue && cleanTimes.length > 0) {
        const rows = cleanTimes.map((t) => ({
          user_id: userId,
          medication_id: med.id,
          scheduled_at: todayIso(t),
          status: "pending" as const,
        }));
        await supabase.from("medication_doses").insert(rows);
      }

      if (!isRescue && isFirstMedication) {
        const perm = await requestPermission();
        if (perm === "granted") {
          await scheduleMedications([{
            id: med.id,
            name: med.name,
            dosage: med.dosage,
            times_of_day: med.times_of_day,
            kind: med.kind,
            is_rescue: med.is_rescue,
          }]);
        }
      } else if (!isRescue && Notification?.permission === "granted") {
        await scheduleMedications([{
          id: med.id,
          name: med.name,
          dosage: med.dosage,
          times_of_day: med.times_of_day,
          kind: med.kind,
          is_rescue: med.is_rescue,
        }]);
      }

      toast.success(`${med.name} added`);
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
        <SheetHeader className="px-5 pt-5 pb-3 flex-row items-center justify-between space-y-0 border-b border-border">
          <SheetTitle className="font-serif text-lg font-normal">Add medication</SheetTitle>
          <Button onClick={handleSave} disabled={!canSave || saving} size="sm" className="rounded-full px-5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
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
            <Input id="med-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Keppra" autoFocus />
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
                    <SelectItem key={f} value={f} className="capitalize">{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="med-amount">Amount</Label>
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
            <Select value={dosageUnit} onValueChange={setDosageUnit}>
              <SelectTrigger className="max-w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOSAGE_UNITS.map((u) => (
                  <SelectItem key={u} value={u}>{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Take with food</p>
              <p className="text-xs text-muted-foreground mt-0.5">Reminders will mention this.</p>
            </div>
            <Switch checked={withFood} onCheckedChange={setWithFood} />
          </div>

          {isRescue ? (
            <p className="text-sm text-muted-foreground rounded-xl bg-secondary/60 p-4">
              Rescue meds are logged when taken, not on a schedule.
            </p>
          ) : (
            <div className="space-y-2">
              <Label>Times of day</Label>
              <div className="space-y-2">
                {times.map((t, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={t}
                      onChange={(e) => updateTime(idx, e.target.value)}
                      className="max-w-[160px]"
                    />
                    {times.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeTime(idx)}>
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
                <Input
                  id="med-threshold"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={refillThreshold}
                  onChange={(e) => setRefillThreshold(e.target.value)}
                  placeholder="7"
                />
              </div>
            </div>
          </div>

          <Collapsible open={prescriberOpen} onOpenChange={setPrescriberOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between px-0 hover:bg-transparent">
                <span className="text-sm font-medium">Prescriber (optional)</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${prescriberOpen ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              <div className="space-y-2">
                <Label htmlFor="med-prescriber">Prescriber name</Label>
                <Input id="med-prescriber" value={prescriberName} onChange={(e) => setPrescriberName(e.target.value)} placeholder="Dr. ..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="med-pharmacy">Pharmacy</Label>
                <Input id="med-pharmacy" value={pharmacyName} onChange={(e) => setPharmacyName(e.target.value)} placeholder="Pharmacy name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="med-rx">Prescription number</Label>
                <Input id="med-rx" value={prescriptionNumber} onChange={(e) => setPrescriptionNumber(e.target.value)} placeholder="Rx #" />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </SheetContent>
    </Sheet>
  );
}
