import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useRouteTheme } from "@/lib/use-route-theme";

export const Route = createFileRoute("/_app/charter")({
  head: () => ({ meta: [{ title: "Founding charter — Purple" }] }),
  component: CharterPage,
});

function CharterPage() {
  useRouteTheme("light");
  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-10 lg:px-16 pt-10 sm:pt-16 lg:pt-20 pb-24">
      <Link to="/settings" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Settings
      </Link>
      <p className="label-eyebrow text-muted-foreground mt-10">About</p>
      <h1 className="mt-3 font-serif text-[44px] sm:text-6xl lg:text-7xl leading-[1.02] tracking-[-0.02em] text-foreground">
        Founding<br/>charter.
      </h1>
      <div className="mt-10 space-y-12 max-w-[640px]">
        <section className="space-y-4">
          <h2 className="font-serif text-2xl text-foreground">Why Purple exists</h2>
          <p className="body-serif text-foreground/75">
            Purple is for people living with conditions that need daily attention —
            epilepsy, migraine, diabetes, mental health, autoimmune, dysautonomia,
            long COVID, chronic pain — and for the family members and caregivers who
            support them. It&rsquo;s named after the global epilepsy awareness color,
            where our depth runs deepest, but the app is condition-aware, not
            condition-locked.
          </p>
          <p className="body-serif text-foreground/75">
            Conversation is the interface. You write, speak, or snap an entry. Purple
            remembers, finds patterns, and helps you see what matters — without
            getting in the way of your day.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="font-serif text-2xl text-foreground">The promises we won&rsquo;t break</h2>
          <ol className="space-y-3 body-serif text-foreground/75 list-decimal pl-5 marker:text-foreground/40">
            <li>Free forever for individuals.</li>
            <li>Open source under Apache 2.0.</li>
            <li>No ads. Ever.</li>
            <li>We never sell your data.</li>
            <li>Your data is yours — full export, full delete, anytime.</li>
            <li>Conversation-first, not form-first.</li>
            <li>Condition-aware, not condition-locked.</li>
            <li>Not a medical device. Purple supports you; it doesn&rsquo;t replace your clinician.</li>
          </ol>
        </section>

        <section className="space-y-4">
          <h2 className="font-serif text-2xl text-foreground">What we will never do</h2>
          <ul className="space-y-3 body-serif text-foreground/75 list-disc pl-5 marker:text-foreground/40">
            <li>Dark patterns or guilt-loops to keep you in the app.</li>
            <li>Behavioral advertising or third-party trackers.</li>
            <li>Selling, renting, or sharing your data with brokers.</li>
            <li>Paywalling the core of journaling, medications, or sharing with caregivers.</li>
            <li>Lock-in. You can leave with everything you put in.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="font-serif text-2xl text-foreground">Our standard</h2>
          <p className="body-serif text-foreground/75">
            Calm, quiet, respectful of your energy. If a feature can&rsquo;t be built
            within these promises, we don&rsquo;t ship it.
          </p>
        </section>
      </div>
    </div>
  );
}