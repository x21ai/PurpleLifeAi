import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, X, ChevronRight, Pill, Users, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";

const STORAGE_KEY = "purple-first-entry-nudge-dismissed";

type Profile = {
  conditions: string[] | null;
  quiet_hours_start: string | null;
  weekly_digest_enabled: boolean | null;
};

/**
 * Celebratory nudge shown once after a user writes their very first journal entry.
 * Suggests the next high-value setup steps: add a medication, set quiet hours,
 * invite a caregiver. Dismissible and persists in localStorage.
 */
export function FirstEntryNudge() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [show, setShow] = React.useState(false);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [hasMed, setHasMed] = React.useState<boolean | null>(null);
  const [hasCare, setHasCare] = React.useState<boolean | null>(null);
  const [dismissed, setDismissed] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "1";
  });

  React.useEffect(() => {
    if (!userId || dismissed) return;
    let active = true;
    void (async () => {
      const [{ count: entryCount }, { data: p }, { count: medCount }, { count: careCount }] =
        await Promise.all([
          supabase
            .from("journal_entries")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId),
          supabase
            .from("profiles")
            .select("conditions, quiet_hours_start, weekly_digest_enabled")
            .eq("id", userId)
            .maybeSingle(),
          supabase
            .from("medications")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("active", true),
          supabase
            .from("care_relationships")
            .select("id", { count: "exact", head: true })
            .eq("owner_id", userId),
        ]);
      if (!active) return;
      setProfile((p as Profile | null) ?? null);
      setHasMed((medCount ?? 0) > 0);
      setHasCare((careCount ?? 0) > 0);
      // Show only when exactly 1 entry exists (the first one).
      setShow((entryCount ?? 0) >= 1 && (entryCount ?? 0) <= 3);
    })();
    return () => {
      active = false;
    };
  }, [userId, dismissed]);

  if (dismissed || !show || profile === null || hasMed === null || hasCare === null) return null;

  const items: { key: string; label: string; to: string; icon: React.ReactNode; done: boolean }[] =
    [
      {
        key: "med",
        label: "Add a medication & dose times",
        to: "/meds",
        icon: <Pill className="h-4 w-4" />,
        done: hasMed,
      },
      {
        key: "quiet",
        label: "Set quiet hours for reminders",
        to: "/settings",
        icon: <Bell className="h-4 w-4" />,
        done: !!profile.quiet_hours_start,
      },
      {
        key: "care",
        label: "Invite a family member or caregiver",
        to: "/care",
        icon: <Users className="h-4 w-4" />,
        done: hasCare,
      },
    ].filter((i) => !i.done);

  if (items.length === 0) return null;

  return (
    <section className="mt-6 rounded-2xl ring-1 ring-primary/30 bg-gradient-to-br from-primary/10 to-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex items-start gap-2">
          <Sparkles className="h-4 w-4 mt-0.5 text-primary" />
          <div>
            <p className="label-eyebrow text-primary">First entry saved</p>
            <p className="mt-1 text-sm text-foreground">
              Nicely done. Here are a few quick next steps to get more out of Purple.
            </p>
          </div>
        </div>
        <button
          type="button"
          aria-label="Dismiss"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => {
            try {
              localStorage.setItem(STORAGE_KEY, "1");
            } catch {
              // ignore
            }
            setDismissed(true);
          }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <ul className="mt-4 space-y-1.5">
        {items.map((i) => (
          <li key={i.key}>
            <Link
              to={i.to}
              className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm hover:bg-secondary"
            >
              <span className="flex items-center gap-2 text-foreground">
                <span className="text-muted-foreground">{i.icon}</span>
                {i.label}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
