import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Mic, Sparkles, Square, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetColumn,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/integrations/supabase/auth-context";
import { useVoiceCapture } from "@/components/journal/use-voice-capture";
import { recognizeIntakeFromText, createFoodEntry } from "@/lib/food.functions";
import { logHydration } from "@/lib/hydration.functions";
import { userMessage } from "@/lib/user-message";

type Item = { name: string; portion: string; calories_kcal: string; volume_ml: string };
type Recog = Awaited<ReturnType<(typeof import("@/lib/food.server"))["recognizeFromText"]>>;

export function VoiceIntakeSheet() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const qc = useQueryClient();
  const voice = useVoiceCapture();

  const [open, setOpen] = React.useState(false);
  const [stage, setStage] = React.useState<"record" | "analyzing" | "confirm">("record");
  const [recog, setRecog] = React.useState<Recog | null>(null);
  const [items, setItems] = React.useState<Item[]>([]);
  const [note, setNote] = React.useState("");
  const [text, setText] = React.useState("");

  const recognize = useServerFn(recognizeIntakeFromText);
  const createFood = useServerFn(createFoodEntry);
  const logH = useServerFn(logHydration);

  function reset() {
    setStage("record");
    setRecog(null);
    setItems([]);
    setNote("");
    setText("");
    voice.reset();
  }

  async function analyze(t: string) {
    setStage("analyzing");
    try {
      const r = (await recognize({ data: { text: t } })) as Recog;
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
      toast.error(userMessage(e, "Couldn't understand the note."));
      setStage("record");
    }
  }

  async function handleStop() {
    await voice.stop();
    const t = (voice.transcript || text).trim();
    if (t.length < 3) {
      toast.error("Didn't catch that. Try again or type it.");
      return;
    }
    setText(t);
    await analyze(t);
  }

  const save = useMutation({
    mutationFn: async () => {
      if (!userId || !recog) throw new Error("Not signed in");
      const now = new Date().toISOString();
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
          if (it.calories_kcal) {
            await createFood({
              data: {
                consumed_at: now,
                name,
                portion: it.portion || null,
                calories_kcal: Number(it.calories_kcal) || null,
                source: "voice",
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
              source: "voice",
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
          <Mic className="h-4 w-4 mr-1.5" /> Voice
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[92dvh] overflow-y-auto">
        <SheetColumn>
          <SheetHeader>
            <SheetTitle className="font-serif text-2xl">Voice intake</SheetTitle>
            <SheetDescription>
              Say what you had, e.g. "a large oat-milk latte and a banana". We'll extract the
              details for you to confirm.
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
                    {voice.listening
                      ? "Listening… tap to stop"
                      : voice.supported
                        ? "Tap to start"
                        : "Voice not supported, type below"}
                  </p>
                </div>
                <Textarea
                  placeholder="…or type what you had"
                  value={voice.listening ? voice.transcript : text}
                  onChange={(e) => setText(e.target.value)}
                  rows={3}
                  disabled={voice.listening}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={() => analyze((text || voice.transcript).trim())}
                    disabled={(text || voice.transcript).trim().length < 3}
                  >
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

            {stage === "confirm" && recog && (
              <>
                <div className="rounded-2xl ring-1 ring-border bg-card p-3">
                  <div className="text-xs label-eyebrow text-muted-foreground">Detected</div>
                  <div className="text-sm font-medium capitalize">{recog.kind}</div>
                  <div className="text-xs text-muted-foreground">
                    Confidence {Math.round(recog.confidence * 100)}%, please review.
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
                              arr.map((x, i) =>
                                i === idx ? { ...x, portion: e.target.value } : x,
                              ),
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
                  <Label htmlFor="vnote" className="text-xs">
                    Note (optional)
                  </Label>
                  <Textarea
                    id="vnote"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
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
                  AI estimates can be wrong. Edit before saving.
                </p>
              </>
            )}
          </div>
        </SheetColumn>
      </SheetContent>
    </Sheet>
  );
}
