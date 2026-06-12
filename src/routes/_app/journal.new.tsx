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
import { queueEntry } from "@/lib/offline-journal-queue";
import { processJournalEntry } from "@/lib/journal-pipeline";
import { VoiceWave } from "@/components/journal/voice-wave";
import { useRouteTheme } from "@/lib/use-route-theme";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import { autoRouteJournalToReports } from "@/lib/journal-classify.functions";
import { userMessage } from "@/lib/user-message";

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

      void processJournalEntry(entryId);

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
      // Text-only entries survive a dead connection: queue locally and move
      // on. The journal list shows the pending banner until it syncs.
      const liveTranscript = voice.transcript.trim();
      const finalText = text.trim();
      const textOnly = attachments.length === 0 && !voice.audioBlob;
      const looksOffline =
        typeof navigator !== "undefined" && navigator.onLine === false
          ? true
          : /fetch|network|load failed|timeout/i.test(
              err instanceof Error ? err.message : String(err),
            );
      if (textOnly && looksOffline && (finalText || liveTranscript)) {
        queueEntry({
          userId,
          kind: inferKind(finalText, liveTranscript, []),
          text: finalText || null,
          voiceTranscript: liveTranscript || null,
          capturedAt: capturedAt.toISOString(),
        });
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch {
          /* ignore */
        }
        toast.success("Purple couldn't reach the server. Your entry is saved on this device and will sync when you're back online.");
        navigate({ to: "/journal" });
        return;
      }
      toast.error(userMessage(err, "Your entry didn't save. It's still here on this screen, try again in a moment."));
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
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky top bar, matches sheet-page rhythm but with a Save action on the right */}
      <header
        className="sticky top-0 z-20 bg-background/85 backdrop-blur border-b border-border/60"
        style={{ paddingTop: "max(env(safe-area-inset-top), 0px)" }}
      >
        <div className="mx-auto max-w-3xl flex items-center justify-between px-4 sm:px-6 py-3">
          <button
            type="button"
            onClick={close}
            aria-label={t("common.close")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground/80 hover:bg-secondary/60"
          >
            <X className="h-5 w-5" />
          </button>
          <h1 className="text-[15px] font-medium text-foreground">{t("journalNew.title")}</h1>
          <Button
            onClick={handleSave}
            disabled={!hasContent || saving}
            size="sm"
            className="rounded-full px-5"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.save")}
          </Button>
        </div>
      </header>

      {/* Body */}
      <main
        className="mx-auto max-w-3xl px-4 sm:px-6 pt-5 sm:pt-8 space-y-5"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 24px)" }}
      >
        {/* When */}
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground mb-2">
            When did this happen?
          </p>
          <DateTimePicker value={capturedAt} onChange={(d) => d && setCapturedAt(d)} disableFuture />
        </div>

        {/* Text, large serif input on a card so it reads like a page, not a sheet */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6">
          <Textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What is happening, or what just happened?"
            className="min-h-[200px] sm:min-h-[260px] border-0 shadow-none focus-visible:ring-0 px-0 text-lg resize-none font-serif bg-transparent placeholder:text-foreground/40 placeholder:font-sans"
          />
        </div>

        {/* Voice transcript */}
        {showTranscript && (
          <div
            className={cn(
              "surface-ai rounded-[20px] p-4",
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

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
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

        {/* Capture toolbar, lives inside a card at the bottom of the scroll area, not floating */}
        <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground mb-3">
            Add to this entry
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={toggleVoice}
              aria-label={voice.listening ? "Stop recording" : "Start recording"}
              className={cn(
                "relative inline-flex items-center gap-2 rounded-full px-4 h-11 text-sm font-medium transition-transform active:scale-95",
                voice.listening
                  ? "bg-destructive text-destructive-foreground shadow shadow-destructive/30"
                  : "bg-[var(--purple-primary)] text-white shadow shadow-[color:var(--purple-primary)]/30",
              )}
            >
              {voice.listening && (
                <span className="absolute inset-0 rounded-full bg-destructive/40 animate-ping" />
              )}
              {voice.listening ? (
                <Square className="h-4 w-4 relative" fill="currentColor" />
              ) : (
                <Mic className="h-4 w-4 relative" />
              )}
              <span className="relative">{voice.listening ? "Stop" : "Record"}</span>
            </button>
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
      </main>
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
      className="inline-flex h-11 w-11 items-center justify-center rounded-full text-foreground/70 hover:text-foreground hover:bg-secondary/60 border border-border/60 transition"
    >
      {children}
    </button>
  );
}