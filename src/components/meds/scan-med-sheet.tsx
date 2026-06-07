import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { Camera, Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { scanMedicationFromPhoto } from "@/lib/med-recognition.functions";
import type { MedPrefill } from "./medication-form-sheet";

async function fileToDataUrl(file: File, maxSide = 1280): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.88);
}

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
  warnings?: string[];
};

export function ScanMedSheet({
  open,
  onOpenChange,
  onRecognized,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onRecognized: (prefill: MedPrefill) => void;
}) {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [stage, setStage] = React.useState<"pick" | "analyzing" | "review">("pick");
  const [preview, setPreview] = React.useState<string | null>(null);
  const [recog, setRecog] = React.useState<Recog | null>(null);

  const scan = useServerFn(scanMedicationFromPhoto);

  React.useEffect(() => {
    if (!open) {
      setStage("pick");
      setPreview(null);
      setRecog(null);
    }
  }, [open]);

  async function onFile(file: File) {
    const dataUrl = await fileToDataUrl(file);
    setPreview(dataUrl);
    setStage("analyzing");
    try {
      const r = (await scan({ data: { image_data_url: dataUrl } })) as Recog;
      setRecog(r);
      setStage("review");
    } catch (e: any) {
      toast.error(e?.message || "Couldn't read the label.");
      setStage("pick");
      setPreview(null);
    }
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
          <SheetTitle className="font-serif text-2xl">Scan medication</SheetTitle>
          <SheetDescription>
            Take a photo of the label, bottle, or prescription. We&rsquo;ll suggest the details — you review and save in the next step.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-4">
          {stage === "pick" && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void onFile(f);
                }}
              />
              <Button onClick={() => fileRef.current?.click()} className="w-full h-12 rounded-2xl">
                <Camera className="h-5 w-5 mr-2" /> Take or choose a photo
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                AI estimate — always review every field before saving.
              </p>
            </>
          )}

          {stage === "analyzing" && (
            <div className="flex flex-col items-center gap-3 py-8">
              {preview && <img src={preview} alt="" className="max-h-56 rounded-2xl ring-1 ring-border" />}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Reading label…
              </div>
            </div>
          )}

          {stage === "review" && recog && (
            <>
              <div className="flex gap-3">
                {preview && <img src={preview} alt="" className="h-24 w-24 rounded-xl object-cover ring-1 ring-border" />}
                <div className="flex-1 min-w-0">
                  <div className="text-xs label-eyebrow text-muted-foreground">Detected</div>
                  <div className="text-sm font-medium">{recog.name ?? recog.generic_name ?? "Couldn’t read name"}</div>
                  <div className="text-xs text-muted-foreground">
                    Confidence {Math.round(recog.confidence * 100)}%
                  </div>
                </div>
              </div>

              <dl className="rounded-2xl ring-1 ring-border bg-card divide-y divide-border/60 text-sm">
                <Row label="Strength" value={recog.dosage_amount != null ? `${recog.dosage_amount} ${recog.dosage_unit ?? ""}`.trim() : null} />
                <Row label="Form" value={recog.dosage_form ?? null} />
                <Row label="Instructions" value={recog.instructions ?? null} />
                <Row label="Times per day" value={recog.times_per_day != null ? String(recog.times_per_day) : null} />
                <Row label="With food" value={recog.with_food == null ? null : recog.with_food ? "Yes" : "No"} />
                <Row label="Prescriber" value={recog.prescriber_name ?? null} />
                <Row label="Pharmacy" value={recog.pharmacy_name ?? null} />
                <Row label="Rx number" value={recog.prescription_number ?? null} />
              </dl>

              {recog.warnings && recog.warnings.length > 0 && (
                <ul className="rounded-xl ring-1 ring-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-300 space-y-1">
                  {recog.warnings.map((w, i) => <li key={i}>• {w}</li>)}
                </ul>
              )}

              <p className="text-[11px] text-muted-foreground">
                Nothing is saved yet. The next screen lets you edit every field before adding it.
              </p>

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button variant="ghost" onClick={() => { setStage("pick"); setPreview(null); setRecog(null); }}>
                  <X className="h-4 w-4 mr-1" /> Retake
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
      <div className={value ? "text-sm" : "text-sm text-muted-foreground italic"}>{value ?? "—"}</div>
    </div>
  );
}