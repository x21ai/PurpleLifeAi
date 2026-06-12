import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Droplets, FlaskConical, Loader2, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { logHydration } from "@/lib/hydration.functions";
import { ELECTROLYTE_PRESETS } from "./electrolyte-presets";
import { cn } from "@/lib/utils";
import { userMessage } from "@/lib/user-message";

type Props = { ownerId?: string; onLogged?: () => void; compact?: boolean };

const QUICK_AMOUNTS = [200, 250, 330, 500, 750];

export function QuickAddWater({ ownerId, onLogged, compact }: Props) {
  const fn = useServerFn(logHydration);
  const qc = useQueryClient();

  const [open, setOpen] = useState<"water" | "electrolyte" | null>(null);
  const [volume, setVolume] = useState<number>(250);
  const [brand, setBrand] = useState<string>(ELECTROLYTE_PRESETS[0].brand);
  const [sodium, setSodium] = useState<number>(ELECTROLYTE_PRESETS[0].sodium_mg);

  const m = useMutation({
    mutationFn: (args: {
      kind: "water" | "electrolyte";
      volume_ml: number;
      electrolyte_brand?: string | null;
      sodium_mg?: number | null;
    }) =>
      fn({
        data: {
          user_id: ownerId,
          consumed_at: new Date().toISOString(),
          volume_ml: args.volume_ml,
          kind: args.kind,
          electrolyte_brand: args.electrolyte_brand ?? null,
          sodium_mg: args.sodium_mg ?? null,
        },
      }),
    onSuccess: (_d, vars) => {
      toast.success(
        vars.kind === "water"
          ? `Logged ${vars.volume_ml} ml water`
          : `Logged ${vars.volume_ml} ml ${vars.electrolyte_brand ?? "electrolyte"}`,
      );
      void qc.invalidateQueries({ queryKey: ["hydration"] });
      setOpen(null);
      onLogged?.();
    },
    onError: (err: Error) => toast.error(userMessage(err, "That didn't work. Try again in a moment.")),
  });

  const onPresetChange = (b: string) => {
    const p = ELECTROLYTE_PRESETS.find((x) => x.brand === b);
    setBrand(b);
    if (p) {
      setSodium(p.sodium_mg);
      setVolume(p.default_volume_ml);
    }
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", compact && "gap-1.5")}>
      <Button
        size="sm"
        variant="secondary"
        className="rounded-full"
        onClick={() => m.mutate({ kind: "water", volume_ml: 250 })}
        disabled={m.isPending}
      >
        <Droplets className="h-4 w-4 mr-1.5" /> 250 ml
      </Button>
      <Button
        size="sm"
        variant="secondary"
        className="rounded-full"
        onClick={() => m.mutate({ kind: "water", volume_ml: 500 })}
        disabled={m.isPending}
      >
        <Droplets className="h-4 w-4 mr-1.5" /> 500 ml
      </Button>

      {/* Custom water */}
      <Dialog open={open === "water"} onOpenChange={(v) => setOpen(v ? "water" : null)}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" className="rounded-full">
            <Plus className="h-4 w-4 mr-1" /> Water
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Add water</DialogTitle>
            <DialogDescription>Logged at the current time.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {QUICK_AMOUNTS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVolume(v)}
                  className={cn(
                    "px-3 h-9 rounded-full text-sm ring-1 transition",
                    volume === v
                      ? "bg-[color:var(--purple-primary)]/15 text-[color:var(--purple-primary)] ring-[color:var(--purple-primary)]"
                      : "ring-border hover:ring-foreground/30",
                  )}
                >
                  {v} ml
                </button>
              ))}
            </div>
            <div>
              <Label htmlFor="vol">Custom (ml)</Label>
              <Input
                id="vol"
                type="number"
                min={1}
                max={5000}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value) || 0)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(null)}>Cancel</Button>
            <Button
              onClick={() => m.mutate({ kind: "water", volume_ml: volume })}
              disabled={m.isPending || volume <= 0}
            >
              {m.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Electrolyte */}
      <Dialog open={open === "electrolyte"} onOpenChange={(v) => setOpen(v ? "electrolyte" : null)}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" className="rounded-full">
            <FlaskConical className="h-4 w-4 mr-1" /> Electrolytes
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Add electrolytes</DialogTitle>
            <DialogDescription>Sodium is auto-filled from the brand. Override if needed.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Brand</Label>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {ELECTROLYTE_PRESETS.map((p) => (
                  <button
                    key={p.brand}
                    type="button"
                    onClick={() => onPresetChange(p.brand)}
                    className={cn(
                      "px-3 h-8 rounded-full text-xs ring-1 transition",
                      brand === p.brand
                        ? "bg-[color:var(--purple-primary)]/15 text-[color:var(--purple-primary)] ring-[color:var(--purple-primary)]"
                        : "ring-border hover:ring-foreground/30",
                    )}
                  >
                    {p.brand}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="ev">Volume (ml)</Label>
                <Input id="ev" type="number" min={1} max={5000} value={volume}
                  onChange={(e) => setVolume(Number(e.target.value) || 0)} />
              </div>
              <div>
                <Label htmlFor="es">Sodium (mg)</Label>
                <Input id="es" type="number" min={0} max={10000} value={sodium}
                  onChange={(e) => setSodium(Number(e.target.value) || 0)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(null)}>Cancel</Button>
            <Button
              onClick={() =>
                m.mutate({
                  kind: "electrolyte",
                  volume_ml: volume,
                  electrolyte_brand: brand,
                  sodium_mg: sodium,
                })
              }
              disabled={m.isPending || volume <= 0}
            >
              {m.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <><Sparkles className="h-4 w-4 mr-1.5" /> Add</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}