import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { caregiverLogSeizure } from "@/lib/care.functions";

function nowLocal(): string {
  // ISO local without seconds for <input type="datetime-local">
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function LogSeizureSheet({
  ownerId,
  ownerName,
}: {
  ownerId: string;
  ownerName: string;
}) {
  const [open, setOpen] = useState(false);
  const [startedAt, setStartedAt] = useState<string>(nowLocal());
  const [endedAt, setEndedAt] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [severity, setSeverity] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [rescueMed, setRescueMed] = useState(false);
  const [injury, setInjury] = useState(false);

  const fn = useServerFn(caregiverLogSeizure);
  const qc = useQueryClient();

  const m = useMutation({
    mutationFn: () =>
      fn({
        data: {
          owner_id: ownerId,
          started_at: new Date(startedAt).toISOString(),
          ended_at: endedAt ? new Date(endedAt).toISOString() : null,
          type: type.trim() || null,
          severity: severity.trim() ? Number(severity) : null,
          notes: notes.trim() || null,
          rescue_med_given: rescueMed,
          injury,
        },
      }),
    onSuccess: () => {
      toast.success("Seizure logged");
      void qc.invalidateQueries({ queryKey: ["care", "seizures", ownerId] });
      setOpen(false);
      setEndedAt("");
      setType("");
      setSeverity("");
      setNotes("");
      setRescueMed(false);
      setInjury(false);
      setStartedAt(nowLocal());
    },
    onError: (err: any) => toast.error(err?.message ?? "Couldn't log seizure"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-full">
          <Plus className="h-4 w-4 mr-1" /> Log seizure
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Log a seizure</DialogTitle>
          <DialogDescription>
            This will be saved on {ownerName}'s account and tagged as logged by you.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="started">Started</Label>
              <Input
                id="started"
                type="datetime-local"
                value={startedAt}
                onChange={(e) => setStartedAt(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="ended">Ended (optional)</Label>
              <Input
                id="ended"
                type="datetime-local"
                value={endedAt}
                onChange={(e) => setEndedAt(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="type">Type</Label>
              <Input
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="e.g. focal, tonic-clonic"
                maxLength={64}
              />
            </div>
            <div>
              <Label htmlFor="severity">Severity (0–10)</Label>
              <Input
                id="severity"
                type="number"
                min={0}
                max={10}
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="What did you observe?"
            />
          </div>
          <div className="flex items-center gap-6 pt-1">
            <label className="inline-flex items-center gap-2 text-sm">
              <Checkbox
                checked={rescueMed}
                onCheckedChange={(v) => setRescueMed(v === true)}
              />
              Rescue med given
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <Checkbox
                checked={injury}
                onCheckedChange={(v) => setInjury(v === true)}
              />
              Injury
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={m.isPending}>
            Cancel
          </Button>
          <Button onClick={() => m.mutate()} disabled={m.isPending || !startedAt}>
            {m.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}