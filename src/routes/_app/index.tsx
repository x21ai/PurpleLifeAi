import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Mic, Camera, Pencil, Zap } from "lucide-react";
import { TodayDoses } from "@/components/meds/today-doses";
import { TodayBiometrics } from "@/components/biometrics/today-biometrics";
import { HeroScoreCard } from "@/components/today/hero-score-card";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      { title: "Today — Purple" },
      { name: "description", content: "Your calm space to capture what's happening today." },
    ],
  }),
  component: TodayPage,
});

function TodayPage() {
  // Render-stable across SSR/client; fill in on mount to avoid hydration mismatch.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
  }, []);

  const hour = now?.getHours() ?? -1;
  const greeting = !now
    ? "Hi"
    : hour < 5
      ? "Still up"
      : hour < 12
        ? "Good morning"
        : hour < 18
          ? "Good afternoon"
          : "Good evening";

  return (
    <div className="mx-auto max-w-2xl px-5 sm:px-8 pt-8 sm:pt-12 pb-12">
      <p className="label-eyebrow" suppressHydrationWarning>
        {now ? format(now, "EEEE, MMMM d") : "\u00a0"}
      </p>
      <h1
        className="font-serif text-4xl sm:text-6xl leading-[1.05] tracking-tight mt-4 text-foreground"
        suppressHydrationWarning
      >
        <span suppressHydrationWarning>{greeting}</span>. How&rsquo;s today feeling?
      </h1>

      <HeroScoreCard />

      <div className="mt-6 grid grid-cols-4 gap-2">
        <CaptureHint icon={Pencil} label="Write" to="/journal" />
        <CaptureHint icon={Mic} label="Speak" to="/journal" />
        <CaptureHint icon={Camera} label="Photo" to="/journal" />
        <CaptureHint icon={Zap} label="Seizure" to="/seizures/new" tone="accent" />
      </div>

      <TodayBiometrics />
      <TodayDoses />

      <p className="mt-12 text-xs text-muted-foreground/80 font-serif italic text-center">
        Purple listens, never judges.
      </p>
    </div>
  );
}

function CaptureHint({
  icon: Icon,
  label,
  to,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  to: "/journal" | "/seizures/new";
  tone?: "accent";
}) {
  const accent = tone === "accent";
  return (
    <Link
      to={to}
      className={
        "flex flex-col items-center gap-1.5 rounded-2xl border bg-card py-4 transition hover:border-foreground/30 " +
        (accent
          ? "border-[color:var(--accent)]/40 text-[color:var(--accent)]"
          : "border-border text-muted-foreground")
      }
    >
      <Icon className="h-5 w-5" />
      <span className="text-[11px] tracking-wide uppercase">{label}</span>
    </Link>
  );
}