import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Activity, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { useTranslation } from "react-i18next";

const DISMISS_KEY = "purple-wearables-card-dismissed";
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Gentle nudge to connect a wearable, shown on Today from day 2 onward
 * (wearables were moved out of onboarding). Hidden once a device is
 * connected or the card is dismissed.
 */
export function ConnectWearablesCard() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const { t } = useTranslation();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!userId) return;
    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      /* ignore */
    }
    let cancelled = false;
    (async () => {
      const [{ data: profile }, { data: oura }, { data: whoop }] = await Promise.all([
        supabase.from("profiles").select("onboarded_at").eq("id", userId).maybeSingle(),
        supabase.from("oura_tokens").select("user_id").eq("user_id", userId).maybeSingle(),
        supabase.from("whoop_tokens").select("user_id").eq("user_id", userId).maybeSingle(),
      ]);
      if (cancelled) return;
      const onboardedAt = profile?.onboarded_at ? new Date(profile.onboarded_at).getTime() : null;
      const dayTwo = onboardedAt != null && Date.now() - onboardedAt >= DAY_MS;
      setShow(dayTwo && !oura && !whoop);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!show) return null;

  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="relative rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
      <span className="rounded-full bg-secondary p-2 text-secondary-foreground shrink-0">
        <Activity className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground">{t("today.wearablesNudge")}</p>
        <Link to="/tools" className="mt-1 inline-block text-sm text-primary hover:underline">
          {t("today.wearablesNudgeAction")}
        </Link>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t("today.dismiss")}
        className="absolute top-3 right-3 rounded-md p-1 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
