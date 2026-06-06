import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Camera, Image as ImageIcon, Video, Mic, Square, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { toast } from "sonner";
import { useVoiceCapture } from "@/components/journal/use-voice-capture";
import { VoiceWave } from "@/components/journal/voice-wave";
import { useRouteTheme } from "@/lib/use-route-theme";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import { autoRouteJournalToReports } from "@/lib/journal-classify.functions";

export const Route = createFileRoute("/_app/journal/new")({
  head: () => ({ meta: [{ title: "New entry · Purple" }] }),
  component: JournalNewPage,
});

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
  const hasPhoto = atts.some((a) => a.kind === "photo");
  const hasVideo = atts.some((a) => a.kind === "video");
  const hasText = text.trim().length > 0;
  const hasVoice = voice.trim().length > 0;
  const types = [hasText, hasVoice, atts.length > 0].filter(Boolean).length;
  if (types > 1) return "mixed";
  if (hasVoice) return "voice";
  if (hasVideo) return "video";
  if (hasPhoto) return "photo";
  return "text";
}

function JournalNewPage() {
  useRouteTheme("dark");
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { session } = useAuth();
  const userId = session?.user.id;

  const DRAFT_KEY = userId ? `purple-journal-draft-${userId}` : "purple-journal-draft";
  const [text, setText] = React.useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return localStorage.getItem(DRAFT_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [attachments, setAttachments] = React.useState<Attachment[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [capturedAt, setCapturedAt] = React.useState<Date>(new Date());
  const voice = useVoiceCapture();
  const autoRoute = useServerFn(autoRouteJournalToReports);

  // Persist text draft across reloads / pull-to-refresh.
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (text) localStorage.setItem(DRAFT_KEY, text);
      else localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore quota errors */
    }
  }, [text, DRAFT_KEY]);

  const photoInput = React.useRef<HTMLInputElement | null>(null);
  const galleryInput = React.useRef<HTMLInputElement | null>(null);
  const videoInput = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    return () => {
      attachments.forEach((a) => URL.revokeObjectURL(a.previewUrl));
      void voice.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    } else {
      await voice.start();
    }
  };

  const hasContent =
    text.trim().length > 0 ||
    attachments.length > 0 ||
    voice.transcript.trim().length > 0 ||
    !!voice.audioBlob;

  const close = () => navigate({ to: "/journal" });

  const handleSave = async () => {
    if (!userId || !hasContent || saving) return;
    setSaving(true);
    if (voice.listening) await voice.stop();
    await new Promise((r) => setTimeout(r, 80));

    try {
      const liveTranscript = voice.transcript.trim();
      const finalText = text.trim();
      const kind = inferKind(finalText, liveTranscript, attachments);

      const { data: inserted, error: insertErr } = await supabase
        .from("journal_entries")
        .insert({
          user_id: userId,
          kind,
          status: "processing",
          captured_at: capturedAt.toISOString(),
          text: finalText || null,
          voice_transcript: liveTranscript || null,
        })
        .select("id")
        .single();
      if (insertErr || !inserted) throw insertErr ?? new Error("Insert failed");
      const entryId = inserted.id;

      const ts = Date.now();
      const uploads: { path: string; kind: string }[] = [];

      if (voice.audioBlob) {
        const path = `${userId}/${entryId}/audio-${ts}.m4a`;
        const { error } = await supabase.storage
          .from("journal-media")
          .upload(path, voice.audioBlob, {
            contentType: voice.audioBlob.type || "audio/webm",
            upsert: false,
          });
        if (error) throw error;
        uploads.push({ path, kind: "voice" });
      }

      for (const a of attachments) {
        const path = `${userId}/${entryId}/${a.kind}-${ts}-${a.id}.${extOf(a.file)}`;
        const { error } = await supabase.storage
          .from("journal-media")
          .upload(path, a.file, { contentType: a.file.type, upsert: false });
        if (error) throw error;
        uploads.push({ path, kind: a.kind });
      }

      if (uploads.length > 0) {
        const { data: signed, error: signErr } = await supabase.storage
          .from("journal-media")
          .createSignedUrls(uploads.map((u) => u.path), 60 * 60 * 24 * 365);
        if (signErr) throw signErr;
        const mediaUrls = (signed ?? [])
          .map((s) => s.signedUrl)
          .filter(Boolean) as string[];
        await supabase
          .from("journal_entries")
          .update({ media_urls: mediaUrls })
          .eq("id", entryId);
      }

      supabase.functions
        .invoke("journal-processor", { body: { entry_id: entryId } })
        .catch(() => { /* edge fn may not be deployed yet */ });

      // Auto-route clinical attachments (PDF/photo of lab/imaging report)
      // into the Reports section. Fire-and-forget, runs in parallel.
      if (attachments.length > 0) {
        void autoRoute({ data: { journalEntryId: entryId } }).catch(() => {
          /* best effort */
        });
      }

      navigate({ to: "/journal" });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Could not save entry");
      setSaving(false);
      return;
    }

    // Saved successfully, clear draft.
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
  };

  const showTranscript = voice.listening || voice.transcript.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background text-foreground">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),12px)] pb-3">
        <button
          type="button"
          onClick={close}
          aria-label={t("common.close")}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground/80 hover:bg-secondary/60"
        >
          <X className="h-5 w-5" />
        </button>
        <h1 className="font-serif text-base font-normal text-foreground/80">{t("journalNew.title")}</h1>
        <Button
          onClick={handleSave}
          disabled={!hasContent || saving}
          size="sm"
          className="rounded-full px-5"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.save")}
        </Button>
      </header>

      {/* Body */}
      <main className="flex-1 overflow-y-auto px-5 pt-2 pb-4">
        <div className="mb-3 -mt-1">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">When did this happen?</p>
          <DateTimePicker value={capturedAt} onChange={(d) => d && setCapturedAt(d)} disableFuture />
        </div>
        <Textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What is happening, or what just happened?"
          className="min-h-[160px] border-0 shadow-none focus-visible:ring-0 px-0 text-lg resize-none font-serif bg-transparent placeholder:text-foreground/40 placeholder:font-sans"
        />

        {showTranscript && (
          <div
            className={cn(
              "mt-4 surface-ai rounded-[20px] p-4 max-w-[600px]",
              voice.listening && "ring-1 ring-[color:var(--purple-primary)]/40",
            )}
          >
            <div className="flex items-center gap-2 mb-2 text-xs uppercase tracking-wide text-[color:var(--purple-primary)]">
              <VoiceWave />
              <span>{voice.listening ? "Listening" : "Captured"}</span>
            </div>
            <p className="font-serif text-base leading-relaxed text-foreground/85 min-h-[1.5rem]">
              {voice.transcript || (voice.listening ? "Go ahead…" : "")}
            </p>
          </div>
        )}

        {attachments.length > 0 && (
          <div className="mt-5 grid grid-cols-3 sm:grid-cols-4 gap-2">
            {attachments.map((a) => (
              <div
                key={a.id}
                className="relative aspect-square rounded-lg overflow-hidden bg-secondary"
              >
                {a.kind === "photo" ? (
                  <img src={a.previewUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <video src={a.previewUrl} className="h-full w-full object-cover" muted />
                )}
                <button
                  type="button"
                  onClick={() => removeAttachment(a.id)}
                  className="absolute top-1 right-1 rounded-full bg-background/80 text-foreground p-1 hover:bg-background"
                  aria-label="Remove"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Bottom dock */}
      <footer className="border-t border-border/60 bg-card/40 backdrop-blur px-4 pt-4 pb-[max(env(safe-area-inset-bottom),16px)]">
        <div className="flex flex-col items-center gap-4">
          {/* Mic */}
          <button
            type="button"
            onClick={toggleVoice}
            aria-label={voice.listening ? "Stop recording" : "Start recording"}
            disabled={!voice.supported && !voice.listening && false}
            className={cn(
              "relative inline-flex h-14 w-14 items-center justify-center rounded-full transition-transform active:scale-95",
              voice.listening
                ? "bg-destructive text-destructive-foreground shadow-lg shadow-destructive/40"
                : "bg-[var(--purple-primary)] text-white shadow-lg shadow-[color:var(--purple-primary)]/40",
            )}
          >
            {voice.listening && (
              <span className="absolute inset-0 rounded-full bg-destructive/40 animate-ping" />
            )}
            {voice.listening ? (
              <Square className="h-5 w-5 relative" fill="currentColor" />
            ) : (
              <Mic className="h-6 w-6 relative" />
            )}
          </button>

          {/* Secondary actions */}
          <div className="flex items-center justify-center gap-2">
            <DockButton label="Photo" onClick={() => photoInput.current?.click()}>
              <Camera className="h-5 w-5" />
            </DockButton>
            <DockButton label="Gallery" onClick={() => galleryInput.current?.click()}>
              <ImageIcon className="h-5 w-5" />
            </DockButton>
            <DockButton label="Video" onClick={() => videoInput.current?.click()}>
              <Video className="h-5 w-5" />
            </DockButton>
          </div>
        </div>

        <input
          ref={photoInput}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => { addFiles(e.target.files, "photo"); e.target.value = ""; }}
        />
        <input
          ref={galleryInput}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => { addFiles(e.target.files, "photo"); e.target.value = ""; }}
        />
        <input
          ref={videoInput}
          type="file"
          accept="video/*"
          capture="environment"
          className="hidden"
          onChange={(e) => { addFiles(e.target.files, "video"); e.target.value = ""; }}
        />
      </footer>
    </div>
  );
}

function DockButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full text-foreground/70 hover:text-foreground hover:bg-secondary/60 transition"
    >
      {children}
    </button>
  );
}