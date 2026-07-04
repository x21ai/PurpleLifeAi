import { createFileRoute, Link } from "@tanstack/react-router";
import { SheetPage, SheetCard } from "@/components/sheet/sheet-page";

export const Route = createFileRoute("/_app/settings/privacy")({
  head: () => ({ meta: [{ title: "Privacy & safety · Purple" }] }),
  component: PrivacySheetPage,
});

function PrivacySheetPage() {
  return (
    <SheetPage title="Privacy & safety" closeTo="/settings">
      <SheetCard>
        <p className="body-serif text-sm text-muted-foreground">
          Your health story is yours. Here&rsquo;s exactly how we treat it.
        </p>
      </SheetCard>

      <SheetCard className="space-y-4">
        <h2 className="font-serif text-lg text-foreground">What we collect</h2>
        <p className="body-serif text-sm text-muted-foreground leading-relaxed">
          Only what you put in or explicitly connect: your journal entries (text, voice transcripts,
          photos), medications and doses, seizures and other events, biometrics from devices you
          choose to link (Oura, WHOOP, Apple Health), and basic account info (email, optional name,
          region, preferred language).
        </p>
        <p className="body-serif text-sm text-muted-foreground leading-relaxed">
          We don&rsquo;t track you across the web. There are no third-party advertising or analytics
          trackers in Purple: no Google Analytics, no pixels, no fingerprinting.
        </p>
      </SheetCard>

      <SheetCard className="space-y-4">
        <h2 className="font-serif text-lg text-foreground">How AI is used</h2>
        <p className="body-serif text-sm text-muted-foreground leading-relaxed">
          Purple uses language models to help you write, transcribe voice notes, extract structured
          details from your entries, and answer questions about your own data. Requests are made on
          your behalf to model providers via a secured gateway. Your content is sent only to fulfill
          that request. It is not used to train third-party models, and we do not train models on
          your data.
        </p>
        <p className="body-serif text-sm text-muted-foreground leading-relaxed">
          AI suggestions are informational and never a substitute for a clinician. The medical
          disclaimer is shown wherever AI surfaces health-adjacent output.
        </p>
      </SheetCard>

      <SheetCard className="space-y-4">
        <h2 className="font-serif text-lg text-foreground">Who can see your data</h2>
        <p className="body-serif text-sm text-muted-foreground leading-relaxed">
          By default, only you. Caregivers and family members you invite get read-only access to the
          scopes you choose. If a caregiver tries to write on your behalf, you get a notice and the
          change waits for your approval.
        </p>
        <p className="body-serif text-sm text-muted-foreground leading-relaxed">
          Shared medical reports use one-time signed links that you can revoke at any time.
        </p>
      </SheetCard>

      <SheetCard className="space-y-4">
        <h2 className="font-serif text-lg text-foreground">Where it&rsquo;s stored</h2>
        <p className="body-serif text-sm text-muted-foreground leading-relaxed">
          On managed cloud infrastructure (Supabase / PostgreSQL), encrypted in transit and at rest.
          Uploaded files (voice clips, photos, reports) live in private storage buckets and are served
          through short-lived signed URLs, never public links.
        </p>
      </SheetCard>

      <SheetCard className="space-y-4">
        <h2 className="font-serif text-lg text-foreground">Export and delete</h2>
        <p className="body-serif text-sm text-muted-foreground leading-relaxed">
          Open Settings &rarr; Data to export everything as JSON, or to delete your account. Deletion
          removes your journal, medications, biometrics, devices, sharing relationships, and uploaded
          files. Backups are purged on a rolling schedule.
        </p>
      </SheetCard>

      <SheetCard className="space-y-4">
        <h2 className="font-serif text-lg text-foreground">What we&rsquo;ll never do</h2>
        <ul className="space-y-2 body-serif text-sm text-muted-foreground leading-relaxed list-disc pl-5">
          <li>Sell, rent, or share your data with brokers or advertisers.</li>
          <li>Use your journal or biometrics to target ads.</li>
          <li>Train AI models on your data without your explicit, opt-in consent.</li>
          <li>Ship third-party trackers, behavioral analytics, or session-replay tools.</li>
          <li>Lock you in. Your data is exportable and deletable at any time.</li>
        </ul>
      </SheetCard>

      <SheetCard className="space-y-4">
        <h2 className="font-serif text-lg text-foreground">Children</h2>
        <p className="body-serif text-sm text-muted-foreground leading-relaxed">
          Purple is not directed at children under 13. Parents and caregivers may use Purple to track
          a minor&rsquo;s health on their own account, but accounts must be created and managed by an
          adult.
        </p>
      </SheetCard>

      <SheetCard className="space-y-4">
        <h2 className="font-serif text-lg text-foreground">Questions</h2>
        <p className="body-serif text-sm text-muted-foreground leading-relaxed">
          Reach us at{" "}
          <a href="mailto:hello@purplelife.org" className="underline underline-offset-4">
            hello@purplelife.org
          </a>
          . See also our{" "}
          <Link to="/settings/terms" className="underline underline-offset-4">
            terms
          </Link>
          .
        </p>
        <p className="body-serif text-xs text-muted-foreground">Last updated: June 2026.</p>
      </SheetCard>
    </SheetPage>
  );
}
