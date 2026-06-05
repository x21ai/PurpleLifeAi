import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, BookOpen, Clock, TrendingUp, Shield, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/layout/site-footer";
import { useEffect } from "react";
import { captureInviteFromUrl } from "@/lib/invite-storage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Purple. A quiet companion for your health." },
      {
        name: "description",
        content:
          "A private health journal for people living with conditions that need daily attention. Epilepsy. Migraine. Diabetes. Mental health. And more. Write it, say it, snap it. Purple remembers.",
      },
      { property: "og:title", content: "Purple. A quiet companion for your health." },
      {
        property: "og:description",
        content: "Free forever. Open source. Your data stays yours.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              name: "Purple",
              url: "https://purplelife.org",
              logo: "https://purplelife.org/icon-512.png",
              sameAs: ["https://purplelife.lovable.app"],
            },
            {
              "@type": "WebSite",
              name: "Purple",
              url: "https://purplelife.org",
            },
            {
              "@type": "SoftwareApplication",
              name: "Purple",
              applicationCategory: "HealthApplication",
              operatingSystem: "Web",
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
              description:
                "Private, AI-powered health journal for people living with epilepsy, migraine, diabetes, mental health, and other pattern-driven conditions.",
            },
          ],
        }),
      },
    ],
  }),
  component: MarketingHome,
});

function MarketingHome() {
  useEffect(() => {
    captureInviteFromUrl();
  }, []);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-5xl px-6 sm:px-10 pt-16 sm:pt-24 lg:pt-32 pb-16 sm:pb-24 text-center">
          <p className="label-eyebrow">Free forever · Open source</p>
          <h1 className="mt-6 font-serif text-4xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-tight">
            Your health,
            <br />
            remembered.
          </h1>
          <p className="mt-8 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            A private journal for people living with conditions that take daily attention.
            Epilepsy. Migraine. Diabetes. Mental health. And more.
            Write it. Say it. Snap it. Purple keeps it, and helps you see what matters.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild className="h-12 px-7 text-base rounded-xl">
              <Link to="/sign-up">
                Get started. Free. <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-12 px-7 text-base rounded-xl">
              <Link to="/features">See how it works</Link>
            </Button>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            No ads. No selling your data. Ever.
          </p>
        </section>

        {/* Feature grid */}
        <section id="features" className="mx-auto max-w-6xl px-6 sm:px-10 py-16 sm:py-24 border-t border-border">
          <h2 className="font-serif text-3xl sm:text-4xl text-center">What Purple does for you</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={BookOpen}
              title="Capture everything"
              body="Text, voice, photos, video. Log a moment in seconds. Purple tags and summarizes so nothing gets lost."
            />
            <FeatureCard
              icon={Sparkles}
              title="Ask Purple anything"
              body="A floating bubble on every screen. Ask about your sleep, your meds, your patterns. Purple knows your history."
            />
            <FeatureCard
              icon={Clock}
              title="See the full picture"
              body="One timeline of symptoms, meds, journal moments, and biometrics. Filter by day, week, month, or year."
            />
            <FeatureCard
              icon={TrendingUp}
              title="Notice patterns early"
              body="Daily insights based on sleep, HRV, missed doses, and triggers from your own history."
            />
            <FeatureCard
              icon={Shield}
              title="Your data stays yours"
              body="Encrypted at rest. Export or delete anything. Sharing only when you choose."
            />
            <FeatureCard
              icon={Users}
              title="A community that gets it"
              body="A safe, moderated space to share, vent, and find resources with others walking the same path."
            />
          </div>
        </section>

        {/* For who */}
        <section className="mx-auto max-w-4xl px-6 sm:px-10 py-16 sm:py-24 border-t border-border text-center">
          <h2 className="font-serif text-3xl sm:text-4xl">Built for you, with you</h2>
          <p className="mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed">
            If you live with a chronic condition, care for someone who does, or simply want a calm
            place to track how your body feels day to day, Purple is for you. We built it because
            the alternatives felt cold, clinical, and overwhelming. Purple is warm, quiet, and patient.
          </p>
          <div className="mt-10">
            <Button asChild className="h-12 px-7 text-base rounded-xl">
              <Link to="/sign-up">
                Create your free account
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter variant="marketing" />
    </div>
  );
}

function MarketingHeader() {
  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border">
      <div className="mx-auto max-w-6xl px-6 sm:px-10 h-16 flex items-center justify-between">
        <Link to="/" className="wordmark text-[14px] text-foreground" aria-label="Purple home">
          Purple
        </Link>
        <nav className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
          <Link to="/features" className="hover:text-foreground transition-colors">Features</Link>
          <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
          <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
          <Link to="/community" className="hover:text-foreground transition-colors">Community</Link>
          <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/sign-in"
            className="text-sm text-muted-foreground hover:text-foreground px-3 py-2"
          >
            Sign in
          </Link>
          <Button asChild size="sm" className="rounded-lg">
            <Link to="/sign-up">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <article className="rounded-2xl border border-border bg-card p-6">
      <Icon className="h-6 w-6 text-[color:var(--purple-primary)]" />
      <h3 className="mt-4 font-serif text-xl text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
    </article>
  );
}