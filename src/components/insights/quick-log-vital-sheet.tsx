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
import { logVital } from "@/lib/health-vitals.functions";
import { userMessage } from "@/lib/user-message";

export type VitalKind = "weight" | "bp" | "glucose" | "spo2" | "temp" | "resp_rate";

type Spec = {
  title: string;
  primary: { label: string; unit: string; placeholder: string };
  secondary?: { label: string; unit: string; placeholder: string };
  helper?: string;
};

const SPECS: Record<VitalKind, Spec> = {
  weight: {
    title: "Log weight",
    primary: { label: "Weight", unit: "kg", placeholder: "72.5" },
    helper: "Enter your weight in kilograms.",
  },
  bp: {
    title: "Log blood pressure",
    primary: { label: "Systolic", unit: "mmHg", placeholder: "120" },
    secondary: { label: "Diastolic", unit: "mmHg", placeholder: "80" },
    helper: "Resting reading, taken while seated for 5 minutes.",
  },
  glucose: {
    title: "Log glucose",
    primary: { label: "Glucose", unit: "mg/dL", placeholder: "98" },
    helper: "Fasting or post-meal , note the context below.",
  },
  spo2: {
    title: "Log blood oxygen",
    primary: { label: "SpO₂", unit: "%", placeholder: "98" },
  },
  temp: {
    title: "Log body temperature",
    primary: { label: "Temperature", unit: "°C", placeholder: "36.7" },
  },
  resp_rate: {
    title: "Log respiratory rate",
    primary: { label: "Breaths / min", unit: "br/min", placeholder: "14" },
  },
};

export function QuickLogVitalSheet({
  kind,
  open,
  onOpenChange,
}: {
  kind: VitalKind;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const spec = SPECS[kind];
  const fn = useServerFn(logVital);
  const qc = useQueryClient();
  const [value, setValue] = React.useState("");
  const [value2, setValue2] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setValue("");
      setValue2("");
      setNotes("");
    }
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = Number.parseFloat(value);
    if (!Number.isFinite(v)) {
      toast.error("Enter a number");
      return;
    }
    const v2 = spec.secondary ? Number.parseFloat(value2) : null;
    if (spec.secondary && !Number.isFinite(v2 as number)) {
      toast.error(`Enter ${spec.secondary.label.toLowerCase()}`);
      return;
    }
    setBusy(true);
    try {
      await fn({
        data: {
          kind,
          value: v,
          value2: v2,
          unit: spec.primary.unit,
          notes: notes.trim() ? notes.trim() : null,
        },
      });
      toast.success("Logged");
      await qc.invalidateQueries({ queryKey: ["insights", "vitals"] });
      onOpenChange(false);
    } catch (err) {
      toast.error(userMessage(err, "That didn't save. Your changes are still here, try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader>
          <SheetTitle className="font-serif text-2xl">{spec.title}</SheetTitle>
          {spec.helper && <SheetDescription>{spec.helper}</SheetDescription>}
        </SheetHeader>
        <form onSubmit={submit} className="mt-6 space-y-4 max-w-md">
          <div>
            <Label htmlFor="qlv-1">
              {spec.primary.label}{" "}
              <span className="text-muted-foreground">({spec.primary.unit})</span>
            </Label>
            <Input
              id="qlv-1"
              type="number"
              inputMode="decimal"
              step="any"
              autoFocus
              placeholder={spec.primary.placeholder}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="mt-1"
            />
          </div>
          {spec.secondary && (
            <div>
              <Label htmlFor="qlv-2">
                {spec.secondary.label}{" "}
                <span className="text-muted-foreground">({spec.secondary.unit})</span>
              </Label>
              <Input
                id="qlv-2"
                type="number"
                inputMode="decimal"
                step="any"
                placeholder={spec.secondary.placeholder}
                value={value2}
                onChange={(e) => setValue2(e.target.value)}
                className="mt-1"
              />
            </div>
          )}
          <div>
            <Label htmlFor="qlv-notes">Notes (optional)</Label>
            <Input
              id="qlv-notes"
              placeholder="e.g. fasting, after walk"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
