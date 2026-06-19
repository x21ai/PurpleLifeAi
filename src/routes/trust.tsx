import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/layout/site-footer";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { CalmHero } from "@/components/marketing/calm-scene";
import { trustImages } from "@/lib/calm-images/trust";
import { useRevealOnScroll } from "@/hooks/use-reveal-on-scroll";

export const Route = createFileRoute("/trust")({
  head: () => ({
    meta: [
      { title: "Why Purple is different" },
      {
        name: "description",
        content:
          "No ads, no trackers, open source, private by architecture. Purple's promises, each one true in the code today.",
      },
      { property: "og:title", content: "Why Purple is different" },
      {
        property: "og:description",
        content: "No ads. No trackers. Your data is yours. The promises, in writing.",
      },
      { property: "og:url", content: "https://www.purplelife.org/trust" },
    ],
    links: [{ rel: "canonical", href: "https://www.purplelife.org/trust" }],
  }),
  component: TrustPage,
});

const CLAIMS: { title: string; body: string }[] = [
  {
    title: "No ads. No trackers. No analytics.",
    body: "There is no advertising code, no third-party tracker, and no analytics script anywhere in Purple. Nothing watches you use it. The page you are reading loads from our servers and nowhere else.",
  },
  {
    title: "Open source.",
    body: "The entire codebase is public. Read it, audit it, fork it, run your own copy. Every promise on this page can be checked against the code rather than taken on faith.",
  },
  {
    title: "Private by architecture.",
    body: "Every table is protected by row-level security, so your rows are readable by you and no one else. Photos and voice notes live behind signed, expiring links. Caregivers see only what you choose to share, scope by scope, and every access is written to an audit log you can review.",
  },
  {
    title: "Your entries train nothing.",
    body: "When Purple's AI reads your journal, it reads it to answer you, and that is all. Your words are the prompt, never the training data. No model is built from your health story.",
  },
  {
    title: "Free forever.",
    body: "Everything health-critical stays free: journaling, medications, reminders, patterns, caregivers. Pro exists to fund the mission, not to hold your safety behind a paywall.",
  },
  {
    title: "The covenant.",
    body: "Purple will never sell your data. Purple will refuse acquisition by anyone who would. These are not growth-stage promises to be renegotiated later; they are the reason this exists.",
  },
];

function TrustPage() {
  useRevealOnScroll();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />

      <main>
        <CalmHero
          image={trustImages.hero}
          priority
          eyebrow="Trust"
          headline={
            <>
              Why Purple
              <br />
              is different.
            </>
          }
        />

        <section className="mx-auto max-w-3xl px-6 sm:px-10 py-24 sm:py-32">
          <p className="label-eyebrow">In writing</p>
          <h2 className="mt-5 font-serif text-3xl sm:text-5xl leading-[1.06] tracking-tight">
            Promises you can check.
          </h2>
          <p className="mt-8 text-lg text-muted-foreground leading-relaxed max-w-xl">
            Health software asks for the most private things you have. That deserves more than a
            privacy policy nobody reads. Each claim below is true in the code today, and the code is
            public.
          </p>

          <ul className="mt-16 space-y-14">
            {CLAIMS.map((c) => (
              <li key={c.title}>
                <h3 className="font-serif text-2xl sm:text-3xl leading-snug tracking-tight">
                  {c.title}
                </h3>
                <p className="mt-3 text-lg text-muted-foreground leading-relaxed">{c.body}</p>
              </li>
            ))}
          </ul>

          <p className="mt-16 text-lg text-muted-foreground leading-relaxed">
            The code is at{" "}
            <a
              href="https://github.com/AstroAii/purpledrw"
              target="_blank"
              rel="noreferrer noopener"
              className="text-foreground underline underline-offset-4 hover:text-primary"
            >
              github.com/AstroAii/purpledrw
            </a>
            . Hold us to all of it.
          </p>

          <div className="mt-20 border-t border-border pt-10">
            <p className="font-serif text-xl text-foreground">Devyn Walker</p>
            <p className="mt-1 text-sm text-muted-foreground">Founder</p>
          </div>
        </section>

        <section className="mx-auto max-w-2xl px-6 sm:px-10 pb-28 sm:pb-40 text-center">
          <p className="text-sm text-muted-foreground">
            The longer version of these commitments lives in{" "}
            <Link
              to="/charter"
              className="text-foreground underline underline-offset-4 hover:text-primary"
            >
              the Charter
            </Link>
            .
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
