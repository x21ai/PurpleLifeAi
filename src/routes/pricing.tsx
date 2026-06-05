import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/layout/site-footer";
import { MarketingHeader } from "@/components/layout/marketing-header";
import mistImg from "@/assets/hero-readiness-mist.jpg";
import coastImg from "@/assets/hero-readiness-coast.jpg";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing. Purple." },
      {
        name: "description",
        content:
          "Purple is free forever. No ads, no selling your data, no third-party trackers. Funded by goodwill, not by you.",
      },
      { property: "og:title", content: "Pricing. Purple." },
      { property: "og:description", content: "Free forever. No ads. No selling your data." },
      { property: "og:url", content: "https://www.purplelife.org/pricing" },
    ],
    links: [{ rel: "canonical", href: "https://www.purplelife.org/pricing" }],
  }),
  component: PricingPage,
});

const included = [
  "Unlimited journal entries — text, voice, photo, video",
  "Daily AI risk forecast tailored to your history",
  "Unified timeline with filters and free-text search",
  "Medication tracking, reminders, adherence, refills",
  "Seizure log with backdating",
  "Oura, Whoop & Apple Health biometrics",
  "Ask Purple — choose Gemini Flash, Pro, or Claude Sonnet",
  "Caregiver sharing with read-only by default",
  "Travel mode that shifts your meds across time zones",
  "Community access",
  "Export everything to JSON or PDF — delete any time",
];

function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />

      <main>
        {/* Hero — soft mist */}
        <section className="relative">
          <div className="relative h-[64vh] min-h-[420px] max-h-[720px] w-full overflow-hidden">
            <img
              src={mistImg}
              alt="Soft morning mist over a quiet field."
              className="absolute inset-0 h-full w-full object-cover"
              width={1920}
              height={1080}
              fetchPriority="high"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-foreground/30 via-foreground/10 to-foreground/55" />
            <div className="absolute inset-0 flex items-end">
              <div className="mx-auto w-full max-w-6xl px-6 sm:px-10 pb-14 sm:pb-20">
                <p className="label-eyebrow" style={{ color: "var(--background)", opacity: 0.85 }}>
                  Pricing
                </p>
                <h1
                  className="mt-5 font-serif text-5xl sm:text-7xl leading-[1.02] tracking-tight"
                  style={{ color: "var(--background)" }}
                >
                  Free.<br />Forever.
                </h1>
                <p
                  className="mt-6 text-base sm:text-lg max-w-xl leading-relaxed"
                  style={{ color: "var(--background)", opacity: 0.85 }}
                >
                  Health tools shouldn't come with a paywall. Purple is funded by goodwill,
                  not by you.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* The card — quieter, more editorial */}
        <section className="mx-auto max-w-4xl px-6 sm:px-10 py-24 sm:py-32">
          <div className="grid lg:grid-cols-[1fr_1.4fr] gap-12 lg:gap-16 items-start">
            <div>
              <p className="label-eyebrow">Everything included</p>
              <p className="mt-4 font-serif text-7xl sm:text-8xl leading-none">$0</p>
              <p className="mt-2 text-base text-muted-foreground">forever, for everyone</p>
              <div className="mt-8">
                <Button asChild className="h-12 px-7 text-base rounded-full">
                  <Link to="/sign-up">Create your free account</Link>
                </Button>
              </div>
              <p className="mt-6 text-xs text-muted-foreground max-w-xs leading-relaxed">
                No credit card. No trial. No surprise charges. Just Purple, the way you'd want it
                for someone you love.
              </p>
            </div>
            <ul className="space-y-4">
              {included.map((i) => (
                <li key={i} className="flex gap-3 border-t border-border pt-4 first:border-t-0 first:pt-0">
                  <Check className="h-5 w-5 text-[color:var(--purple-primary)] shrink-0 mt-0.5" />
                  <span className="text-base text-foreground leading-relaxed">{i}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Why free — quiet promise */}
        <section className="relative overflow-hidden">
          <div className="relative h-[58vh] min-h-[400px] w-full">
            <img
              src={coastImg}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              width={1920}
              height={1080}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-foreground/50" />
            <div className="absolute inset-0 flex items-center">
              <div className="mx-auto max-w-3xl px-6 sm:px-10 text-center">
                <h2
                  className="font-serif text-4xl sm:text-6xl leading-[1.05] tracking-tight"
                  style={{ color: "var(--background)" }}
                >
                  Funded by goodwill.
                </h2>
                <p
                  className="mt-6 text-base sm:text-lg max-w-xl mx-auto leading-relaxed"
                  style={{ color: "var(--background)", opacity: 0.85 }}
                >
                  Open source on GitHub. No ads. No selling your data. No third-party trackers,
                  ever. The product is the product — not you.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-2xl px-6 sm:px-10 py-28 sm:py-40 text-center">
          <h2 className="font-serif text-4xl sm:text-5xl leading-[1.05] tracking-tight">
            Begin today.
          </h2>
          <div className="mt-10">
            <Button asChild className="h-12 px-7 text-base rounded-full">
              <Link to="/sign-up">Create your free account</Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter variant="marketing" />
    </div>
  );
}