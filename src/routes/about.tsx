import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/layout/site-footer";
import { MarketingHeader } from "@/components/layout/marketing-header";
import aboutHero from "@/assets/about-hero.jpg";
import aboutCraft from "@/assets/about-craft.jpg";
import dawnImg from "@/assets/hero-readiness-dawn.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Purple" },
      {
        name: "description",
        content:
          "Purple is a calm, open-source companion for people living with chronic conditions — built by people who get it.",
      },
      { property: "og:title", content: "About Purple" },
      { property: "og:description", content: "Why we built Purple, and who it's for." },
      { property: "og:url", content: "https://www.purplelife.org/about" },
    ],
    links: [{ rel: "canonical", href: "https://www.purplelife.org/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />

      <main>
        {/* Hero — woman by window */}
        <section className="relative">
          <div className="relative h-[78vh] min-h-[500px] max-h-[820px] w-full overflow-hidden">
            <img
              src={aboutHero}
              alt="A woman by a window, hands wrapped around a warm mug, looking out."
              className="absolute inset-0 h-full w-full object-cover"
              width={1920}
              height={1280}
              fetchPriority="high"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-foreground/25 via-foreground/10 to-foreground/55" />
            <div className="absolute inset-0 flex items-end">
              <div className="mx-auto w-full max-w-6xl px-6 sm:px-10 pb-14 sm:pb-20">
                <p className="label-eyebrow" style={{ color: "var(--background)", opacity: 0.85 }}>
                  About
                </p>
                <h1
                  className="mt-5 font-serif text-5xl sm:text-7xl leading-[1.02] tracking-tight max-w-3xl"
                  style={{ color: "var(--background)" }}
                >
                  Calm, quiet,<br />on your side.
                </h1>
              </div>
            </div>
          </div>
        </section>

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
              don't answer the question you actually have.
            </p>
            <p>
              Purple listens before it speaks. It takes whatever you can give it — a sentence, a
              voice memo, a photo — and quietly builds a picture of you over time. When you have a
              question, Purple has read the chapters that matter.
            </p>
          </div>
        </section>

        {/* Craft image break */}
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-6xl px-6 sm:px-10 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center pb-24 sm:pb-32">
            <div className="order-2 lg:order-1">
              <div className="relative overflow-hidden rounded-3xl aspect-[4/3]">
                <img
                  src={aboutCraft}
                  alt="An open notebook with handwritten notes and a sprig of dried lavender."
                  className="absolute inset-0 h-full w-full object-cover"
                  width={1600}
                  height={1200}
                  loading="lazy"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <p className="label-eyebrow">Made carefully</p>
              <h2 className="mt-5 font-serif text-4xl sm:text-5xl leading-[1.04] tracking-tight">
                A journal, not a dashboard.
              </h2>
              <p className="mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg">
                Purple is shaped by people who live with these conditions. Every screen earns its
                place. Every word is chosen. We'd rather do one thing softly than ten things loudly.
              </p>
            </div>
          </div>
        </section>

        {/* Promise band */}
        <section className="relative overflow-hidden">
          <div className="relative h-[60vh] min-h-[420px] w-full">
            <img
              src={dawnImg}
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
                  Free, open, yours.
                </h2>
                <p
                  className="mt-6 text-base sm:text-lg max-w-xl mx-auto leading-relaxed"
                  style={{ color: "var(--background)", opacity: 0.85 }}
                >
                  Free forever. Open source on GitHub. Ad-free. No selling your data, no third-party
                  trackers — ever. Export or delete everything, any time.
                </p>
              </div>
            </div>
          </div>
        </section>

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