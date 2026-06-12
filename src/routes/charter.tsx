import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useRouteTheme } from "@/lib/use-route-theme";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { SiteFooter } from "@/components/layout/site-footer";

export const Route = createFileRoute("/charter")({
  head: () => ({
    meta: [
      { title: "Why Purple exists" },
      {
        name: "description",
        content:
          "Purple is a calm, private health journal for people living with conditions that need daily attention. Free forever. Open source. Your story is yours.",
      },
    ],
  }),
  component: CharterPage,
});

function CharterPage() {
  useRouteTheme("light");
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />
      <div className="mx-auto max-w-3xl px-5 sm:px-10 lg:px-16 pt-12 sm:pt-20 lg:pt-24 pb-28">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
        <p className="label-eyebrow text-muted-foreground mt-12 sm:mt-16">About Purple</p>
        <h1 className="mt-4 font-serif text-[40px] sm:text-6xl lg:text-7xl leading-[1.02] tracking-[-0.02em] text-foreground">
          Why Purple exists.
        </h1>
        <p className="mt-6 body-serif text-lg sm:text-xl text-foreground/75 max-w-[42ch]">
          A quiet place to keep track of a body that doesn&rsquo;t always cooperate. For you, and for the people who love you.
        </p>
        <div className="mt-14 sm:mt-20 space-y-14 sm:space-y-20 max-w-[60ch]">
          <section className="space-y-4">
            <h2 className="font-serif text-2xl sm:text-3xl text-foreground">Who Purple is for</h2>
            <p className="body-serif text-foreground/75">
              Anyone living with a condition that asks for daily attention (epilepsy, migraine, diabetes, mental health, autoimmune, dysautonomia, long COVID, chronic pain) and the family members and caregivers who walk alongside them.
            </p>
            <p className="body-serif text-foreground/75">
              We&rsquo;re named after the global color for epilepsy awareness, and that&rsquo;s where our depth runs deepest. But Purple is condition-aware, not condition-locked. Whatever you&rsquo;re carrying, you&rsquo;re welcome here.
            </p>
          </section>
          <section className="space-y-4">
            <h2 className="font-serif text-2xl sm:text-3xl text-foreground">How it feels to use</h2>
            <p className="body-serif text-foreground/75">
              Write a sentence. Speak a thought. Snap a photo of a prescription bottle. Purple listens, remembers, and quietly notices the patterns over time. No forms to fill out. No streaks to keep. No guilt if you put it down for a week.
            </p>
            <p className="body-serif text-foreground/75">It&rsquo;s here when you need it, and quiet when you don&rsquo;t.</p>
          </section>
          <section className="space-y-4">
            <h2 className="font-serif text-2xl sm:text-3xl text-foreground">The promises we keep</h2>
            <ul className="space-y-4 body-serif text-foreground/75">
              <li><strong className="text-foreground">Free, forever.</strong> For individuals and the people who care for them.</li>
              <li><strong className="text-foreground">Open source.</strong> Apache 2.0. Read the code, run your own copy, fork it.</li>
              <li><strong className="text-foreground">No ads. Ever.</strong> Nothing in Purple is paid to be there.</li>
              <li><strong className="text-foreground">Your story is yours.</strong> Export it whenever you want. Delete it whenever you want. We&rsquo;ll never sell it, rent it, or hand it to brokers.</li>
              <li><strong className="text-foreground">Conversation first.</strong> Health shouldn&rsquo;t feel like paperwork.</li>
              <li><strong className="text-foreground">Not a medical device.</strong> Purple supports you and your clinician. It doesn&rsquo;t replace either of you.</li>
            </ul>
          </section>
          <section className="space-y-4">
            <h2 className="font-serif text-2xl sm:text-3xl text-foreground">Things we won&rsquo;t do</h2>
            <ul className="space-y-4 body-serif text-foreground/75">
              <li>Dark patterns or guilt loops to keep you in the app.</li>
              <li>Behavioral advertising or third-party trackers.</li>
              <li>Selling, renting, or sharing your data with brokers.</li>
              <li>Paywalling the heart of Purple: journaling, medications, or sharing with the people who help you.</li>
              <li>Lock-in. You can leave any time, with everything you brought.</li>
            </ul>
          </section>
          <section className="space-y-4 border-t border-border pt-12">
            <h2 className="font-serif text-2xl sm:text-3xl text-foreground">Our standard</h2>
            <p className="body-serif text-foreground/75">
              Calm. Quiet. Respectful of your energy. If a feature can&rsquo;t be built within these promises, we don&rsquo;t ship it.
            </p>
            <p className="body-serif text-foreground/60">Thank you for trusting us with even a small corner of your day.</p>
          </section>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}