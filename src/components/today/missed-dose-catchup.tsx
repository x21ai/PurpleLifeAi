import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Pill } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { cancelDoseReminder } from "@/lib/med-notifications";

type MissedDose = {
  id: string;
  scheduled_at: string;
  medication: { name: string } | null;
};

const ACTED_KEY = "purple-dose-catchup-acted";
const ALL_SENTINEL = "__all__";
const DOSE_TTL_MS = 48 * 60 * 60 * 1000; // 48h
const ALL_TTL_MS = 12 * 60 * 60 * 1000; // 12h

type ActedMap = Record<string, number>;

function readActed(): ActedMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(ACTED_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ActedMap;
    const now = Date.now();
    const pruned: ActedMap = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === "number" && v > now) pruned[k] = v;
    }
    return pruned;
  } catch {
    return {};
  }
}

function writeActed(map: ActedMap) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACTED_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

function rememberDose(doseId: string, ttlMs: number) {
  const map = readActed();
  map[doseId] = Date.now() + ttlMs;
  writeActed(map);
}

/**
 * Self-healing for silent notification failures: on app open, doses from the
 * past 24h that should have fired but have no delivery-log row (and were
 * never acted on) surface here so a delivery failure never becomes silent
 * data loss. See docs/RELIABILITY.md.
 */
export function MissedDoseCatchup() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const { t } = useTranslation();
  const [missed, setMissed] = useState<MissedDose[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<boolean>(() => {
    const map = readActed();
    const exp = map[ALL_SENTINEL];
    return typeof exp === "number" && exp > Date.now();
  });

  useEffect(() => {
    if (!userId || dismissed) return;
    let cancelled = false;
    (async () => {
      const now = Date.now();
      const since = new Date(now - 24 * 60 * 60 * 1000).toISOString();
      const until = new Date(now - 60 * 60 * 1000).toISOString();
      const [{ data: doses }, { data: logRows }] = await Promise.all([
        supabase
          .from("medication_doses")
          .select("id, scheduled_at, status, medication:medications(name)")
          .eq("user_id", userId)
          .eq("status", "pending")
          .gte("scheduled_at", since)
          .lte("scheduled_at", until)
          .order("scheduled_at", { ascending: false })
          .limit(10),
        supabase
          .from("notification_delivery_log")
          .select("dose_id")
          .eq("user_id", userId)
          .gte("scheduled_at", since)
          .not("fired_at", "is", null),
      ]);
      if (cancelled) return;
      const firedDoseIds = new Set((logRows ?? []).map((r) => r.dose_id));
      const acted = readActed();
      const silent = ((doses ?? []) as unknown as MissedDose[]).filter(
        (d) => !firedDoseIds.has(d.id) && !(d.id in acted),
      );
      setMissed(silent);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, dismissed]);

  if (dismissed || missed.length === 0) return null;

  const first = missed[0];
  const medName = first.medication?.name ?? t("doseCatchup.fallbackMed");
  const when = format(new Date(first.scheduled_at), "h:mmaaa");

  const act = async (doseId: string, status: "taken" | "skipped") => {
    setBusy(doseId);
    // Optimistically suppress so navigation/refresh can't bring it back.
    rememberDose(doseId, DOSE_TTL_MS);
    setMissed((prev) => prev.filter((d) => d.id !== doseId));
    const { error } = await supabase
      .from("medication_doses")
      .update(status === "taken" ? { status, taken_at: new Date().toISOString() } : { status })
      .eq("id", doseId)
      .eq("user_id", userId!);
    setBusy(null);
    if (error) {
      toast.error(t("doseCatchup.updateFailed"));
      return;
    }
    void cancelDoseReminder(doseId);
  };

  const dismiss = () => {
    setDismissed(true);
    rememberDose(ALL_SENTINEL, ALL_TTL_MS);
  };

  return (
    <div className="mb-6 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="rounded-full bg-secondary p-2 text-secondary-foreground shrink-0">
          <Pill className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-foreground">
            {t("doseCatchup.body", { time: when, med: medName })}
          </p>
          {missed.length > 1 && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("doseCatchup.more", { count: missed.length - 1 })}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              disabled={busy === first.id}
              onClick={() => void act(first.id, "taken")}
            >
              {t("doseCatchup.tookIt")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-full"
              disabled={busy === first.id}
              onClick={() => void act(first.id, "skipped")}
            >
              {t("doseCatchup.missedIt")}
            </Button>
            <Link to="/meds" className="text-sm text-primary hover:underline">
              {t("doseCatchup.review")}
            </Link>
            <button
              type="button"
              onClick={dismiss}
              className="ml-auto text-xs text-muted-foreground hover:text-foreground"
            >
              {t("doseCatchup.notNow")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
