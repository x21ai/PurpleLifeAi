import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Check, ChevronRight, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";

type ChecklistRow = {
  emergency_contact_phone: string | null;
  conditions: string[] | null;
  onboarded_at: string | null;
};

type Item = {
  key: string;
  label: string;
  done: boolean;
  to: "/settings" | "/welcome" | "/journal";
};

const STORAGE_KEY = "purple-checklist-dismissed";

export function OnboardingChecklist() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [profile, setProfile] = React.useState<ChecklistRow | null>(null);
  const [journalCount, setJournalCount] = React.useState<number | null>(null);
  const [hasConnection, setHasConnection] = React.useState<boolean | null>(null);
  const [dismissed, setDismissed] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "1";
  });

  React.useEffect(() => {
    if (!userId) return;
    let active = true;
    void (async () => {
      const [{ data: p }, jc, conns] = await Promise.all([
        supabase
          .from("profiles")
          .select("emergency_contact_phone, conditions, onboarded_at")
          .eq("id", userId)
          .maybeSingle(),
        supabase
          .from("journal_entries")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
        supabase
          .from("biometrics")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .limit(1),
      ]);
      if (!active) return;
      setProfile((p as ChecklistRow | null) ?? null);
      setJournalCount(jc.count ?? 0);
      setHasConnection((conns.count ?? 0) > 0);
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  if (dismissed || !profile || journalCount == null || hasConnection == null) {
    return null;
  }

  const items: Item[] = [
    {
      key: "conditions",
      label: "Tell Purple what you live with",
      done: (profile.conditions ?? []).length > 0,
      to: "/welcome",
    },
    {
      key: "emergency",
      label: "Add an emergency contact",
      done: !!profile.emergency_contact_phone,
      to: "/settings",
    },
    {
      key: "journal",
      label: "Write your first journal entry",
      done: journalCount > 0,
      to: "/journal",
    },
    {
      key: "tracker",
      label: "Connect a tracker (optional)",
      done: hasConnection,
      to: "/settings",
    },
  ];

  const completed = items.filter((i) => i.done).length;
  if (completed === items.length) return null;

  const pct = Math.round((completed / items.length) * 100);

  return (
    <section className="mt-6 rounded-2xl ring-1 ring-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="label-eyebrow text-muted-foreground">Finish setting up</p>
          <p className="mt-1 text-sm text-foreground">
            {completed} of {items.length} done · {pct}%
          </p>
        </div>
        <button
          type="button"
          aria-label="Hide setup checklist"
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
      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-secondary">
        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
      <ul className="mt-4 space-y-1.5">
        {items.map((i) => (
          <li key={i.key}>
            <Link
              to={i.to}
              className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm hover:bg-secondary"
            >
              <span className="flex items-center gap-2">
                <span
                  className={
                    "flex h-5 w-5 items-center justify-center rounded-full " +
                    (i.done
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-background")
                  }
                >
                  {i.done && <Check className="h-3 w-3" />}
                </span>
                <span className={i.done ? "text-muted-foreground line-through" : "text-foreground"}>
                  {i.label}
                </span>
              </span>
              {!i.done && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
