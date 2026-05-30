import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/layout/site-footer";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing. Purple." },
      { name: "description", content: "Purple is free forever. No ads. No selling your data." },
      { property: "og:title", content: "Pricing. Purple." },
      { property: "og:description", content: "Free forever." },
    ],
    links: [{ rel: "canonical", href: "/pricing" }],
  }),
  component: PricingPage,
});

const included = [
  "Unlimited journal entries (text, voice, photo, video)",
  "Daily AI risk forecast",
  "Unified timeline with filters and search",
  "Medication tracking, reminders, adherence",
  "Seizure log with backdating",
  "Oura biometrics integration",
  "Ask Purple. Choose your AI model.",
  "Community access",
  "Export everything, delete anytime",
];

function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border">
        <div className="mx-auto max-w-6xl px-6 sm:px-10 h-16 flex items-center justify-between">
          <Link to="/" className="wordmark text-[14px]">Purple</Link>
          <Button asChild size="sm"><Link to="/sign-up">Get started</Link></Button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 sm:px-10 py-16 sm:py-24 text-center">
        <p className="label-eyebrow">Pricing</p>
        <h1 className="mt-4 font-serif text-4xl sm:text-5xl lg:text-6xl tracking-tight">Free. Forever.</h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
          Health tools shouldn&rsquo;t come with a paywall. Purple is funded by goodwill, not your data.
        </p>
        <div className="mt-12 rounded-2xl border border-border bg-card p-8 text-left max-w-md mx-auto">
          <p className="label-eyebrow">Everything included</p>
          <p className="mt-3 font-serif text-5xl">$0<span className="text-xl text-muted-foreground">/forever</span></p>
          <ul className="mt-6 space-y-3 text-sm">
            {included.map((i) => (
              <li key={i} className="flex gap-2">
                <Check className="h-4 w-4 text-[color:var(--purple-primary)] shrink-0 mt-0.5" />
                <span>{i}</span>
              </li>
            ))}
          </ul>
          <Button asChild className="mt-8 w-full h-12 rounded-xl"><Link to="/sign-up">Create account</Link></Button>
        </div>
      </main>
      <SiteFooter variant="marketing" />
    </div>
  );
}