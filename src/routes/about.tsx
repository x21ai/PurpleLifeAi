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
import { calmImages, humanImages } from "@/lib/calm-images";
import { useRevealOnScroll } from "@/hooks/use-reveal-on-scroll";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Why Purple exists" },
      {
        name: "description",
        content:
          "Purple is a quiet, open-source companion for people living with conditions that need daily attention. Built by people who get it. Free, forever.",
      },
      { property: "og:title", content: "Why Purple exists" },
      {
        property: "og:description",
        content: "Calm, open-source, free forever. Made for anyone carrying something heavy.",
      },
      { property: "og:url", content: "https://www.purplelife.org/about" },
    ],
    links: [{ rel: "canonical", href: "https://www.purplelife.org/about" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: "Why Purple exists",
          url: "https://www.purplelife.org/about",
          about: {
            "@type": "Organization",
            name: "Purple",
            url: "https://purplelife.org",
          },
        }),
      },
    ],
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
          image={calmImages.mist}
          alt=""
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
              Purple listens before it speaks. It takes whatever you can give it &mdash; a sentence,
              a voice memo, a photo &mdash; and quietly builds a picture of you over time. When you
              have a question, Purple has read the chapters that matter.
            </p>
          </div>
        </section>

        {/* Human moment, bedside */}
        <HumanMoment
          image={humanImages.bedsideDusk}
          alt="A person sitting on the edge of a bed at dusk, holding a phone, lamp light behind."
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
          image={humanImages.caregiverHand}
          alt="A caregiver&rsquo;s hand resting gently on another person&rsquo;s shoulder."
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
            <li><strong className="text-foreground">Your story is yours.</strong> Export it, delete it &mdash; whenever you want.</li>
            <li><strong className="text-foreground">Not a medical device.</strong> Purple supports you and your clinician. It doesn&rsquo;t replace either of you.</li>
          </ul>
        </section>

        {/* Promise band */}
        <CalmBand
          image={calmImages.dawnAlt}
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

      <SiteFooter variant="marketing" />
    </div>
  );
}