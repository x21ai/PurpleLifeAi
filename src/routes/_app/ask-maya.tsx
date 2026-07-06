import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Upload, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { useRouteTheme } from "@/lib/use-route-theme";
import { getSuggestedQuestions, getTodayGreeting } from "@/lib/condition-prompts";
import { useCareProfile } from "@/hooks/use-care-profile";
import { AppPage } from "@/components/layout/app-page";

export const Route = createFileRoute("/_app/ask-maya")({
  head: () => ({
    meta: [
      { title: "Ask Maya · Purple" },
      { name: "description", content: "Ask Maya about your health patterns and data." },
    ],
  }),
  component: AskMayaPage,
});

function AskMayaPage() {
  useRouteTheme("dark");
  const navigate = useNavigate();
  const { session } = useAuth();
  const userId = session?.user.id;
  const [firstName, setFirstName] = useState<string | null>(null);
  const [conditions, setConditions] = useState<string[] | null>(null);
  const careProfile = useCareProfile();

  useEffect(() => {
    if (!userId) return;
    void supabase
      .from("profiles")
      .select("first_name, conditions")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        setFirstName(data?.first_name ?? null);
        setConditions(data?.conditions ?? []);
      });
  }, [userId]);

  const starters = useMemo(() => {
    if (careProfile?.askPurpleStarters?.length) {
      return careProfile.askPurpleStarters.slice(0, 5);
    }
    return getSuggestedQuestions(conditions).slice(0, 5);
  }, [conditions, careProfile]);

  const greetingName = firstName?.trim() || "there";
  const hour = new Date().getHours();
  const todayGreeting = getTodayGreeting(conditions, hour);
  const greetingWord =
    hour < 5 ? "Still up" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const openChat = (prefill?: string) => {
    if (prefill) {
      try {
        sessionStorage.setItem("purple-chat-prefill", prefill);
      } catch {
        /* ignore */
      }
    }
    void navigate({ to: "/chat" });
  };

  return (
    <AppPage width="lg" safeBottom="nav" className="px-5 sm:px-10 lg:px-16 pt-8 sm:pt-12 pb-32">
      <p className="label-eyebrow text-[color:var(--purple-primary)]">Ask Maya</p>
      <h1 className="mt-3 app-hero-title text-[32px] sm:text-[36px] text-foreground">
        {greetingWord}, {greetingName}.
      </h1>

      <div className="mt-5 glass-surface rounded-[20px] border-l-4 border-l-[color:var(--purple-primary)] p-4 sm:p-5">
        <p className="today-lede text-foreground/75">
          I know your conditions and wearable data. {todayGreeting.greetingSuffix}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {starters.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => openChat(prompt)}
            className="glass-press rounded-full border border-border/60 bg-secondary/30 px-4 py-2 text-left text-sm text-foreground hover:border-[color:var(--purple-primary)]/35"
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="mt-5 glass-surface rounded-[20px] p-4 sm:p-5">
        <p className="text-sm font-semibold text-foreground">Upload past labs</p>
        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
          Add PDF lab reports to populate report_metrics and unlock biomarker trends.
        </p>
        <Link
          to="/reports/new"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-[color:var(--purple-primary)] px-4 py-2 text-sm font-medium text-white"
        >
          <Upload className="h-4 w-4" />
          Go to Reports upload
        </Link>
      </div>

      <button
        type="button"
        onClick={() => openChat()}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-[color:var(--purple-primary)]/40 bg-[color:var(--purple-primary)]/10 py-3 text-sm font-medium text-foreground hover:bg-[color:var(--purple-primary)]/18"
      >
        <MessageCircle className="h-4 w-4 text-[color:var(--purple-primary)]" />
        Open chat with Maya
      </button>
    </AppPage>
  );
}
