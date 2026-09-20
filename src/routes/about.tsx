import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/layout/site-footer";
import { MarketingHeader } from "@/components/layout/marketing-header";
import {
  CalmHero,
  CalmBand,
  HumanMoment,
  QuietStat,
} from "@/components/marketing/calm-scene";
import { aboutImages } from "@/lib/calm-images/about";
import { useRevealOnScroll } from "@/hooks/use-reveal-on-scroll";
import { marketingHead, marketingOrganizationJsonLd } from "@/lib/marketing-seo";

export const Route = createFileRoute("/about")({
  head: () =>
    marketingHead({
      path: "/about",
      title: "Why Purple exists",
      description:
        "Purple is a quiet, open-source companion for people living with conditions that need daily attention. Built by people who get it. Free, forever.",
      ogDescription: "Calm, open-source, free forever. Made for anyone carrying something heavy.",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "AboutPage",
        name: "Why Purple exists",
        url: "https://www.purplelife.org/about",
        about: marketingOrganizationJsonLd(),
      },
    }),
  component: AboutPage,
});

function AboutPage() {
  useRevealOnScroll();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />

      <main>
        {/* Hero, mist */}
        <CalmHero
          image={aboutImages.hero}
          priority
          eyebrow="About Purple"
          headline={<>Calm, quiet,<br />on your side.</>}
        />

        {/* Why we built this */}
        <section className="mx-auto max-w-3xl px-6 sm:px-10 py-24 sm:py-32">
          <p className="label-eyebrow">Why Purple exists</p>
          <h2 className="mt-5 font-serif text-3xl sm:text-5xl leading-[1.06] tracking-tight">
            Most health apps feel like spreadsheets.
          </h2>
          <div className="mt-10 space-y-7 text-lg text-muted-foreground leading-relaxed">
            <p>
              Living with a chronic condition means watching your body, your meds, your sleep, your
              moods. Every day. The tools that try to help are cold, demanding, full of charts that
              don&rsquo;t answer the question you actually have.
            </p>
            <p>
              Purple listens before it speaks. It takes whatever you can give it, a sentence,
              a voice memo, a photo, and quietly builds a picture of you over time. When you
              have a question, Purple has read the chapters that matter.
            </p>
          </div>
        </section>

        {/* Human moment, bedside */}
        <HumanMoment
          image={aboutImages.bedsideLamp}
          quote="It&rsquo;s here when I need it, and quiet when I don&rsquo;t."
          attribution="What we&rsquo;re building toward"
        />

        {/* Quiet stat, the origin of the name */}
        <QuietStat
          stat={<>Named for the color of epilepsy awareness.</>}
          caption="Built for anyone carrying something heavy."
        />

        {/* Caregiver moment */}
        <HumanMoment
          image={aboutImages.armAround}
          quote="No one should do this alone."
          attribution="On caregivers, family, and the people who help"
          reverse
        />

        {/* Promises */}
        <section className="mx-auto max-w-3xl px-6 sm:px-10 py-24 sm:py-32">
          <p className="label-eyebrow">The promises we keep</p>
          <ul className="mt-10 space-y-6 text-lg text-foreground/80 leading-relaxed">
            <li><strong className="text-foreground">Free, forever.</strong> For individuals and the people who care for them.</li>
            <li><strong className="text-foreground">Open source.</strong> Apache 2.0. Read the code, fork it, run your own copy.</li>
            <li><strong className="text-foreground">No ads. Ever.</strong> Nothing in Purple is paid to be there.</li>
            <li><strong className="text-foreground">Your story is yours.</strong> Export it or delete it, whenever you want.</li>
            <li><strong className="text-foreground">Not a medical device.</strong> Purple supports you and your clinician. It doesn&rsquo;t replace either of you.</li>
          </ul>
          <p className="mt-8 text-base text-muted-foreground">
            Each promise, and why you can check it yourself:{" "}
            <Link to="/trust" className="text-foreground underline underline-offset-4 hover:text-primary">
              why Purple is different
            </Link>
            .
          </p>
        </section>

        {/* Promise band */}
        <CalmBand
          image={aboutImages.hero}
          headline="Free, open, yours."
          body="Open source on GitHub. No ads. No selling your data. No third-party trackers, ever."
        />

        {/* CTA */}
        <section className="mx-auto max-w-2xl px-6 sm:px-10 py-28 sm:py-40 text-center">
          <h2 className="font-serif text-4xl sm:text-5xl leading-[1.05] tracking-tight">
            Begin where you are.
          </h2>
          <div className="mt-10">
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