import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Mic, Sparkles, Square, X } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useVoiceCapture } from "@/components/journal/use-voice-capture";
import { scanMedicationFromText } from "@/lib/med-recognition.functions";
import type { MedPrefill } from "./medication-form-sheet";
import { userMessage } from "@/lib/user-message";

type Recog = {
  name?: string | null;
  generic_name?: string | null;
  dosage_amount?: number | null;
  dosage_unit?: string | null;
  dosage_form?: string | null;
  instructions?: string | null;
  times_per_day?: number | null;
  with_food?: boolean | null;
  prescriber_name?: string | null;
  pharmacy_name?: string | null;
  prescription_number?: string | null;
  pills_remaining?: number | null;
  confidence: number;
};

export function VoiceMedSheet({
  open, onOpenChange, onRecognized,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onRecognized: (prefill: MedPrefill) => void;
}) {
  const voice = useVoiceCapture();
  const [stage, setStage] = React.useState<"record" | "analyzing" | "review">("record");
  const [recog, setRecog] = React.useState<Recog | null>(null);
  const [text, setText] = React.useState("");
  const recognize = useServerFn(scanMedicationFromText);

  React.useEffect(() => {
    if (!open) {
      setStage("record");
      setRecog(null);
      setText("");
      voice.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function analyze(t: string) {
    setStage("analyzing");
    try {
      const r = (await recognize({ data: { text: t } })) as Recog;
      setRecog(r);
      setStage("review");
    } catch (e: any) {
      toast.error(userMessage(e, "Couldn't understand the note."));
      setStage("record");
    }
  }

  async function handleStop() {
    await voice.stop();
    const t = (voice.transcript || text).trim();
    if (t.length < 3) { toast.error("Didn't catch that."); return; }
    setText(t);
    await analyze(t);
  }

  function handleUse() {
    if (!recog) return;
    onRecognized({
      name: recog.name ?? recog.generic_name ?? null,
      dosage_amount: recog.dosage_amount ?? null,
      dosage_unit: recog.dosage_unit ?? null,
      dosage_form: recog.dosage_form ?? null,
      with_food: recog.with_food ?? null,
      times_per_day: recog.times_per_day ?? null,
      prescriber_name: recog.prescriber_name ?? null,
      pharmacy_name: recog.pharmacy_name ?? null,
      prescription_number: recog.prescription_number ?? null,
      pills_remaining: recog.pills_remaining ?? null,
    });
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-serif text-2xl">Voice add medication</SheetTitle>
          <SheetDescription>
            Say the name and dose, e.g. "Levetiracetam 500 milligrams, twice a day with food".
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-4">
          {stage === "record" && (
            <>
              <div className="flex flex-col items-center gap-3 py-4">
                <Button
                  onClick={() => (voice.listening ? handleStop() : voice.start())}
                  className="h-16 w-16 rounded-full p-0"
                  variant={voice.listening ? "destructive" : "default"}
                >
                  {voice.listening ? <Square className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </Button>
                <p className="text-xs text-muted-foreground">
                  {voice.listening ? "Listening… tap to stop" : voice.supported ? "Tap to start" : "Voice not supported, type below"}
                </p>
              </div>
              <Textarea
                placeholder="…or type it"
                value={voice.listening ? voice.transcript : text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                disabled={voice.listening}
              />
              <div className="flex justify-end">
                <Button onClick={() => analyze((text || voice.transcript).trim())} disabled={(text || voice.transcript).trim().length < 3}>
                  <Sparkles className="h-4 w-4 mr-1.5" /> Analyze
                </Button>
              </div>
            </>
          )}

          {stage === "analyzing" && (
            <div className="flex flex-col items-center gap-3 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Analyzing…
            </div>
          )}

          {stage === "review" && recog && (
            <>
              <div className="rounded-2xl ring-1 ring-border bg-card p-3">
                <div className="text-xs label-eyebrow text-muted-foreground">Detected</div>
                <div className="text-sm font-medium">{recog.name ?? recog.generic_name ?? "Couldn't read name"}</div>
                <div className="text-xs text-muted-foreground">Confidence {Math.round(recog.confidence * 100)}%</div>
              </div>
              <dl className="rounded-2xl ring-1 ring-border bg-card divide-y divide-border/60 text-sm">
                <Row label="Strength" value={recog.dosage_amount != null ? `${recog.dosage_amount} ${recog.dosage_unit ?? ""}`.trim() : null} />
                <Row label="Form" value={recog.dosage_form ?? null} />
                <Row label="Instructions" value={recog.instructions ?? null} />
                <Row label="Times per day" value={recog.times_per_day != null ? String(recog.times_per_day) : null} />
                <Row label="With food" value={recog.with_food == null ? null : recog.with_food ? "Yes" : "No"} />
              </dl>
              <p className="text-[11px] text-muted-foreground">Nothing is saved yet. Review every field on the next screen.</p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button variant="ghost" onClick={() => { setStage("record"); setRecog(null); voice.reset(); setText(""); }}>
                  <X className="h-4 w-4 mr-1" /> Try again
                </Button>
                <Button onClick={handleUse}>
                  <Sparkles className="h-4 w-4 mr-1.5" /> Review &amp; save
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-start gap-3 px-3 py-2.5">
      <div className="w-32 shrink-0 text-xs text-muted-foreground">{label}</div>
      <div className={value ? "text-sm" : "text-sm text-muted-foreground italic"}>{value ?? "–"}</div>
    </div>
  );
}