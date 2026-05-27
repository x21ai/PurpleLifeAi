import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Eye, Brain, Lock, Sparkles } from "lucide-react";
import { useRouteTheme } from "@/lib/use-route-theme";

export const Route = createFileRoute("/_app/settings/how-purple-thinks")({
  head: () => ({ meta: [{ title: "How Purple thinks — Purple" }] }),
  component: HowPage,
});

function HowPage() {
  useRouteTheme("light");
  return (
    <div className="mx-auto max-w-2xl px-5 sm:px-10 pt-10 sm:pt-16 pb-24">
      <Link
        to="/settings"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Settings
      </Link>

      <p className="mt-6 label-eyebrow text-muted-foreground">How Purple thinks</p>
      <h1 className="mt-3 font-serif text-[40px] sm:text-5xl leading-[1.05] tracking-[-0.02em] text-foreground">
        Reads gently.<br />Acts only when you say.
      </h1>

      <div className="mt-10 space-y-6">
        <Card icon={<Eye className="h-4 w-4" />} title="What Purple sees">
          When you ask a question, Purple reads the last 7 days of biometrics,
          14 days of journal entries, 90 days of seizure events, your current
          medications, and the latest risk forecast. Nothing else.
        </Card>
        <Card icon={<Brain className="h-4 w-4" />} title="How patterns are found">
          Every night, a small job looks across 8 signals — sleep, HRV,
          temperature, activity, missed doses, mood, location, and seizure
          history — for repeating combinations. New patterns surface in
          <Link to="/insights" className="underline ml-1">Patterns</Link>.
        </Card>
        <Card icon={<Sparkles className="h-4 w-4" />} title="When Purple proposes an action">
          If Purple wants to add a medication, log a seizure, or change a
          setting on your behalf, it shows a Confirm card first. Nothing is
          written until you tap Confirm.
        </Card>
        <Card icon={<Lock className="h-4 w-4" />} title="What stays private">
          Your data lives in your account. Purple never trains models on it,
          never shares it with anyone, and you can export or delete everything
          from <Link to="/settings" className="underline">Settings → Data</Link>.
        </Card>
      </div>
    </div>
  );
}

function Card({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="flex items-center gap-2 font-serif text-lg text-foreground">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-secondary text-primary">
          {icon}
        </span>
        {title}
      </h2>
      <p className="mt-2 body-serif text-foreground/80 leading-relaxed">{children}</p>
    </section>
  );
}