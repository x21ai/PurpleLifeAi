import * as React from "react";
import { formatDistanceToNow, format } from "date-fns";
import { Pencil, Mic, Camera, Video, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Entry = {
  id: string;
  captured_at: string;
  kind: string;
  text: string | null;
  ai_summary: string | null;
  ai_tags: string[] | null;
};

const KIND_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  text: Pencil,
  voice: Mic,
  photo: Camera,
  video: Video,
  mixed: Sparkles,
};

/**
 * Caregiver-side journal card. Visual clone of <EntryCard> minus the owner
 * write actions (edit, archive, delete, retry). All writes happen on the
 * patient's own account; caregiver writes come in Step 3.
 */
export function JournalEntryReadOnly({ entry }: { entry: Entry }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const Icon = KIND_ICON[entry.kind] ?? Pencil;
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

  const tags = entry.ai_tags ?? [];

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
      </header>

      {entry.text && (
        <p className="mt-3 font-serif text-[15px] leading-relaxed whitespace-pre-wrap text-foreground">
          {entry.text}
        </p>
      )}

      {cleanSummary && (
        <div className="mt-4 rounded-xl bg-secondary/70 px-3 py-2 text-sm text-secondary-foreground">
          <span className="font-serif">{cleanSummary}</span>
        </div>
      )}

      {tags.length > 0 && (
        <div className={cn("mt-3 flex flex-wrap gap-1.5")}>
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center rounded-full border border-primary/30 bg-background text-primary px-2.5 py-0.5 text-[11px] tracking-wide"
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}