import * as React from "react";
import { Loader2, Sparkles } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { FEATURE_CATALOG, type FeatureKey } from "@/lib/feature-catalog";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  conditionLabel: string;
  /** Feature keys recommended for this condition (already filtered to currently disabled). */
  candidateFeatures: FeatureKey[];
  busy?: boolean;
  onConfirm: (selectedKeys: FeatureKey[]) => Promise<void> | void;
};

export function EnableTrackersSheet({
  open,
  onOpenChange,
  conditionLabel,
  candidateFeatures,
  busy,
  onConfirm,
}: Props) {
  const [selected, setSelected] = React.useState<Set<string>>(new Set(candidateFeatures));

  React.useEffect(() => {
    setSelected(new Set(candidateFeatures));
  }, [candidateFeatures]);

  const defs = React.useMemo(
    () => FEATURE_CATALOG.filter((f) => candidateFeatures.includes(f.key)),
    [candidateFeatures],
  );

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-serif text-2xl">
            <Sparkles className="h-5 w-5 text-primary" /> Turn on trackers for {conditionLabel}?
          </SheetTitle>
          <SheetDescription>
            We can turn these on so they show up on Today and in Reports. You can toggle any of them
            later in Settings → What I track.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-3">
          {defs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No extra trackers needed, the condition has been added to your profile.
            </p>
          ) : (
            defs.map((f) => (
              <label
                key={f.key}
                className="flex items-start gap-3 rounded-xl border border-border bg-background/40 p-3 cursor-pointer"
              >
                <Checkbox
                  checked={selected.has(f.key)}
                  onCheckedChange={() => toggle(f.key)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{f.label}</p>
                  <p className="text-xs text-muted-foreground">{f.description}</p>
                </div>
              </label>
            ))
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Skip
          </Button>
          <Button
            onClick={() => onConfirm(Array.from(selected) as FeatureKey[])}
            disabled={busy}
            className="rounded-full"
          >
            {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {defs.length === 0 ? "Done" : "Turn on"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
