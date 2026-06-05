import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/layout/site-footer";
import { useEffect } from "react";
import { captureInviteFromUrl } from "@/lib/invite-storage";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { CalmHero, CalmBand } from "@/components/marketing/calm-scene";
import { calmImages } from "@/lib/calm-images";

export const Route = createFileRoute("/home2")({
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
        {/* Hero — calm landscape, type fades onto the page */}
        <CalmHero
          image={calmImages.dawn}
          alt=""
          eyebrow="A quiet companion for your health"
          headline={<>Your health,<br />remembered.</>}
          body="Write it. Say it. Snap it. Purple keeps it — and helps you see what matters."
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Button asChild className="h-12 px-7 text-base rounded-full">
              <Link to="/sign-up">
                Get started — it's free <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Link
              to="/features"
              className="text-sm sm:text-base underline-offset-4 hover:underline text-foreground/80"
            >
              See how it works →
            </Link>
          </div>
        </CalmHero>

        {/* Promise band — one line, oversized, centered */}
        <section className="mx-auto max-w-4xl px-6 sm:px-10 pt-24 sm:pt-32 pb-12 text-center">
          <p className="label-eyebrow">Built for the days that need attention</p>
          <p className="mt-6 font-serif text-3xl sm:text-5xl leading-[1.1] tracking-tight">
            Epilepsy. Migraine. Diabetes.<br className="hidden sm:block" /> Mental health. And more.
          </p>
          <p className="mt-8 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            The alternatives feel cold and clinical. Purple is warm, quiet, and patient — the way a
            journal should be.
          </p>
        </section>

        {/* Three pillars — text only */}
        <section className="mx-auto max-w-5xl px-6 sm:px-10 py-20 sm:py-28 grid md:grid-cols-3 gap-10 sm:gap-14">
          <Pillar
            eyebrow="Capture"
            title="A second is enough."
            body="Type a sentence. Hold the mic and talk. Snap a photo. Purple tags it, summarizes it, and tucks it into the right place."
          />
          <Pillar
            eyebrow="Ask"
            title="Today is a new page."
            body="A quiet bubble waits on every screen. Ask about your sleep, your meds, the pattern you can almost see."
          />
          <Pillar
            eyebrow="Together"
            title="No one should do this alone."
            body="Share read-only access with the people who help. They see what you choose, nothing more."
          />
        </section>

        {/* Quiet privacy band — calm landscape, light type */}
        <CalmBand
          image={calmImages.coast}
          headline="Your data stays yours."
          body="Encrypted at rest. Export or delete anything, any time. No ads. No selling. No third-party trackers — ever."
        />

        {/* Final CTA — quiet, generous */}
        <section className="mx-auto max-w-3xl px-6 sm:px-10 py-28 sm:py-40 text-center">
          <p className="label-eyebrow">Free forever · Open source</p>
          <h2 className="mt-6 font-serif text-4xl sm:text-6xl leading-[1.05] tracking-tight">
            Begin where you are.
          </h2>
          <p className="mt-7 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            One page is all it takes. Purple will be here tomorrow, and the day after that.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild className="h-12 px-8 text-base rounded-full">
              <Link to="/sign-up">Create your free account</Link>
            </Button>
            <Link
              to="/about"
              className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
            >
              Read our story
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter variant="marketing" />
    </div>
  );
}

function Pillar({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div>
      <p className="label-eyebrow">{eyebrow}</p>
      <h3 className="mt-4 font-serif text-2xl sm:text-3xl leading-tight tracking-tight">{title}</h3>
      <p className="mt-4 text-base text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}