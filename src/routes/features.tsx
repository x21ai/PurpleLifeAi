import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/layout/site-footer";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { CalmHero, CalmBand, HumanMoment, StillLife } from "@/components/marketing/calm-scene";
import { ResponsiveImage } from "@/components/marketing/responsive-image";
import { featuresImages } from "@/lib/calm-images";
import { useRevealOnScroll } from "@/hooks/use-reveal-on-scroll";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features. Purple." },
      {
        name: "description",
        content:
          "Everything Purple does: a multi-modal journal, a quiet AI that knows your history, a unified timeline, smart meds, biometrics, and a community that gets it.",
      },
      { property: "og:title", content: "Features. Purple." },
      { property: "og:description", content: "Everything Purple does, in one quiet companion." },
      { property: "og:url", content: "https://www.purplelife.org/features" },
    ],
    links: [{ rel: "canonical", href: "https://www.purplelife.org/features" }],
  }),
  component: FeaturesPage,
});

function FeaturesPage() {
  useRevealOnScroll();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />

      <main>
        {/* Hero, calm landscape */}
        <CalmHero
          image={featuresImages.hero}
          priority
          eyebrow="Features"
          headline={<>A quiet tool,<br />deeply useful.</>}
          body="Everything Purple does, without the spreadsheet feeling."
        />

        {/* Capture */}
        <FeatureBand
          eyebrow="Capture"
          title="Type it. Say it. Snap it."
          body="A sentence. A 60-second voice memo. A photo of how a rash looks today. A short video. Purple transcribes, tags, and summarizes, so nothing slips through, and you don't think about filing."
          image={featuresImages.pillOrganizer}
          imageSide="right"
        />

        {/* Still life, punctuation between sections */}
        <StillLife image={featuresImages.phoneTyping} />

        {/* Ask Purple, text only, centered */}
        <section className="mx-auto max-w-3xl px-6 sm:px-10 py-24 sm:py-32 text-center">
          <p className="label-eyebrow">Ask Purple</p>
          <h2 className="mt-5 font-serif text-4xl sm:text-5xl lg:text-6xl leading-[1.02] tracking-tight">
            A question, answered in your own context.
          </h2>
          <p className="mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            A quiet bubble waits on every screen. Choose Gemini Flash, Gemini Pro, or Claude
            Sonnet from settings. Purple already knows your history, and asks before changing
            anything.
          </p>
          <ul className="mt-7 space-y-2 text-sm text-muted-foreground">
            <li>Three AI models. Switch any time.</li>
            <li>Confirm-to-write on every action.</li>
            <li>Your entries are the prompt, never the training data.</li>
          </ul>
        </section>

        {/* Timeline + Patterns */}
        <FeatureBand
          eyebrow="See"
          title="One timeline. The whole picture."
          body="Seizures, meds, journal moments, sleep, HRV, in one feed you can filter by day, week, month, or year. A daily forecast watches your sleep, missed doses, menstrual phase, and your own trigger history."
          image={featuresImages.handOnShoulder}
          imageSide="left"
        />

        {/* Caregiver human moment, introduces "the rest" */}
        <HumanMoment
          image={featuresImages.hero}
          quote="For the people who help you carry it."
          attribution="Caregivers, family, anyone you trust"
        />

        {/* The rest, as a quiet list */}
        <section className="mx-auto max-w-5xl px-6 sm:px-10 py-20 sm:py-28">
          <p className="label-eyebrow text-center">And the rest</p>
          <h2 className="mt-5 font-serif text-4xl sm:text-5xl leading-[1.04] tracking-tight text-center">
            Quietly thorough.
          </h2>
          <div className="mt-14 grid sm:grid-cols-2 gap-x-12 gap-y-10">
            {[
              {
                title: "Smart meds",
                body: "Reminders, adherence, side-effect notes, refill alerts. Backdate old prescriptions to build full history.",
              },
              {
                title: "Seizure log",
                body: "Quick capture with type, duration, witnesses, recovery, rescue meds. Backdate past episodes.",
              },
              {
                title: "Biometrics",
                body: "Connect Oura, Whoop, Apple Health. Sleep, HRV, temperature deviation, SpO₂, respiratory rate.",
              },
              {
                title: "Caregiver mode",
                body: "Share read-only access with the people who help. Every write needs your blessing first.",
              },
              {
                title: "Travel mode",
                body: "An itinerary-driven medication schedule that shifts cleanly across time zones.",
              },
              {
                title: "Yours to keep",
                body: "Export everything to JSON or PDF. Delete your account and everything goes with it.",
              },
            ].map((f) => (
              <article key={f.title} className="border-t border-border pt-5">
                <h3 className="font-serif text-2xl text-foreground">{f.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Final calm band + CTA */}
        <CalmBand
          image={featuresImages.hero}
          headline="Begin today."
          body="Free forever. No ads. No selling your data."
        />
        <section className="mx-auto max-w-3xl px-6 sm:px-10 py-20 text-center">
          <Button asChild className="h-12 px-7 text-base rounded-full">
            <Link to="/sign-up">
              Create your free account <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </section>
      </main>

      <SiteFooter variant="marketing" />
    </div>
  );
}

function FeatureBand({
  eyebrow,
  title,
  body,
  image,
  imageSide,
}: {
  eyebrow: string;
  title: string;
  body: string;
  image: import("@/components/marketing/responsive-image").PictureAsset;
  imageSide: "left" | "right";
}) {
  return (
    <section className="mx-auto max-w-6xl px-6 sm:px-10 py-20 sm:py-28">
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <div className={imageSide === "right" ? "lg:order-1" : "lg:order-2"}>
          <p className="label-eyebrow">{eyebrow}</p>
          <h2 className="mt-5 font-serif text-4xl sm:text-5xl lg:text-6xl leading-[1.04] tracking-tight">
            {title}
          </h2>
          <p className="mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg">
            {body}
          </p>
        </div>
        <div className={imageSide === "right" ? "lg:order-2" : "lg:order-1"}>
          <div className="relative overflow-hidden rounded-3xl aspect-[4/3]">
            <ResponsiveImage
              asset={image}
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}