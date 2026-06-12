import * as React from "react";
import { Link } from "@tanstack/react-router";
import { PenLine, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { promptsForConditions } from "@/lib/condition-prompts";

const STORAGE_PREFIX = "purple-reengage-dismissed:";

type Props = {
  conditions: string[] | null | undefined;
  /** Only render when the user has at least one entry, empty state covers zero. */
  hasAnyEntries: boolean;
};

/**
 * Calm day-3 / day-7 re-engagement nudge for Today.
 * Shows when the most recent journal entry is 3+ days old, with a
 * condition-aware micro-prompt. Dismissible per-day.
 */
export function ReEngagementNudge({ conditions, hasAnyEntries }: Props) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [daysSince, setDaysSince] = React.useState<number | null>(null);
  const todayKey = React.useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }, []);
  const [dismissed, setDismissed] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_PREFIX + todayKey) === "1";
  });

  React.useEffect(() => {
    if (!userId || !hasAnyEntries) return;
    let active = true;
    void (async () => {
      const { data } = await supabase
        .from("journal_entries")
        .select("captured_at")
        .eq("user_id", userId)
        .order("captured_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!active) return;
      const last = data?.captured_at ? new Date(data.captured_at).getTime() : null;
      if (!last) {
        setDaysSince(null);
        return;
      }
      const days = Math.floor((Date.now() - last) / 86_400_000);
      setDaysSince(days);
    })();
    return () => {
      active = false;
    };
  }, [userId, hasAnyEntries]);

  if (dismissed || daysSince == null || daysSince < 3) return null;

  const prompts = promptsForConditions(conditions);
  const prompt = prompts[daysSince % prompts.length] ?? "How are you, honestly?";
  const headline =
    daysSince >= 7
      ? "It's been a week since your last entry"
      : `${daysSince} days since your last entry`;

  return (
    <section className="mb-6 relative overflow-hidden rounded-2xl border border-border bg-card p-5">
      <button
        type="button"
        aria-label="Dismiss for today"
        onClick={() => {
          try {
            localStorage.setItem(STORAGE_PREFIX + todayKey, "1");
          } catch {
            // ignore
          }
          setDismissed(true);
        }}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
      <p className="label-eyebrow text-muted-foreground">Gentle check-in</p>
      <p className="mt-2 font-serif text-lg text-foreground max-w-[34ch]">{headline}</p>
      <p className="mt-2 text-sm text-muted-foreground max-w-[44ch]">{prompt}</p>
      <Link
        to="/journal/new"
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm hover:opacity-90"
      >
        <PenLine className="h-4 w-4" />
        Capture a quick entry
      </Link>
    </section>
  );
}
