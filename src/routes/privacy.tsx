import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useRouteTheme } from "@/lib/use-route-theme";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { SiteFooter } from "@/components/layout/site-footer";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy & safety · Purple" },
      {
        name: "description",
        content:
          "How Purple handles your health data. Your journal, biometrics, and medications belong to you. No ads, no trackers, no selling. Export or delete anytime.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  useRouteTheme("light");
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />
      <div className="mx-auto max-w-3xl px-5 sm:px-10 lg:px-16 pt-12 sm:pt-20 lg:pt-24 pb-28">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
        <p className="label-eyebrow text-muted-foreground mt-12 sm:mt-16">About Purple</p>
        <h1 className="mt-4 font-serif text-[40px] sm:text-6xl lg:text-7xl leading-[1.02] tracking-[-0.02em] text-foreground">
          Privacy &amp; safety.
        </h1>
        <p className="mt-6 body-serif text-lg sm:text-xl text-foreground/75 max-w-[48ch]">
          Your health story is yours. Here&rsquo;s exactly how we treat it.
        </p>

        <div className="mt-14 sm:mt-20 space-y-14 sm:space-y-20 max-w-[60ch]">
          <section className="space-y-4">
            <h2 className="font-serif text-2xl sm:text-3xl text-foreground">What we collect</h2>
            <p className="body-serif text-foreground/75">
              Only what you put in or explicitly connect: your journal entries (text, voice transcripts, photos), medications and doses, seizures and other events, biometrics from devices you choose to link (Oura, WHOOP, Apple Health), and basic account info (email, optional name, region, preferred language).
            </p>
            <p className="body-serif text-foreground/75">
              We don&rsquo;t track you across the web. There are no third-party advertising or analytics trackers in Purple &mdash; no Google Analytics, no pixels, no fingerprinting.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl sm:text-3xl text-foreground">How AI is used</h2>
            <p className="body-serif text-foreground/75">
              Purple uses language models to help you write, transcribe voice notes, extract structured details from your entries, and answer questions about your own data. Requests are made on your behalf to model providers via a secured gateway. Your content is sent only to fulfill that request &mdash; it is not used to train third-party models, and we do not train models on your data.
            </p>
            <p className="body-serif text-foreground/75">
              AI suggestions are informational and never a substitute for a clinician. The medical disclaimer is shown wherever AI surfaces health-adjacent output.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl sm:text-3xl text-foreground">Who can see your data</h2>
            <p className="body-serif text-foreground/75">
              By default, only you. Caregivers and family members you invite get read-only access to the scopes you choose. If a caregiver tries to write on your behalf, you get a notice and the change waits for your approval.
            </p>
            <p className="body-serif text-foreground/75">
              Shared medical reports use one-time signed links that you can revoke at any time.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl sm:text-3xl text-foreground">Where it&rsquo;s stored</h2>
            <p className="body-serif text-foreground/75">
              On managed cloud infrastructure (Supabase / PostgreSQL), encrypted in transit and at rest. Uploaded files (voice clips, photos, reports) live in private storage buckets and are served through short-lived signed URLs &mdash; never public links.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl sm:text-3xl text-foreground">Export and delete</h2>
            <p className="body-serif text-foreground/75">
              Open Settings &rarr; Data to export everything as JSON, or to delete your account. Deletion removes your journal, medications, biometrics, devices, sharing relationships, and uploaded files. Backups are purged on a rolling schedule.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl sm:text-3xl text-foreground">What we&rsquo;ll never do</h2>
            <ul className="space-y-4 body-serif text-foreground/75">
              <li>Sell, rent, or share your data with brokers or advertisers.</li>
              <li>Use your journal or biometrics to target ads.</li>
              <li>Train AI models on your data without your explicit, opt-in consent.</li>
              <li>Ship third-party trackers, behavioral analytics, or session-replay tools.</li>
              <li>Lock you in. Your data is exportable and deletable at any time.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl sm:text-3xl text-foreground">Children</h2>
            <p className="body-serif text-foreground/75">
              Purple is not directed at children under 13. Parents and caregivers may use Purple to track a minor&rsquo;s health on their own account, but accounts must be created and managed by an adult.
            </p>
          </section>

          <section className="space-y-4 border-t border-border pt-12">
            <h2 className="font-serif text-2xl sm:text-3xl text-foreground">Questions</h2>
            <p className="body-serif text-foreground/75">
              Reach us at <a href="mailto:hello@purplelife.org" className="underline underline-offset-4">hello@purplelife.org</a>. See also our <Link to="/charter" className="underline underline-offset-4">founding charter</Link> and <Link to="/terms" className="underline underline-offset-4">terms</Link>.
            </p>
            <p className="body-serif text-foreground/60 text-sm">Last updated: June 2026.</p>
          </section>
        </div>
      </div>
      <SiteFooter variant="marketing" />
    </div>
  );
}