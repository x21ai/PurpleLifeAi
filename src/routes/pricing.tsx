import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/layout/site-footer";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { CalmHero, CalmBand, HumanMoment } from "@/components/marketing/calm-scene";
import { pricingImages } from "@/lib/calm-images";
import { useRevealOnScroll } from "@/hooks/use-reveal-on-scroll";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Free. Forever. Purple." },
      {
        name: "description",
        content:
          "Purple is free forever. No ads, no selling your data, no third-party trackers. Because nobody should pay to remember their own life.",
      },
      { property: "og:title", content: "Free. Forever. Purple." },
      {
        property: "og:description",
        content: "Nobody should pay to remember their own life.",
      },
      { property: "og:url", content: "https://www.purplelife.org/pricing" },
    ],
    links: [{ rel: "canonical", href: "https://www.purplelife.org/pricing" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: "Purple",
          description:
            "Private health journal for people living with conditions that need daily attention.",
          brand: { "@type": "Organization", name: "Purple" },
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
            url: "https://www.purplelife.org/pricing",
          },
        }),
      },
    ],
  }),
  component: PricingPage,
});

const included = [
  "Unlimited journal entries, text, voice, photo, video",
  "Daily AI risk forecast tailored to your history",
  "Unified timeline with filters and free-text search",
  "Medication tracking, reminders, adherence, refills",
  "Seizure log with backdating",
  "Oura, Whoop & Apple Health biometrics",
  "Ask Purple, choose Gemini Flash, Pro, or Claude Sonnet",
  "Caregiver sharing with read-only by default",
  "Travel mode that shifts your meds across time zones",
  "Community access",
  "Export everything to JSON or PDF, delete any time",
];

function PricingPage() {
  useRevealOnScroll();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />

      <main>
        {/* Hero, mist */}
        <CalmHero
          image={pricingImages.hero}
          priority
          eyebrow="Pricing"
          headline={<>Free.<br />Forever.</>}
          body="Health tools shouldn&rsquo;t come with a paywall. Purple is funded by goodwill, not by you."
        />

        {/* The card, quieter, more editorial */}
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

        {/* The human reason it's free */}
        <HumanMoment
          image={pricingImages.pillTray}
          quote="Because nobody should pay to remember their own life."
          attribution="Why Purple is free"
        />

        {/* Quiet promise band */}
        <CalmBand
          image={pricingImages.hero}
          headline="Funded by goodwill."
          body="Open source on GitHub. No ads. No selling your data. No third-party trackers, ever. The product is the product, not you."
        />

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