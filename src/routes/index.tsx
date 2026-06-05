import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/layout/site-footer";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { captureInviteFromUrl } from "@/lib/invite-storage";
import {
  CalmHero,
  CalmBand,
  HumanMoment,
  QuietStat,
  StillLife,
} from "@/components/marketing/calm-scene";
import { calmImages, humanImages } from "@/lib/calm-images";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Purple. A quiet companion for your health." },
      {
        name: "description",
        content:
          "A private journal for the people carrying something heavy. Write a sentence. Say a thought. Snap a photo. Purple remembers — quietly, for as long as you need it.",
      },
      { property: "og:title", content: "Purple. A quiet companion for your health." },
      {
        property: "og:description",
        content: "Free forever. Open source. Made for people who didn't ask for any of this.",
      },
      { property: "og:url", content: "https://www.purplelife.org/" },
    ],
    links: [{ rel: "canonical", href: "https://www.purplelife.org/" }],
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
        {/* Hero — calm landscape */}
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
                Begin today <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Link
              to="/features"
              className="text-sm sm:text-base underline-offset-4 hover:underline text-foreground/80 px-3 py-2"
            >
              See how it works →
            </Link>
          </div>
        </CalmHero>

        {/* First human moment — sets the tone */}
        <HumanMoment
          image={humanImages.mugMorning}
          alt="Two pairs of hands holding a warm ceramic mug at a kitchen window in soft morning light."
          quote="Last night I wrote three sentences. That was enough."
          attribution="What using Purple actually feels like"
        />

        {/* Who it's for — quiet, specific */}
        <section className="mx-auto max-w-4xl px-6 sm:px-10 py-20 sm:py-28 text-center">
          <p className="label-eyebrow">For the days that need attention</p>
          <p className="mt-6 font-serif text-3xl sm:text-5xl leading-[1.1] tracking-tight">
            Epilepsy. Migraine. Diabetes.<br className="hidden sm:block" /> Mental health. And more.
          </p>
          <p className="mt-8 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            The alternatives feel cold and clinical. Purple is warm, quiet, and patient —
            the way a journal should be.
          </p>
        </section>

        {/* Three pillars */}
        <section className="mx-auto max-w-5xl px-6 sm:px-10 pb-20 sm:pb-28 grid md:grid-cols-3 gap-10 sm:gap-14">
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

        {/* A still life — punctuation */}
        <StillLife
          image={humanImages.nightstand}
          alt="A phone resting face-down on a wooden nightstand beside a glass of water and a small lamp."
        />

        {/* The quiet stat — what makes Purple different */}
        <QuietStat
          stat={<>Free. Forever.</>}
          caption="For the people who need it most — and the people who help them carry it."
        />

        {/* Caregiver moment */}
        <HumanMoment
          image={humanImages.caregiverHand}
          alt="A caregiver's hand resting gently on another person's shoulder."
          quote="My mom can see my week without me having to explain it again."
          attribution="On sharing with the people who help"
          reverse
        />

        {/* Privacy band */}
        <CalmBand
          image={calmImages.coast}
          headline="Your story is yours."
          body="Encrypted at rest. Export or delete anything, any time. No ads. No selling. No third-party trackers — ever."
        />

        {/* Final CTA */}
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
      <h3 className="mt-4 font-serif text-2xl sm:text-3xl leading-[1.1] tracking-tight">
        {title}
      </h3>
      <p className="mt-4 text-base text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
