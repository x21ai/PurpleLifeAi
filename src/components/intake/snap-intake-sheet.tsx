import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Camera, Loader2, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { recognizeIntakeFromPhoto, createFoodEntry } from "@/lib/food.functions";
import { logHydration } from "@/lib/hydration.functions";
import { cn } from "@/lib/utils";
import { userMessage } from "@/lib/user-message";

type Item = {
  name: string;
  portion: string;
  calories_kcal: string;
  volume_ml: string;
};

type Recog = {
  kind: "water" | "drink" | "food" | "unknown";
  items: Array<{
    name: string;
    portion?: string | null;
    calories_kcal?: number | null;
    protein_g?: number | null;
    carbs_g?: number | null;
    fat_g?: number | null;
    volume_ml?: number | null;
  }>;
  confidence: number;
  notes?: string | null;
};

async function fileToDataUrl(file: File, maxSide = 1280): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.85);
}

export function SnapIntakeSheet() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<"pick" | "analyzing" | "confirm">("pick");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [recog, setRecog] = useState<Recog | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [note, setNote] = useState("");

  const recognize = useServerFn(recognizeIntakeFromPhoto);
  const createFood = useServerFn(createFoodEntry);
  const logH = useServerFn(logHydration);

  function reset() {
    setStage("pick");
    setPreview(null);
    setFile(null);
    setRecog(null);
    setItems([]);
    setNote("");
  }

  async function onFile(f: File) {
    setFile(f);
    const dataUrl = await fileToDataUrl(f);
    setPreview(dataUrl);
    setStage("analyzing");
    try {
      const r = (await recognize({ data: { image_data_url: dataUrl } })) as Recog;
      setRecog(r);
      setItems(
        r.items.length
          ? r.items.map((it) => ({
              name: it.name,
              portion: it.portion ?? "",
              calories_kcal: it.calories_kcal != null ? String(Math.round(it.calories_kcal)) : "",
              volume_ml: it.volume_ml != null ? String(Math.round(it.volume_ml)) : "",
            }))
          : [{ name: "", portion: "", calories_kcal: "", volume_ml: "" }],
      );
      setStage("confirm");
    } catch (e: any) {
      toast.error(userMessage(e, "Couldn't analyze the photo."));
      reset();
    }
  }

  const save = useMutation({
    mutationFn: async () => {
      if (!userId || !recog) throw new Error("Not signed in");
      const now = new Date().toISOString();

      // Upload photo (private bucket)
      let photoPath: string | null = null;
      if (file) {
        const ts = Date.now();
        const path = `${userId}/food/${ts}-${crypto.randomUUID()}.jpg`;
        const { error } = await supabase.storage
          .from("journal-media")
          .upload(path, file, { contentType: file.type || "image/jpeg", upsert: false });
        if (error) throw error;
        photoPath = path;
      }

      const isDrink = recog.kind === "water" || recog.kind === "drink";

      for (const it of items) {
        const name = it.name.trim();
        if (!name) continue;

        if (recog.kind === "water" && it.volume_ml) {
          await logH({
            data: {
              consumed_at: now,
              kind: "water",
              volume_ml: Math.max(1, Math.round(Number(it.volume_ml) || 250)),
              notes: note || null,
            },
          });
        } else if (isDrink && it.volume_ml) {
          await logH({
            data: {
              consumed_at: now,
              kind: "other",
              volume_ml: Math.max(1, Math.round(Number(it.volume_ml) || 250)),
              notes: [name, note].filter(Boolean).join(" · ") || null,
            },
          });
          // Also log as food entry so kcal stays tracked
          if (it.calories_kcal) {
            await createFood({
              data: {
                consumed_at: now,
                name,
                portion: it.portion || null,
                calories_kcal: Number(it.calories_kcal) || null,
                photo_path: photoPath,
                source: "photo",
                ai_confidence: recog.confidence,
                note: note || null,
              },
            });
          }
        } else {
          await createFood({
            data: {
              consumed_at: now,
              name,
              portion: it.portion || null,
              calories_kcal: it.calories_kcal ? Number(it.calories_kcal) : null,
              photo_path: photoPath,
              source: "photo",
              ai_confidence: recog.confidence,
              note: note || null,
            },
          });
        }
      }
    },
    onSuccess: () => {
      toast.success("Logged");
      void qc.invalidateQueries({ queryKey: ["hydration"] });
      void qc.invalidateQueries({ queryKey: ["food"] });
      setOpen(false);
      reset();
    },
    onError: (e: Error) => toast.error(userMessage(e, "That didn't work. Try again in a moment.")),
  });

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <SheetTrigger asChild>
        <Button size="sm" variant="outline" className="rounded-full">
          <Camera className="h-4 w-4 mr-1.5" /> Snap food or drink
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-serif text-2xl">Snap intake</SheetTitle>
          <SheetDescription>
            Take a photo of your food, drink, or water. We'll suggest the details, you review before
            saving.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-4">
          {stage === "pick" && (
            <>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void onFile(f);
                }}
              />
              <Button onClick={() => inputRef.current?.click()} className="w-full h-12 rounded-2xl">
                <Camera className="h-5 w-5 mr-2" /> Take or choose a photo
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                AI estimate, please confirm everything before saving.
              </p>
            </>
          )}

          {stage === "analyzing" && (
            <div className="flex flex-col items-center gap-3 py-8">
              {preview && (
                <img src={preview} alt="" className="max-h-56 rounded-2xl ring-1 ring-border" />
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Analyzing…
              </div>
            </div>
          )}

          {stage === "confirm" && recog && (
            <>
              <div className="flex gap-3">
                {preview && (
                  <img
                    src={preview}
                    alt=""
                    className="h-24 w-24 rounded-xl object-cover ring-1 ring-border"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs label-eyebrow text-muted-foreground">Detected</div>
                  <div className="text-sm font-medium capitalize">{recog.kind}</div>
                  <div className="text-xs text-muted-foreground">
                    Confidence {Math.round(recog.confidence * 100)}%, please review.
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {items.map((it, idx) => (
                  <div key={idx} className="rounded-2xl ring-1 ring-border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">Item {idx + 1}</Label>
                      {items.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setItems((arr) => arr.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <Input
                      placeholder="Name"
                      value={it.name}
                      onChange={(e) =>
                        setItems((arr) =>
                          arr.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)),
                        )
                      }
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        placeholder="Portion"
                        value={it.portion}
                        onChange={(e) =>
                          setItems((arr) =>
                            arr.map((x, i) => (i === idx ? { ...x, portion: e.target.value } : x)),
                          )
                        }
                      />
                      <Input
                        placeholder="kcal"
                        inputMode="numeric"
                        value={it.calories_kcal}
                        onChange={(e) =>
                          setItems((arr) =>
                            arr.map((x, i) =>
                              i === idx
                                ? { ...x, calories_kcal: e.target.value.replace(/[^0-9]/g, "") }
                                : x,
                            ),
                          )
                        }
                      />
                      <Input
                        placeholder="ml"
                        inputMode="numeric"
                        value={it.volume_ml}
                        onChange={(e) =>
                          setItems((arr) =>
                            arr.map((x, i) =>
                              i === idx
                                ? { ...x, volume_ml: e.target.value.replace(/[^0-9]/g, "") }
                                : x,
                            ),
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setItems((arr) => [
                      ...arr,
                      { name: "", portion: "", calories_kcal: "", volume_ml: "" },
                    ])
                  }
                >
                  + Add item
                </Button>
              </div>

              <div>
                <Label htmlFor="note" className="text-xs">
                  Note (optional)
                </Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                />
              </div>

              <div className={cn("flex items-center justify-end gap-2 pt-2")}>
                <Button variant="ghost" onClick={reset}>
                  <X className="h-4 w-4 mr-1" /> Discard
                </Button>
                <Button onClick={() => save.mutate()} disabled={save.isPending}>
                  {save.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-1.5" /> Save
                    </>
                  )}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                AI estimates can be wrong. Edit fields before saving.
              </p>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
