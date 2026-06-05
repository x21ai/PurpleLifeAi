import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/layout/site-footer";
import { useEffect } from "react";
import { captureInviteFromUrl } from "@/lib/invite-storage";
import heroMorning from "@/assets/home-hero-morning.jpg";
import caregiverImg from "@/assets/home-caregiver.jpg";
import walkImg from "@/assets/home-walk.jpg";
import deviceImg from "@/assets/home-device.jpg";
import coastImg from "@/assets/hero-readiness-coast.jpg";
import { MarketingHeader } from "@/components/layout/marketing-header";

export const Route = createFileRoute("/")({
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
        {/* Hero — full-bleed editorial image with overlay headline */}
        <section className="relative">
          <div className="relative h-[88vh] min-h-[560px] max-h-[920px] w-full overflow-hidden">
            <img
              src={heroMorning}
              alt="A quiet morning, a hand resting on a phone and a leather journal by the window."
              className="absolute inset-0 h-full w-full object-cover"
              width={1920}
              height={1280}
              fetchPriority="high"
            />
            {/* Gentle vignette so the type sits comfortably without overpowering the image */}
            <div className="absolute inset-0 bg-gradient-to-b from-foreground/30 via-foreground/10 to-foreground/55" />
            <div className="absolute inset-0 flex items-end">
              <div className="mx-auto w-full max-w-6xl px-6 sm:px-10 pb-14 sm:pb-20">
                <p
                  className="label-eyebrow"
                  style={{ color: "var(--background)", opacity: 0.85 }}
                >
                  A quiet companion for your health
                </p>
                <h1
                  className="mt-5 font-serif text-5xl sm:text-7xl lg:text-[6.5rem] leading-[0.98] tracking-tight max-w-4xl"
                  style={{ color: "var(--background)" }}
                >
                  Your health,<br />remembered.
                </h1>
                <p
                  className="mt-7 text-base sm:text-lg max-w-xl leading-relaxed"
                  style={{ color: "var(--background)", opacity: 0.85 }}
                >
                  Write it. Say it. Snap it. Purple keeps it — and helps you see what matters.
                </p>
                <div className="mt-9 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <Button asChild className="h-12 px-7 text-base rounded-full">
                    <Link to="/sign-up">
                      Get started — it's free <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Link>
                  </Button>
                  <Link
                    to="/features"
                    className="text-sm sm:text-base underline-offset-4 hover:underline"
                    style={{ color: "var(--background)" }}
                  >
                    See how it works →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

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

        {/* Zigzag 1 — Capture (image right, text left) */}
        <FeatureScene
          eyebrow="Capture"
          title="A second is enough."
          body="Type a sentence. Hold the mic and talk. Snap a photo of how it looked. Purple tags it, summarizes it, and tucks it into the right place — so nothing gets lost, and you don't have to think about filing."
          image={walkImg}
          alt="A person walking on a quiet tree-lined path at golden hour."
          imageSide="right"
        />

        {/* Device showcase — the product itself */}
        <section className="relative mt-12 sm:mt-24 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 80% at 50% 0%, color-mix(in oklab, var(--purple-primary) 12%, transparent), transparent 60%)",
            }}
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-6xl px-6 sm:px-10 py-20 sm:py-32 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <p className="label-eyebrow">Ask Purple anything</p>
              <h2 className="mt-5 font-serif text-4xl sm:text-6xl leading-[1.02] tracking-tight">
                Today is a new page.
              </h2>
              <p className="mt-7 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg">
                A quiet bubble waits on every screen. Ask about your sleep, your meds, the pattern
                you can almost see. Purple already knows your history — and only yours.
              </p>
              <Link
                to="/features"
                className="inline-flex items-center gap-1.5 mt-8 text-sm font-medium text-foreground underline-offset-4 hover:underline"
              >
                What Purple can do <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="order-1 lg:order-2 flex justify-center">
              <img
                src={deviceImg}
                alt="Purple's Today screen on a phone, held in a hand."
                className="rounded-3xl shadow-2xl max-w-[360px] sm:max-w-[440px] w-full"
                width={1024}
                height={1600}
                loading="lazy"
              />
            </div>
          </div>
        </section>

        {/* Zigzag 2 — Caregiver (image left, text right) */}
        <FeatureScene
          eyebrow="Together"
          title="No one should do this alone."
          body="Share read-only access with the people who help — a partner, a parent, a sibling. They see what you choose, nothing more. Every write needs your blessing first."
          image={caregiverImg}
          alt="Two pairs of hands resting gently on a wooden table — one older, one younger."
          imageSide="left"
        />

        {/* Quiet promise / privacy */}
        <section className="relative overflow-hidden">
          <div className="relative h-[60vh] min-h-[420px] w-full">
            <img
              src={coastImg}
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
                  Your data stays yours.
                </h2>
                <p
                  className="mt-6 text-base sm:text-lg leading-relaxed max-w-xl mx-auto"
                  style={{ color: "var(--background)", opacity: 0.85 }}
                >
                  Encrypted at rest. Export or delete anything, any time. No ads. No selling.
                  No third-party trackers — ever.
                </p>
              </div>
            </div>
          </div>
        </section>

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

function FeatureScene({
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