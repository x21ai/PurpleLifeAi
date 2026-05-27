import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Sparkles, Clock, TrendingUp, Pill, Zap, Activity, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/layout/site-footer";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — Purple" },
      { name: "description", content: "Everything Purple can do: media journal, AI patterns, timeline, meds, biometrics, and community." },
      { property: "og:title", content: "Features — Purple" },
      { property: "og:description", content: "Everything Purple can do." },
    ],
    links: [{ rel: "canonical", href: "/features" }],
  }),
  component: FeaturesPage,
});

const features = [
  { icon: BookOpen, title: "Multi-modal journal", body: "Write, dictate, snap a photo, or record a 60s video. Purple transcribes voice, tags photos, and summarises everything into a clean entry." },
  { icon: Sparkles, title: "Ask Purple", body: "A floating bubble on every screen. Choose Gemini Flash, Gemini Pro, or Claude Sonnet from settings. Purple reads your history before answering — always with a 'confirm to write' step before changing anything." },
  { icon: Clock, title: "Unified timeline", body: "All seizures, meds, journal entries, and biometrics in one feed. Filter by day, week, month, year, or search free text." },
  { icon: TrendingUp, title: "Pattern detection", body: "Daily risk forecast that considers sleep, HRV, missed doses, menstrual phase, and your own trigger history." },
  { icon: Pill, title: "Smart meds", body: "Schedule reminders, track adherence, log side effects, set refill thresholds. Backdate old prescriptions to build full history." },
  { icon: Zap, title: "Seizure log", body: "Quick capture with type, duration, witnesses, recovery time, rescue meds. Backdate past episodes to fill in history." },
  { icon: Activity, title: "Biometrics", body: "Connect Oura for sleep, HRV, temperature deviation, SpO₂, respiratory rate. More wearables coming soon." },
  { icon: Shield, title: "Privacy first", body: "Encrypted at rest. Row-level security. Export to JSON or PDF. Delete your account and everything goes with it." },
];

function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border">
        <div className="mx-auto max-w-6xl px-6 sm:px-10 h-16 flex items-center justify-between">
          <Link to="/" className="wordmark text-[14px]">Purple</Link>
          <Button asChild size="sm"><Link to="/sign-up">Get started</Link></Button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 sm:px-10 py-16 sm:py-24">
        <p className="label-eyebrow">Features</p>
        <h1 className="mt-4 font-serif text-4xl sm:text-5xl lg:text-6xl leading-tight tracking-tight">
          Everything Purple does.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
          A complete, calm health companion for epilepsy and pattern-driven conditions.
        </p>
        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          {features.map((f) => (
            <article key={f.title} className="rounded-2xl border border-border bg-card p-6">
              <f.icon className="h-6 w-6 text-[color:var(--purple-primary)]" />
              <h2 className="mt-4 font-serif text-xl">{f.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.body}</p>
            </article>
          ))}
        </div>
        <div className="mt-16 text-center">
          <Button asChild className="h-12 px-7 text-base rounded-xl"><Link to="/sign-up">Try Purple free</Link></Button>
        </div>
      </main>
      <SiteFooter variant="marketing" />
    </div>
  );
}