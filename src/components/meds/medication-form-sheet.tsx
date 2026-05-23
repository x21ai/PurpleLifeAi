import * as React from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { toast } from "sonner";
import { requestPermission, scheduleMedications } from "@/lib/med-notifications";

function todayIso(time: string): string {
  const [h, m] = time.split(":");
  const d = new Date();
  d.setHours(parseInt(h, 10) || 0, parseInt(m, 10) || 0, 0, 0);
  return d.toISOString();
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
  const [dosage, setDosage] = React.useState("");
  const [prescriber, setPrescriber] = React.useState("");
  const [times, setTimes] = React.useState<string[]>(["08:00"]);
  const [isRescue, setIsRescue] = React.useState(false);
  const [pillsRemaining, setPillsRemaining] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setName(""); setDosage(""); setPrescriber("");
      setTimes(["08:00"]); setIsRescue(false); setPillsRemaining("");
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
      const cleanTimes = isRescue ? [] : Array.from(new Set(times.filter((t) => /^\d{1,2}:\d{2}$/.test(t)))).sort();
      const pills = pillsRemaining ? parseInt(pillsRemaining, 10) : null;
      const { data: med, error } = await supabase
        .from("medications")
        .insert({
          user_id: userId,
          name: name.trim(),
          dosage: dosage.trim() || null,
          prescriber: prescriber.trim() || null,
          times_of_day: cleanTimes,
          is_rescue: isRescue,
          pills_remaining: Number.isFinite(pills as number) ? pills : null,
          active: true,
        })
        .select("id, name, dosage, times_of_day, is_rescue")
        .single();
      if (error || !med) throw error ?? new Error("Failed to save");

      // Seed today's doses for scheduled (non-rescue) meds.
      if (!isRescue && cleanTimes.length > 0) {
        const rows = cleanTimes.map((t) => ({
          user_id: userId,
          medication_id: med.id,
          scheduled_at: todayIso(t),
          status: "pending" as const,
        }));
        await supabase.from("medication_doses").insert(rows);
      }

      // First medication → ask for notification permission.
      if (!isRescue && isFirstMedication) {
        const perm = await requestPermission();
        if (perm === "granted") {
          await scheduleMedications([{
            id: med.id, name: med.name, dosage: med.dosage, times_of_day: med.times_of_day,
          }]);
        }
      } else if (!isRescue && Notification?.permission === "granted") {
        await scheduleMedications([{
          id: med.id, name: med.name, dosage: med.dosage, times_of_day: med.times_of_day,
        }]);
      }

      toast.success(`${med.name} added`);
      onSaved?.();
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Could not save medication");
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
            <Label htmlFor="med-name">Name</Label>
            <Input id="med-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Keppra" autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="med-dosage">Dosage</Label>
            <Input id="med-dosage" value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="e.g. 500 mg" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="med-prescriber">Prescriber (optional)</Label>
            <Input id="med-prescriber" value={prescriber} onChange={(e) => setPrescriber(e.target.value)} placeholder="Dr. ..." />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Rescue medication</p>
              <p className="text-xs text-muted-foreground mt-0.5">Taken as needed, no schedule.</p>
            </div>
            <Switch checked={isRescue} onCheckedChange={setIsRescue} />
          </div>

          {!isRescue && (
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

          <div className="space-y-2">
            <Label htmlFor="med-pills">Pills remaining (optional)</Label>
            <Input
              id="med-pills"
              type="number"
              inputMode="numeric"
              min={0}
              value={pillsRemaining}
              onChange={(e) => setPillsRemaining(e.target.value)}
              placeholder="e.g. 30"
              className="max-w-[160px]"
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}