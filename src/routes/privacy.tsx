import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useRouteTheme } from "@/lib/use-route-theme";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { SiteFooter } from "@/components/layout/site-footer";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy & safety — Purple" }] }),
  component: PrivacyPage,
});

function PrivacyPage() {
  useRouteTheme("light");
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />
      <div className="mx-auto max-w-3xl px-5 sm:px-10 lg:px-16 pt-10 sm:pt-16 lg:pt-20 pb-24">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
        <p className="label-eyebrow text-muted-foreground mt-10">About</p>
        <h1 className="mt-3 font-serif text-[44px] sm:text-6xl lg:text-7xl leading-[1.02] tracking-[-0.02em] text-foreground">
          Privacy &amp;<br/>safety.
        </h1>
        <p className="mt-8 body-serif text-foreground/75 max-w-[600px]">
          Full policy coming soon. In short: your journal entries, biometrics, and seizure logs belong to you. Purple stores them so you can search them &mdash; never to sell, never to train models without your explicit consent. Export everything any time, delete everything any time.
        </p>
      </div>
      <SiteFooter variant="marketing" />
    </div>
  );
}