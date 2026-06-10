import * as React from "react";
import { Check, Sparkles, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import {
  welcomeBulletsForConditions,
  welcomeTitleForConditions,
} from "@/lib/condition-welcome-copy";

/**
 * One-time post-signup card that tells the user what Purple will track for
 * the conditions they picked in /welcome. Dismissal is stored on the
 * profile so it never reappears across devices.
 */
export function ConditionWelcomeNudge() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [state, setState] = React.useState<
    | { kind: "loading" }
    | { kind: "hidden" }
    | { kind: "visible"; conditions: string[] }
  >({ kind: "loading" });

  React.useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("conditions, welcome_nudge_dismissed_at")
        .eq("id", userId)
        .maybeSingle();
      if (cancelled) return;
      const dismissed = (data as any)?.welcome_nudge_dismissed_at;
      const conditions: string[] = (data as any)?.conditions ?? [];
      if (dismissed || !conditions || conditions.length === 0) {
        setState({ kind: "hidden" });
      } else {
        setState({ kind: "visible", conditions });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function dismiss() {
    setState({ kind: "hidden" });
    if (!userId) return;
    await supabase
      .from("profiles")
      .update({ welcome_nudge_dismissed_at: new Date().toISOString() })
      .eq("id", userId);
  }

  if (state.kind !== "visible") return null;

  const title = welcomeTitleForConditions(state.conditions);
  const bullets = welcomeBulletsForConditions(state.conditions, 4);

  return (
    <section className="mb-6 rounded-2xl ring-1 ring-border bg-card p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-secondary p-2 shrink-0">
          <Sparkles className="h-4 w-4 text-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="label-eyebrow text-muted-foreground">Welcome to Purple</p>
          <p className="mt-1.5 font-serif text-lg sm:text-xl text-foreground leading-snug">
            {title}
          </p>
          <ul className="mt-3 space-y-1.5">
            {bullets.map((b) => (
              <li
                key={b}
                className="flex items-start gap-2 text-sm text-foreground/90"
              >
                <Check className="h-3.5 w-3.5 mt-1 text-[color:var(--purple-primary)] shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between gap-3">
            <Link
              to="/my-health"
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              Adjust anytime in My Health
            </Link>
            <button
              type="button"
              onClick={dismiss}
              className="text-xs font-medium text-foreground underline-offset-4 hover:underline"
            >
              Got it
            </button>
          </div>
        </div>
        <button
          type="button"
          aria-label="Dismiss"
          className="text-muted-foreground hover:text-foreground"
          onClick={dismiss}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}