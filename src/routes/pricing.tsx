import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/layout/site-footer";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { useRevealOnScroll } from "@/hooks/use-reveal-on-scroll";
import { useIsPro } from "@/lib/pro-gate";
import { marketingHead } from "@/lib/marketing-seo";

export const Route = createFileRoute("/pricing")({
  head: () =>
    marketingHead({
      path: "/pricing",
      title: "Pricing · Purple",
      description:
        "Purple is free for everyone right now. Two simple plans for the future: Free, and Pro at $9.99/month or $99/year for DNA insights, unlimited Ask Purple, sharing, and unlimited caregivers.",
      ogDescription: "Free for everyone right now. Two plans for the future.",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Product",
        name: "Purple",
        description:
          "Private health journal for people living with conditions that need daily attention.",
        brand: { "@type": "Organization", name: "Purple" },
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "USD",
          lowPrice: "0",
          highPrice: "99",
          offerCount: 3,
          url: "https://www.purplelife.org/pricing",
          offers: [
            { "@type": "Offer", name: "Free", price: "0", priceCurrency: "USD" },
            { "@type": "Offer", name: "Pro Monthly", price: "9.99", priceCurrency: "USD" },
            { "@type": "Offer", name: "Pro Yearly", price: "99", priceCurrency: "USD" },
          ],
        },
      },
    }),
  component: PricingPage,
});

const freeFeatures = [
  "Unlimited journal entries, text, voice, photo, video",
  "Daily AI risk forecast tailored to your history",
  "Unified timeline with filters and free-text search",
  "Medication tracking, reminders, adherence, refills",
  "Seizure log with backdating",
  "Oura, Whoop & Apple Health biometrics",
  "Ask Purple, up to 10 messages per day",
  "One caregiver, read-only by default",
  "Travel mode that shifts your meds across time zones",
  "Export everything to JSON or PDF, any time",
];

const proFeatures = [
  "Everything in Free",
  "DNA upload & curated trait insights",
  "Unlimited Ask Purple",
  "Share medical reports with clinicians",
  "Schedule monthly auto-reports",
  "Unlimited caregivers",
  "Priority support",
];

const faqs: Array<{ q: string; a: string }> = [
  {
    q: "Is Purple really free right now?",
    a: "Yes. Every signed-in user, new or existing, has full Pro access today. No payment, no trial, no card on file.",
  },
  {
    q: "What happens when paid plans turn on?",
    a: "We'll announce it in-app well before any change. Your data stays yours, your free features stay free, and you'll only see Pro prompts on the four Pro-only surfaces: DNA insights, unlimited Ask Purple, report sharing, and additional caregivers.",
  },
  {
    q: "Can I cancel any time?",
    a: "Yes. When paid plans go live, you'll cancel from your account in one click. No phone calls, no retention scripts.",
  },
  {
    q: "Do you sell my data?",
    a: "No. No ads, no third-party trackers, no selling. The product is the product, not you.",
  },
  {
    q: "Is Purple open source?",
    a: "The Purple app is built in the open and you can self-host the core. Get in touch if you want the bundle.",
  },
];

function PricingPage() {
  useRevealOnScroll();
  const { freeForEveryone, loading } = useIsPro();
  const [interval, setInterval] = React.useState<"monthly" | "yearly">("yearly");
  // Default to "show banner" during SSR/initial load so the static prerender carries the message.
  const showFreeBanner = loading || freeForEveryone;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />
      <main>
        {/* Hero */}
        <section className="mx-auto max-w-4xl px-6 sm:px-10 pt-24 sm:pt-32 pb-12 text-center">
          <p className="label-eyebrow text-muted-foreground">Pricing</p>
          <h1 className="mt-4 font-serif text-5xl sm:text-7xl leading-[1.02] tracking-[-0.02em]">
            Simple plans.<br />Honest pricing.
          </h1>
          <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
            Purple is free for everyone right now. The plans below are how we&rsquo;ll keep the lights on later, with plenty of notice.
          </p>
          {showFreeBanner && (
            <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-[color:var(--purple-primary)]/15 px-4 py-2 text-sm font-medium text-[color:var(--purple-primary)]">
              <Sparkles className="h-4 w-4" /> Free for everyone &middot; no payment needed today
            </div>
          )}
        </section>

        {/* Pricing cards */}
        <section className="mx-auto max-w-5xl px-6 sm:px-10 pb-20">
          {/* Monthly/Yearly toggle */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex items-center rounded-full border border-border bg-card p-1 text-sm">
              <button
                type="button"
                onClick={() => setInterval("monthly")}
                className={`px-4 py-1.5 rounded-full transition ${interval === "monthly" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setInterval("yearly")}
                className={`px-4 py-1.5 rounded-full transition ${interval === "yearly" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
              >
                Yearly <span className="ml-1 text-[10px] uppercase tracking-wider opacity-70">save 17%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Free card */}
            <div className="rounded-3xl border border-border bg-card p-8">
              <p className="label-eyebrow text-muted-foreground">Free</p>
              <p className="mt-4 font-serif text-6xl leading-none">$0</p>
              <p className="mt-2 text-sm text-muted-foreground">forever, for everyone</p>
              <Button asChild variant="outline" className="mt-6 w-full h-11 rounded-full">
                <Link to="/sign-up">Get started free</Link>
              </Button>
              <ul className="mt-8 space-y-3">
                {freeFeatures.map((f) => (
                  <li key={f} className="flex gap-3 text-sm leading-relaxed">
                    <Check className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro card */}
            <div className="rounded-3xl border-2 border-[color:var(--purple-primary)] bg-card p-8 relative">
              <div className="absolute -top-3 left-8 inline-flex items-center gap-1.5 rounded-full bg-[color:var(--purple-primary)] px-3 py-1 text-[11px] uppercase tracking-wider text-white">
                <Sparkles className="h-3 w-3" /> Pro
              </div>
              <p className="label-eyebrow text-[color:var(--purple-primary)]">Purple Pro</p>
              <p className="mt-4 font-serif text-6xl leading-none">
                {interval === "monthly" ? "$9.99" : "$99"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {interval === "monthly" ? "per month" : "per year · save 17%"}
              </p>
              {showFreeBanner ? (
                <Button disabled className="mt-6 w-full h-11 rounded-full">
                  You&rsquo;re on Pro today
                </Button>
              ) : (
                <Button asChild className="mt-6 w-full h-11 rounded-full">
                  <Link to="/account">Upgrade to Pro</Link>
                </Button>
              )}
              <ul className="mt-8 space-y-3">
                {proFeatures.map((f) => (
                  <li key={f} className="flex gap-3 text-sm leading-relaxed">
                    <Check className="h-4 w-4 text-[color:var(--purple-primary)] shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-6 sm:px-10 pb-28">
          <h2 className="font-serif text-3xl sm:text-4xl tracking-[-0.01em]">Questions</h2>
          <div className="mt-8 divide-y divide-border border-y border-border">
            {faqs.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-4 text-base font-medium">
                  <span>{f.q}</span>
                  <span className="text-muted-foreground transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-2xl px-6 sm:px-10 pb-32 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl tracking-[-0.01em]">Begin today.</h2>
          <p className="mt-3 text-sm text-muted-foreground">Free for everyone. No card needed.</p>
          <div className="mt-8">
            <Button asChild className="h-12 px-7 text-base rounded-full">
              <Link to="/sign-up">Create your free account</Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}