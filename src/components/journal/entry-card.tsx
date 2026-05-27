import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import { Pencil, Mic, Camera, Video, Sparkles, Loader2, MoreVertical, Edit3, Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const archived = Boolean(entry.archived_at);

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
  const processing = entry.status === "processing";

  return (
    <article className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm">
      <header className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-primary">
            <Icon className="h-3.5 w-3.5" />
          </span>
          <span suppressHydrationWarning>
            {mounted
              ? formatDistanceToNow(new Date(entry.captured_at), { addSuffix: true })
              : "\u00a0"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {processing && (
            <span className="inline-flex items-center gap-1 text-primary/80">
              <Loader2 className="h-3 w-3 animate-spin" /> reading…
            </span>
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
                  <DropdownMenuItem onClick={() => navigate({ to: "/journal/$entryId/edit", params: { entryId: entry.id } })}>
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

      {entry.ai_summary && (
        <div className="mt-4 rounded-xl bg-secondary/70 px-3 py-2 text-sm text-secondary-foreground">
          <span className="font-serif">{entry.ai_summary}</span>
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