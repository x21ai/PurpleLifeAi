import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { setVitalGoal, deleteVitalGoal, type VitalGoal } from "@/lib/health-vitals.functions";
import type { VitalKind } from "./quick-log-vital-sheet";
import { userMessage } from "@/lib/user-message";

type Spec = {
  title: string;
  primaryLabel: string;
  unit: string;
  helper: string;
  secondaryLabel?: string;
};

const SPECS: Record<VitalKind, Spec> = {
  weight: {
    title: "Weight target",
    primaryLabel: "Target range",
    unit: "kg",
    helper: "A gentle range to aim for, not a hard goal.",
  },
  bp: {
    title: "Blood pressure target",
    primaryLabel: "Systolic range",
    secondaryLabel: "Diastolic range",
    unit: "mmHg",
    helper: "Many adults aim for under 130/80, but check with your clinician.",
  },
  glucose: {
    title: "Glucose target",
    primaryLabel: "Target range",
    unit: "mg/dL",
    helper: "Fasting glucose is commonly targeted at 70–100 mg/dL.",
  },
  spo2: {
    title: "Blood oxygen target",
    primaryLabel: "Target range",
    unit: "%",
    helper: "Most healthy adults sit at 95–100%.",
  },
  temp: {
    title: "Body temperature range",
    primaryLabel: "Target range",
    unit: "°C",
    helper: "Resting body temp is typically 36.1–37.2 °C.",
  },
  resp_rate: {
    title: "Respiratory rate range",
    primaryLabel: "Target range",
    unit: "br/min",
    helper: "Resting adults usually breathe 12–20 times per minute.",
  },
};

export function SetGoalSheet({
  kind,
  current,
  open,
  onOpenChange,
}: {
  kind: VitalKind;
  current: VitalGoal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const spec = SPECS[kind];
  const save = useServerFn(setVitalGoal);
  const remove = useServerFn(deleteVitalGoal);
  const qc = useQueryClient();
  const [minV, setMinV] = React.useState<string>("");
  const [maxV, setMaxV] = React.useState<string>("");
  const [min2, setMin2] = React.useState<string>("");
  const [max2, setMax2] = React.useState<string>("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setMinV(current?.target_min != null ? String(current.target_min) : "");
    setMaxV(current?.target_max != null ? String(current.target_max) : "");
    setMin2(current?.target_min2 != null ? String(current.target_min2) : "");
    setMax2(current?.target_max2 != null ? String(current.target_max2) : "");
  }, [open, current]);

  async function onSave() {
    setSaving(true);
    try {
      const tmin = minV.trim() === "" ? null : Number(minV);
      const tmax = maxV.trim() === "" ? null : Number(maxV);
      const tmin2 = min2.trim() === "" ? null : Number(min2);
      const tmax2 = max2.trim() === "" ? null : Number(max2);
      for (const v of [tmin, tmax, tmin2, tmax2]) {
        if (v != null && !Number.isFinite(v)) {
          toast.error("Enter valid numbers");
          setSaving(false);
          return;
        }
      }
      await save({
        data: {
          kind,
          target_min: tmin,
          target_max: tmax,
          target_min2: tmin2,
          target_max2: tmax2,
          unit: spec.unit,
        },
      });
      await qc.invalidateQueries({ queryKey: ["insights", "vital-goals"] });
      toast.success("Target saved");
      onOpenChange(false);
    } catch (err) {
      toast.error(userMessage(err, "That didn't save. Your changes are still here, try again."));
    } finally {
      setSaving(false);
    }
  }

  async function onRemove() {
    setSaving(true);
    try {
      await remove({ data: { kind } });
      await qc.invalidateQueries({ queryKey: ["insights", "vital-goals"] });
      toast.success("Target removed");
      onOpenChange(false);
    } catch (err) {
      toast.error(userMessage(err, "Couldn't remove"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader className="text-left">
          <SheetTitle className="font-serif text-2xl">{spec.title}</SheetTitle>
          <SheetDescription className="text-sm">{spec.helper}</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              {spec.primaryLabel} ({spec.unit})
            </Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Input
                inputMode="decimal"
                placeholder="Min"
                value={minV}
                onChange={(e) => setMinV(e.target.value)}
              />
              <Input
                inputMode="decimal"
                placeholder="Max"
                value={maxV}
                onChange={(e) => setMaxV(e.target.value)}
              />
            </div>
          </div>
          {spec.secondaryLabel && (
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                {spec.secondaryLabel} ({spec.unit})
              </Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Input
                  inputMode="decimal"
                  placeholder="Min"
                  value={min2}
                  onChange={(e) => setMin2(e.target.value)}
                />
                <Input
                  inputMode="decimal"
                  placeholder="Max"
                  value={max2}
                  onChange={(e) => setMax2(e.target.value)}
                />
              </div>
            </div>
          )}
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Targets are personal reference points. Purple doesn't nudge or score you on them ,
            they're just here so your tiles can show ✓ or ⚠ at a glance.
          </p>
          <div className="flex items-center gap-2 pt-2">
            <Button onClick={onSave} disabled={saving} className="rounded-full">
              Save target
            </Button>
            {current && (
              <Button
                variant="ghost"
                onClick={onRemove}
                disabled={saving}
                className="rounded-full text-muted-foreground"
              >
                Remove
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
