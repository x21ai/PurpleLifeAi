import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Mic, Camera, Pencil } from "lucide-react";

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
  const greeting =
    !now
      ? "Hi"
      : hour < 5
        ? "Still up"
        : hour < 12
          ? "Good morning"
          : hour < 18
            ? "Good afternoon"
            : "Good evening";

  return (
    <div className="mx-auto max-w-2xl px-5 sm:px-8 pt-10 sm:pt-16 pb-12">
      <p className="text-sm text-muted-foreground" suppressHydrationWarning>
        {now ? format(now, "EEEE, MMMM d") : "\u00a0"}
      </p>
      <h1
        className="font-serif text-4xl sm:text-5xl leading-tight mt-2 text-foreground"
        suppressHydrationWarning
      >
        {greeting}. How&rsquo;s today feeling?
      </h1>
      <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl">
        Write a line, hold to speak, or tap to add a photo. I&rsquo;ll remember the rest.
      </p>

      <div className="mt-10 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="rounded-xl bg-secondary/60 p-4 sm:p-5">
          <p className="font-serif text-lg text-secondary-foreground">
            Nothing yet today.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            When you&rsquo;re ready, anything is enough. A word. A feeling. A photo of a meal.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
          <CaptureHint icon={Pencil} label="Write" />
          <CaptureHint icon={Mic} label="Speak" />
          <CaptureHint icon={Camera} label="Photo" />
        </div>
      </div>

      <p className="mt-10 text-xs text-muted-foreground/80 font-serif italic text-center">
        Purple listens, never judges.
      </p>
    </div>
  );
}

function CaptureHint({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-border py-4 text-muted-foreground">
      <Icon className="h-5 w-5" />
      <span className="text-xs">{label}</span>
    </div>
  );
}