import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouteTheme } from "@/lib/use-route-theme";
import { listHydrationForDay } from "@/lib/hydration.functions";
import { listAurasForDay } from "@/lib/auras.functions";
import { HydrationTimeline, type HydrationRow } from "@/components/hydration/hydration-timeline";
import { QuickAddWater } from "@/components/hydration/quick-add-water";
import { LogAuraSheet } from "@/components/hydration/log-aura-sheet";
import { Button } from "@/components/ui/button";
import { MedicalDisclaimer } from "@/components/common/medical-disclaimer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { useFeatureFlags } from "@/hooks/use-feature-flags";

export const Route = createFileRoute("/_app/hydration")({
  head: () => ({
    meta: [
      { title: "Hydration & auras — Purple" },
      { name: "description", content: "Track water, electrolytes, and aura warnings throughout the day." },
    ],
  }),
  component: HydrationPage,
});

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function fmtDay(d: Date) {
  const today = startOfDay(new Date());
  const day = startOfDay(d);
  const diff = Math.round((today.getTime() - day.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

function HydrationPage() {
  useRouteTheme("dark");
  const [day, setDay] = useState<Date>(() => startOfDay(new Date()));
  const { session } = useAuth();
  const userId = session?.user.id;
  const flags = useFeatureFlags();
  const showAura = flags.enabled("aura");

  const from = day.toISOString();
  const to = new Date(day.getTime() + 86400000).toISOString();

  const listH = useServerFn(listHydrationForDay);
  const listA = useServerFn(listAurasForDay);

  const hydration = useQuery({
    queryKey: ["hydration", day.toISOString()],
    queryFn: () => listH({ data: { from, to } }),
  });
  const auras = useQuery({
    queryKey: ["auras", day.toISOString()],
    queryFn: () => listA({ data: { from, to } }),
    enabled: showAura,
  });

  const goal = useQuery({
    queryKey: ["profile", "water-goal", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("daily_water_goal_ml")
        .eq("id", userId!)
        .maybeSingle();
      return (data as any)?.daily_water_goal_ml ?? 2000;
    },
  });

  const isToday = day.toDateString() === new Date().toDateString();

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-10 lg:px-16 pt-8 sm:pt-12 pb-32">
      <Link to="/today" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <p className="mt-8 label-eyebrow text-muted-foreground">Hydration & auras</p>
      <h1 className="mt-2 font-serif text-[40px] sm:text-5xl leading-[1.05] tracking-[-0.02em]">
        {showAura ? <>Water, salt,<br/>and warning signs.</> : <>Water and<br/>electrolytes.</>}
      </h1>
      <p className="mt-3 text-sm text-muted-foreground max-w-lg">
        {showAura
          ? "Track every drink to the minute and capture déjà vu the moment it happens. Patterns often hide in plain sight."
          : "Track every drink to the minute. Patterns often hide in plain sight."}
      </p>

      {/* Day navigator */}
      <div className="mt-8 flex items-center justify-between rounded-full ring-1 ring-border bg-card px-2 py-1.5">
        <Button
          variant="ghost" size="sm"
          onClick={() => setDay((d) => new Date(d.getTime() - 86400000))}
          className="rounded-full"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium tabular-nums">{fmtDay(day)}</span>
        <Button
          variant="ghost" size="sm"
          onClick={() => setDay((d) => startOfDay(new Date(Math.min(Date.now(), d.getTime() + 86400000))))}
          className="rounded-full"
          disabled={isToday}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick actions */}
      {isToday && (
        <div className="mt-6 space-y-3">
          <QuickAddWater />
          {showAura && <div><LogAuraSheet /></div>}
        </div>
      )}

      <div className="mt-6">
        <HydrationTimeline
          day={day}
          hydration={(hydration.data ?? []) as HydrationRow[]}
          auras={showAura ? (auras.data ?? []) : []}
          goalMl={goal.data ?? 2000}
        />
      </div>

      <div className="mt-8">
        <MedicalDisclaimer />
      </div>
    </div>
  );
}