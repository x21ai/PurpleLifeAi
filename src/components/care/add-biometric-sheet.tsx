import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmCareWriteButton } from "@/components/care/confirm-care-write";
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
import { caregiverAddBiometric } from "@/lib/care.functions";

function nowLocal(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function numOrNull(s: string): number | null {
  if (!s.trim()) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function AddBiometricSheet({
  ownerId,
  ownerName,
}: {
  ownerId: string;
  ownerName: string;
}) {
  const [open, setOpen] = useState(false);
  const [recordedAt, setRecordedAt] = useState(nowLocal());
  const [hr, setHr] = useState("");
  const [restingHr, setRestingHr] = useState("");
  const [spo2, setSpo2] = useState("");
  const [skinTemp, setSkinTemp] = useState("");
  const [steps, setSteps] = useState("");
  const [notes, setNotes] = useState("");

  const fn = useServerFn(caregiverAddBiometric);
  const qc = useQueryClient();

  const m = useMutation({
    mutationFn: () =>
      fn({
        data: {
          owner_id: ownerId,
          recorded_at: new Date(recordedAt).toISOString(),
          hr_bpm: numOrNull(hr),
          resting_hr_bpm: numOrNull(restingHr),
          spo2_pct: numOrNull(spo2),
          skin_temp_c: numOrNull(skinTemp),
          steps: numOrNull(steps),
          notes: notes.trim() || null,
        },
      }),
    onSuccess: () => {
      toast.success("Biometric saved");
      void qc.invalidateQueries({ queryKey: ["care", "biometrics", ownerId] });
      setOpen(false);
      setHr("");
      setRestingHr("");
      setSpo2("");
      setSkinTemp("");
      setSteps("");
      setNotes("");
      setRecordedAt(nowLocal());
    },
    onError: (err: any) => toast.error(err?.message ?? "Couldn't save biometric"),
  });

  const empty =
    !hr && !restingHr && !spo2 && !skinTemp && !steps && !notes.trim();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-full">
          <Plus className="h-4 w-4 mr-1" /> Add reading
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Add a biometric reading</DialogTitle>
          <DialogDescription>
            Saved on {ownerName}'s account, tagged as added by you. Leave fields blank if you don't have them.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="when">When</Label>
            <Input
              id="when"
              type="datetime-local"
              value={recordedAt}
              onChange={(e) => setRecordedAt(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="hr">Heart rate (bpm)</Label>
              <Input id="hr" type="number" min={0} max={400} value={hr} onChange={(e) => setHr(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="rhr">Resting HR (bpm)</Label>
              <Input id="rhr" type="number" min={0} max={400} value={restingHr} onChange={(e) => setRestingHr(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="spo2">SpO₂ (%)</Label>
              <Input id="spo2" type="number" min={0} max={100} value={spo2} onChange={(e) => setSpo2(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="temp">Skin temp (°C)</Label>
              <Input id="temp" type="number" step="0.1" min={20} max={45} value={skinTemp} onChange={(e) => setSkinTemp(e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label htmlFor="steps">Steps</Label>
              <Input id="steps" type="number" min={0} max={200000} value={steps} onChange={(e) => setSteps(e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="bnotes">Notes</Label>
            <Textarea id="bnotes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={500} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={m.isPending}>
            Cancel
          </Button>
          <ConfirmCareWriteButton
            ownerName={ownerName}
            summary="Add a biometric reading to their record"
            onConfirm={() => m.mutate()}
            pending={m.isPending}
            disabled={empty || !recordedAt}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}