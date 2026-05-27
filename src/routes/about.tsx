import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/layout/site-footer";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Purple" },
      { name: "description", content: "Purple is a calm, open-source AI companion for people living with epilepsy, built by people who get it." },
      { property: "og:title", content: "About — Purple" },
      { property: "og:description", content: "Why we built Purple." },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border">
        <div className="mx-auto max-w-6xl px-6 sm:px-10 h-16 flex items-center justify-between">
          <Link to="/" className="wordmark text-[14px]">Purple</Link>
          <Button asChild size="sm"><Link to="/sign-up">Get started</Link></Button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 sm:px-10 py-16 sm:py-24">
        <p className="label-eyebrow">About</p>
        <h1 className="mt-4 font-serif text-4xl sm:text-5xl lg:text-6xl leading-tight tracking-tight">
          Calm, quiet, on your side.
        </h1>
        <div className="mt-10 space-y-6 text-lg text-muted-foreground leading-relaxed">
          <p>Living with epilepsy means watching your body, your meds, your sleep, your moods — every day. Most apps that try to help feel like spreadsheets. Cold, demanding, full of charts that don&rsquo;t answer the question you actually have.</p>
          <p>Purple is different. It listens before it speaks. It captures whatever you can give it — a sentence, a voice memo, a photo — and quietly builds a picture of you over time. When you have a question, Purple has read the chapters that matter.</p>
          <p>We&rsquo;re free, open source, and ad-free forever. Your data is yours. Always.</p>
        </div>
        <div className="mt-12">
          <Button asChild className="h-12 px-7 text-base rounded-xl"><Link to="/sign-up">Join Purple</Link></Button>
        </div>
      </main>
      <SiteFooter variant="marketing" />
    </div>
  );
}