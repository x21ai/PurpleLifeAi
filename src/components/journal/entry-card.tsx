import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import { Pencil, Mic, Camera, Video, Sparkles, Loader2 } from "lucide-react";
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
        {processing && (
          <span className="inline-flex items-center gap-1 text-primary/80">
            <Loader2 className="h-3 w-3 animate-spin" /> reading…
          </span>
        )}
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
    </article>
  );
}