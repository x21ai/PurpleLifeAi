import * as React from "react";
import { Camera, Image as ImageIcon, Video, Mic, X, Loader2, Zap } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Sheet, SheetContent, SheetColumn, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { queueEntry } from "@/lib/offline-journal-queue";
import { toast } from "sonner";
import { useVoiceCapture } from "./use-voice-capture";
import { promptsForConditions } from "@/lib/condition-prompts";
import { userMessage } from "@/lib/user-message";

type Attachment = {
  id: string;
  file: File;
  previewUrl: string;
  kind: "photo" | "video";
};

const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB
const MAX_VIDEO_SECONDS = 60;

async function checkVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(v.duration || 0);
    };
    v.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
    v.src = url;
  });
}

function extOf(file: File): string {
  const fromName = file.name.split(".").pop();
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  const m = file.type.split("/")[1];
  return (m || "bin").toLowerCase();
}

function inferKind(text: string, voice: string, atts: Attachment[]): string {
  const hasMedia = atts.length > 0;
  const hasPhoto = atts.some((a) => a.kind === "photo");
  const hasVideo = atts.some((a) => a.kind === "video");
  const hasText = text.trim().length > 0;
  const hasVoice = voice.trim().length > 0;
  const types = [hasText, hasVoice, hasMedia].filter(Boolean).length;
  if (types > 1) return "mixed";
  if (hasVoice) return "voice";
  if (hasVideo) return "video";
  if (hasPhoto) return "photo";
  return "text";
}

export function CaptureSheet({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: () => void;
}) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [text, setText] = React.useState("");
  const [attachments, setAttachments] = React.useState<Attachment[]>([]);
  const [saving, setSaving] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const photoInput = React.useRef<HTMLInputElement | null>(null);
  const galleryInput = React.useRef<HTMLInputElement | null>(null);
  const videoInput = React.useRef<HTMLInputElement | null>(null);
  const voice = useVoiceCapture();
  const [conditions, setConditions] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (!userId) return;
    void supabase
      .from("profiles")
      .select("conditions")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        setConditions((data?.conditions as string[] | null) ?? []);
      });
  }, [userId]);

  const placeholder = React.useMemo(() => {
    const list = promptsForConditions(conditions);
    if (list.length === 0) return "What is happening, or what just happened?";
    const day = Math.floor(Date.now() / 86_400_000);
    return list[day % list.length];
  }, [conditions]);

  const promptChips = React.useMemo(() => {
    const list = promptsForConditions(conditions);
    // Rotate daily so the same 3 don't appear forever, but keep tailoring light.
    const day = Math.floor(Date.now() / 86_400_000);
    if (list.length <= 3) return list;
    const start = day % list.length;
    return [0, 1, 2].map((i) => list[(start + i) % list.length]);
  }, [conditions]);

  const insertPrompt = (prompt: string) => {
    setText((prev) => {
      const scaffold = `${prompt}\n`;
      if (!prev.trim()) return scaffold;
      if (prev.includes(prompt)) return prev;
      return prev.trimEnd() + "\n\n" + scaffold;
    });
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  React.useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    } else {
      // Reset on close
      setText("");
      attachments.forEach((a) => URL.revokeObjectURL(a.previewUrl));
      setAttachments([]);
      void voice.stop();
      voice.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const addFiles = async (files: FileList | null, kind: "photo" | "video") => {
    if (!files || files.length === 0) return;
    const next: Attachment[] = [];
    for (const f of Array.from(files)) {
      if (kind === "video") {
        if (f.size > MAX_VIDEO_BYTES) {
          toast.error(`Video too large, keep under 50 MB (${f.name})`);
          continue;
        }
        const dur = await checkVideoDuration(f);
        if (dur > MAX_VIDEO_SECONDS + 0.5) {
          toast.error(`Video too long, keep under 60s (${Math.round(dur)}s)`);
          continue;
        }
      }
      next.push({
        id: crypto.randomUUID(),
        file: f,
        previewUrl: URL.createObjectURL(f),
        kind,
      });
    }
    if (next.length === 0) return;
    setAttachments((prev) => [...prev, ...next]);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const found = prev.find((a) => a.id === id);
      if (found) URL.revokeObjectURL(found.previewUrl);
      return prev.filter((a) => a.id !== id);
    });
  };

  const toggleVoice = async () => {
    if (voice.listening) {
      await voice.stop();
      if (voice.transcript.trim()) {
        setText((prev) => (prev ? prev.trim() + "\n\n" + voice.transcript : voice.transcript));
      }
    } else {
      await voice.start();
    }
  };

  const hasContent =
    text.trim().length > 0 ||
    attachments.length > 0 ||
    voice.transcript.trim().length > 0 ||
    !!voice.audioBlob;

  const handleSave = async () => {
    if (!userId || !hasContent || saving) return;
    setSaving(true);
    // Make sure voice is stopped so audioBlob settles
    if (voice.listening) await voice.stop();
    // Allow MediaRecorder onstop to fire
    await new Promise((r) => setTimeout(r, 80));

    try {
      const liveTranscript = voice.transcript.trim();
      const finalText = text.trim();
      const kind = inferKind(finalText, liveTranscript, attachments);

      // Offline fallback, text/voice-transcript only (no media uploads).
      const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
      const hasMedia = attachments.length > 0 || !!voice.audioBlob;
      if (isOffline && !hasMedia) {
        queueEntry({
          userId,
          kind,
          text: finalText || null,
          voiceTranscript: liveTranscript || null,
        });
        toast.success("Saved offline, will sync when you're back online");
        onSaved?.();
        onOpenChange(false);
        return;
      }

      // 1. Insert processing row
      const { data: inserted, error: insertErr } = await supabase
        .from("journal_entries")
        .insert({
          user_id: userId,
          kind,
          status: "processing",
          text: finalText || null,
          voice_transcript: liveTranscript || null,
        })
        .select("id")
        .single();
      if (insertErr || !inserted) throw insertErr ?? new Error("Insert failed");
      const entryId = inserted.id;

      // 2. Upload files
      const ts = Date.now();
      const uploads: { path: string; kind: string }[] = [];
      for (const a of attachments) {
        const path = `${userId}/${entryId}/${a.kind}-${ts}-${a.id}.${extOf(a.file)}`;
        const { error } = await supabase.storage
          .from("journal-media")
          .upload(path, a.file, { contentType: a.file.type, upsert: false });
        if (error) throw error;
        uploads.push({ path, kind: a.kind });
      }
      if (voice.audioBlob) {
        const path = `${userId}/${entryId}/voice-${ts}.webm`;
        const { error } = await supabase.storage
          .from("journal-media")
          .upload(path, voice.audioBlob, { contentType: voice.audioBlob.type || "audio/webm" });
        if (error) throw error;
        uploads.push({ path, kind: "voice" });
      }

      // 3. Signed URLs (1 year)
      let mediaUrls: string[] = [];
      if (uploads.length > 0) {
        const { data: signed, error: signErr } = await supabase.storage
          .from("journal-media")
          .createSignedUrls(
            uploads.map((u) => u.path),
            60 * 60 * 24 * 365,
          );
        if (signErr) throw signErr;
        mediaUrls = (signed ?? []).map((s) => s.signedUrl).filter(Boolean) as string[];

        await supabase.from("journal_entries").update({ media_urls: mediaUrls }).eq("id", entryId);
      }

      // 4. Fire-and-forget processor
      supabase.functions.invoke("journal-processor", { body: { entry_id: entryId } }).catch(() => {
        /* will exist in next step */
      });

      onSaved?.();
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast.error(
        userMessage(
          err,
          "Your entry didn't save. It's still here on this screen, try again in a moment.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[92vh] sm:h-[88vh] flex flex-col p-0 rounded-t-2xl">
        <SheetHeader className="border-b border-border">
          <SheetColumn className="flex flex-row items-center justify-between space-y-0 px-5 pt-5 pb-3 pr-14">
            <SheetTitle className="font-serif text-lg font-normal">New entry</SheetTitle>
            <Button
              onClick={handleSave}
              disabled={!hasContent || saving}
              size="sm"
              className="rounded-full px-5"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </SheetColumn>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          <SheetColumn className="px-5 pt-4 pb-2">
            <Textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={placeholder}
              className="min-h-[180px] border-0 shadow-none focus-visible:ring-0 px-0 text-base resize-none font-serif placeholder:text-muted-foreground/60 placeholder:font-sans"
            />

            {!text.trim() && promptChips.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {promptChips.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => insertPrompt(p)}
                    className="rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            {voice.listening || voice.transcript ? (
              <div
                className={cn(
                  "mt-3 rounded-xl bg-secondary/70 p-3 text-sm text-secondary-foreground",
                  voice.listening && "ring-1 ring-primary/30",
                )}
              >
                <div className="flex items-center gap-2 mb-1 text-xs text-primary/80">
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full bg-primary",
                      voice.listening && "animate-pulse",
                    )}
                  />
                  {voice.listening ? "Listening…" : "Captured"}
                </div>
                <p className="font-serif leading-relaxed min-h-[1.5rem]">
                  {voice.transcript || (voice.listening ? "Go ahead…" : "")}
                </p>
              </div>
            ) : null}

            {attachments.length > 0 && (
              <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-2">
                {attachments.map((a) => (
                  <div
                    key={a.id}
                    className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
                  >
                    {a.kind === "photo" ? (
                      <img src={a.previewUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <video src={a.previewUrl} className="h-full w-full object-cover" muted />
                    )}
                    <button
                      type="button"
                      onClick={() => removeAttachment(a.id)}
                      className="absolute top-1 right-1 rounded-full bg-foreground/70 text-background p-1 opacity-80 hover:opacity-100"
                      aria-label="Remove"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </SheetColumn>
        </div>

        <div className="border-t border-border bg-card/50">
          <SheetColumn className="px-3 py-3 flex items-center justify-around">
            <ToolbarButton label="Photo" onClick={() => photoInput.current?.click()}>
              <Camera className="h-5 w-5" />
            </ToolbarButton>
            <ToolbarButton label="Gallery" onClick={() => galleryInput.current?.click()}>
              <ImageIcon className="h-5 w-5" />
            </ToolbarButton>
            <ToolbarButton label="Video" onClick={() => videoInput.current?.click()}>
              <Video className="h-5 w-5" />
            </ToolbarButton>
            <ToolbarButton
              label={voice.listening ? "Stop" : "Voice"}
              active={voice.listening}
              onClick={toggleVoice}
            >
              <Mic className={cn("h-5 w-5", voice.listening && "animate-pulse")} />
            </ToolbarButton>
          </SheetColumn>
        </div>

        <div className="border-t border-border bg-card/50">
          <SheetColumn className="px-5 py-2">
            <Link
              to="/seizures/new"
              onClick={() => onOpenChange(false)}
              className="flex items-center justify-center gap-2 text-sm text-destructive font-medium py-1.5"
            >
              <Zap className="h-4 w-4" fill="currentColor" />
              Log an event
            </Link>
          </SheetColumn>
        </div>

        <input
          ref={photoInput}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files, "photo");
            e.target.value = "";
          }}
        />
        <input
          ref={galleryInput}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files, "photo");
            e.target.value = "";
          }}
        />
        <input
          ref={videoInput}
          type="file"
          accept="video/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files, "video");
            e.target.value = "";
          }}
        />
      </SheetContent>
    </Sheet>
  );
}

function ToolbarButton({
  children,
  label,
  onClick,
  active,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors",
        active
          ? "bg-primary/15 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
      )}
    >
      {children}
      <span className="text-[10px] uppercase tracking-wide">{label}</span>
    </button>
  );
}
