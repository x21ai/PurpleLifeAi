import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { logAura } from "@/lib/auras.functions";
import { cn } from "@/lib/utils";
import { userMessage } from "@/lib/user-message";

const AURA_KINDS = [
  { value: "deja_vu", label: "Déjà vu" },
  { value: "jamais_vu", label: "Jamais vu" },
  { value: "epigastric", label: "Stomach rising" },
  { value: "visual", label: "Visual" },
  { value: "olfactory", label: "Smell" },
  { value: "emotional", label: "Sudden emotion" },
  { value: "other", label: "Other" },
] as const;

function nowLocal(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function LogAuraSheet({
  ownerId,
  trigger,
}: {
  ownerId?: string;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<typeof AURA_KINDS[number]["value"]>("deja_vu");
  const [when, setWhen] = useState(nowLocal());
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");

  const fn = useServerFn(logAura);
  const qc = useQueryClient();

  const m = useMutation({
    mutationFn: () =>
      fn({
        data: {
          user_id: ownerId,
          occurred_at: new Date(when).toISOString(),
          kind,
          duration_seconds: duration ? Number(duration) : null,
          notes: notes.trim() || null,
        },
      }),
    onSuccess: () => {
      toast.success("Aura logged");
      void qc.invalidateQueries({ queryKey: ["auras"] });
      setOpen(false);
      setKind("deja_vu");
      setWhen(nowLocal());
      setDuration("");
      setNotes("");
    },
    onError: (err: Error) => toast.error(userMessage(err, "That didn't work. Try again in a moment.")),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline" className="rounded-full">
            <Sparkles className="h-4 w-4 mr-1.5" /> Log déjà vu / aura
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Log an aura</DialogTitle>
          <DialogDescription>
            A warning sensation before a possible seizure, déjà vu, a rising
            feeling in the stomach, a smell, sudden emotion. Capture it the
            moment it happens.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Kind</Label>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {AURA_KINDS.map((k) => (
                <button
                  key={k.value}
                  type="button"
                  onClick={() => setKind(k.value)}
                  className={cn(
                    "px-3 h-8 rounded-full text-xs ring-1 transition",
                    kind === k.value
                      ? "bg-[color:var(--purple-primary)]/15 text-[color:var(--purple-primary)] ring-[color:var(--purple-primary)]"
                      : "ring-border hover:ring-foreground/30",
                  )}
                >
                  {k.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="aw">When</Label>
              <Input id="aw" type="datetime-local" value={when}
                onChange={(e) => setWhen(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="ad">Duration (sec)</Label>
              <Input id="ad" type="number" min={0} max={3600} value={duration}
                onChange={(e) => setDuration(e.target.value)} placeholder="optional" />
            </div>
          </div>
          <div>
            <Label htmlFor="an">Notes</Label>
            <Textarea id="an" value={notes} maxLength={500} rows={3}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did it feel like? What were you doing?" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={m.isPending}>Cancel</Button>
          <Button onClick={() => m.mutate()} disabled={m.isPending || !when}>
            {m.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}