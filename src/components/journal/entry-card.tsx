import * as React from "react";
import { formatDistanceToNow, format } from "date-fns";
import { Pencil, Mic, Camera, Video, Sparkles, Loader2, MoreVertical, Edit3, Archive, ArchiveRestore, Trash2, X, Check, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";
import { DateTimePicker } from "@/components/ui/date-time-picker";

type Entry = Database["public"]["Tables"]["journal_entries"]["Row"];

const KIND_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  text: Pencil,
  voice: Mic,
  photo: Camera,
  video: Video,
  mixed: Sparkles,
};

function isImage(url: string) {
  return /\.(png|jpe?g|webp|gif|heic|avif)(\?|$)/i.test(url);
}
function isVideo(url: string) {
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);
}

export function EntryCard({ entry }: { entry: Entry }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [draftText, setDraftText] = React.useState(entry.text ?? "");
  const [draftVoice, setDraftVoice] = React.useState(entry.voice_transcript ?? "");
  const [draftAt, setDraftAt] = React.useState<Date>(new Date(entry.captured_at));
  const [saving, setSaving] = React.useState(false);
  const archived = Boolean(entry.archived_at);

  const openEdit = () => {
    setDraftText(entry.text ?? "");
    setDraftVoice(entry.voice_transcript ?? "");
    setDraftAt(new Date(entry.captured_at));
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
  };

  const saveEdit = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("journal_entries")
      .update({
        text: draftText.trim() ? draftText : null,
        voice_transcript: draftVoice.trim() ? draftVoice : null,
        captured_at: draftAt.toISOString(),
        status: "processing",
      })
      .eq("id", entry.id);
    if (error) {
      setSaving(false);
      toast.error("Couldn't save changes");
      return;
    }
    void supabase.functions
      .invoke("journal-extract", { body: { journal_entry_id: entry.id } })
      .catch(() => { /* extraction errors don't block save */ });
    setSaving(false);
    setEditing(false);
    toast.success("Entry updated");
  };

  const archive = async () => {
    setBusy(true);
    const { error } = await supabase
      .from("journal_entries")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", entry.id);
    setBusy(false);
    if (error) toast.error("Couldn't archive entry");
    else toast.success("Entry archived");
  };

  const restore = async () => {
    setBusy(true);
    const { error } = await supabase
      .from("journal_entries")
      .update({ archived_at: null })
      .eq("id", entry.id);
    setBusy(false);
    if (error) toast.error("Couldn't restore entry");
    else toast.success("Entry restored");
  };

  const destroy = async () => {
    setBusy(true);
    await supabase.from("daily_behaviors").delete().eq("journal_entry_id", entry.id);
    const { error } = await supabase.from("journal_entries").delete().eq("id", entry.id);
    setBusy(false);
    setConfirmDelete(false);
    if (error) toast.error("Couldn't delete entry");
    else toast.success("Entry deleted");
  };

  const Icon = KIND_ICON[entry.kind] ?? Pencil;
  const photos = entry.media_urls.filter(isImage);
  const videos = entry.media_urls.filter(isVideo);
  // Filter out the model's "no entry provided" meta replies if any landed in the DB.
  const cleanSummary = React.useMemo(() => {
    const s = (entry.ai_summary ?? "").trim();
    if (!s) return "";
    const lower = s.toLowerCase();
    if (
      lower.includes("i don't see a journal") ||
      lower.includes("i do not see a journal") ||
      lower.includes("no journal entry") ||
      lower.startsWith("please provide") ||
      lower.startsWith("i'm ready to help") ||
      lower.startsWith("i am ready to help")
    ) {
      return "";
    }
    return s;
  }, [entry.ai_summary]);
  const processing = entry.status === "processing";
  const failed = entry.status === "failed";
  // After 5 minutes, a "processing" entry has almost certainly stalled — offer a retry.
  const stale =
    processing &&
    Date.now() - new Date(entry.created_at).getTime() > 5 * 60 * 1000;

  const retryExtract = async () => {
    if (busy) return;
    setBusy(true);
    try {
      // Re-trigger the extractor by re-saving the row's text/captured_at;
      // the realtime listener on the journal page will pick up the update.
      await supabase
        .from("journal_entries")
        .update({ status: "processing" })
        .eq("id", entry.id);
      await supabase.functions.invoke("journal-processor", {
        body: { entryId: entry.id },
      });
      toast.success("Re-reading entry…");
    } catch (e) {
      toast.error("Couldn't restart. Try again later.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm">
      <header className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-primary">
            <Icon className="h-3.5 w-3.5" />
          </span>
          <span suppressHydrationWarning className="flex flex-col leading-tight">
            <span className="text-foreground/80">
              {format(new Date(entry.captured_at), "EEE, MMM d, yyyy · h:mm a")}
            </span>
            <span className="text-[10px] text-muted-foreground/70">
              {mounted
                ? formatDistanceToNow(new Date(entry.captured_at), { addSuffix: true })
                : "\u00a0"}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {processing && !stale && (
            <span className="inline-flex items-center gap-1 text-primary/80">
              <Loader2 className="h-3 w-3 animate-spin" /> reading…
            </span>
          )}
          {(stale || failed) && (
            <button
              type="button"
              onClick={retryExtract}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary/60 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              {failed ? "Retry reading" : "Stuck — retry"}
            </button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-secondary/70 text-muted-foreground disabled:opacity-50"
              aria-label="Entry actions"
              disabled={busy}
            >
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {!archived ? (
                <>
                  <DropdownMenuItem onClick={openEdit}>
                    <Edit3 className="h-4 w-4 mr-2" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={archive}>
                    <Archive className="h-4 w-4 mr-2" /> Archive
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={restore}>
                    <ArchiveRestore className="h-4 w-4 mr-2" /> Restore
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setConfirmDelete(true)} className="text-destructive focus:text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" /> Delete permanently
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {editing ? (
        <div className="mt-3 space-y-3">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5 flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" /> When did this happen?
            </p>
            <DateTimePicker value={draftAt} onChange={(d) => d && setDraftAt(d)} disableFuture />
          </div>
          <Textarea
            autoFocus
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            placeholder="What is happening, or what just happened?"
            className="min-h-[120px] font-serif text-[15px] leading-relaxed bg-background"
          />
          {(entry.voice_transcript || draftVoice) && (
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                Voice transcript
              </p>
              <Textarea
                value={draftVoice}
                onChange={(e) => setDraftVoice(e.target.value)}
                className="min-h-[80px] font-serif text-sm italic bg-secondary/40"
              />
            </div>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={cancelEdit}
              disabled={saving}
              className="h-8"
            >
              <X className="h-3.5 w-3.5 mr-1" /> Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={saveEdit}
              disabled={saving || (!draftText.trim() && !draftVoice.trim())}
              className="h-8"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <Check className="h-3.5 w-3.5 mr-1" /> Save
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <>
          {entry.text && (
        <p className="mt-3 font-serif text-[15px] leading-relaxed whitespace-pre-wrap text-foreground">
          {entry.text}
        </p>
      )}

      {entry.voice_transcript && (
        <p className="mt-3 font-serif text-[15px] leading-relaxed whitespace-pre-wrap text-foreground/90 italic">
          “{entry.voice_transcript}”
        </p>
      )}

      {(photos.length > 0 || videos.length > 0) && (
        <div className={cn("mt-3 grid gap-2", photos.length + videos.length > 1 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1")}>
          {photos.map((url) => (
            <img key={url} src={url} alt="" loading="lazy" className="rounded-lg w-full aspect-square object-cover" />
          ))}
          {videos.map((url) => (
            <video key={url} src={url} controls className="rounded-lg w-full aspect-square object-cover bg-black" />
          ))}
        </div>
      )}

      {cleanSummary && (
        <div className="mt-4 rounded-xl bg-secondary/70 px-3 py-2 text-sm text-secondary-foreground">
          <span className="font-serif">{cleanSummary}</span>
        </div>
      )}

      {entry.ai_tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {entry.ai_tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center rounded-full border border-primary/30 bg-background text-primary px-2.5 py-0.5 text-[11px] tracking-wide"
              aria-label={`Tag: ${t}`}
            >
              {t}
            </span>
          ))}
        </div>
      )}
        </>
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the journal entry and any behaviors extracted from it. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={destroy} disabled={busy} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
}