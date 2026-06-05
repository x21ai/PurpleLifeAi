import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/layout/site-footer";
import { MarketingHeader } from "@/components/layout/marketing-header";
import heroMorning from "@/assets/home-hero-morning.jpg";
import walkImg from "@/assets/home-walk.jpg";
import deviceImg from "@/assets/home-device.jpg";
import caregiverImg from "@/assets/home-caregiver.jpg";
import mistImg from "@/assets/hero-readiness-mist.jpg";

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
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />

      <main>
        {/* Hero */}
        <section className="relative">
          <div className="relative h-[70vh] min-h-[440px] max-h-[760px] w-full overflow-hidden">
            <img
              src={heroMorning}
              alt="A morning at the table — phone, journal, tea, hands."
              className="absolute inset-0 h-full w-full object-cover"
              width={1920}
              height={1280}
              fetchPriority="high"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-foreground/35 via-foreground/15 to-foreground/55" />
            <div className="absolute inset-0 flex items-end">
              <div className="mx-auto w-full max-w-6xl px-6 sm:px-10 pb-12 sm:pb-16">
                <p className="label-eyebrow" style={{ color: "var(--background)", opacity: 0.85 }}>
                  Features
                </p>
                <h1
                  className="mt-5 font-serif text-5xl sm:text-6xl lg:text-7xl leading-[1.02] tracking-tight max-w-4xl"
                  style={{ color: "var(--background)" }}
                >
                  A quiet tool,<br />deeply useful.
                </h1>
                <p
                  className="mt-6 text-base sm:text-lg max-w-xl leading-relaxed"
                  style={{ color: "var(--background)", opacity: 0.85 }}
                >
                  Everything Purple does — without the spreadsheet feeling.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Capture */}
        <FeatureBand
          eyebrow="Capture"
          title="Type it. Say it. Snap it."
          body="A sentence. A 60-second voice memo. A photo of how a rash looks today. A short video. Purple transcribes, tags, and summarizes — so nothing slips through, and you don't think about filing."
          image={walkImg}
          alt="A person walking on a quiet tree-lined path at golden hour."
          imageSide="right"
        />

        {/* Ask Purple device shot */}
        <section className="relative overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 80% at 50% 0%, color-mix(in oklab, var(--purple-primary) 12%, transparent), transparent 60%)",
            }}
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-6xl px-6 sm:px-10 py-20 sm:py-28 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <p className="label-eyebrow">Ask Purple</p>
              <h2 className="mt-5 font-serif text-4xl sm:text-5xl lg:text-6xl leading-[1.02] tracking-tight">
                A question, answered in your own context.
              </h2>
              <p className="mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg">
                A quiet bubble waits on every screen. Choose Gemini Flash, Gemini Pro, or Claude
                Sonnet from settings. Purple already knows your history — and asks before changing
                anything.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                <li>· Three AI models. Switch any time.</li>
                <li>· Confirm-to-write on every action.</li>
                <li>· Your entries are the prompt — never the training data.</li>
              </ul>
            </div>
            <div className="order-1 lg:order-2 flex justify-center">
              <img
                src={deviceImg}
                alt="Purple's Today screen on a phone."
                className="rounded-3xl shadow-2xl max-w-[360px] sm:max-w-[440px] w-full"
                width={1024}
                height={1600}
                loading="lazy"
              />
            </div>
          </div>
        </section>

        {/* Timeline + Patterns */}
        <FeatureBand
          eyebrow="See"
          title="One timeline. The whole picture."
          body="Seizures, meds, journal moments, sleep, HRV — in one feed you can filter by day, week, month, or year. A daily forecast watches your sleep, missed doses, menstrual phase, and your own trigger history."
          image={mistImg}
          alt="Soft morning mist over a quiet field."
          imageSide="left"
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

        {/* Caregiver image break + CTA */}
        <section className="relative overflow-hidden">
          <div className="relative h-[58vh] min-h-[400px] w-full">
            <img
              src={caregiverImg}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              width={1920}
              height={1080}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-foreground/45" />
            <div className="absolute inset-0 flex items-center">
              <div className="mx-auto max-w-3xl px-6 sm:px-10 text-center">
                <h2
                  className="font-serif text-4xl sm:text-6xl leading-[1.05] tracking-tight"
                  style={{ color: "var(--background)" }}
                >
                  Begin today.
                </h2>
                <p
                  className="mt-5 text-base sm:text-lg max-w-xl mx-auto leading-relaxed"
                  style={{ color: "var(--background)", opacity: 0.85 }}
                >
                  Free forever. No ads. No selling your data.
                </p>
                <div className="mt-8">
                  <Button asChild className="h-12 px-7 text-base rounded-full">
                    <Link to="/sign-up">
                      Create your free account <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
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
  alt,
  imageSide,
}: {
  eyebrow: string;
  title: string;
  body: string;
  image: string;
  alt: string;
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
            <img
              src={image}
              alt={alt}
              className="absolute inset-0 h-full w-full object-cover"
              width={1600}
              height={1200}
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}