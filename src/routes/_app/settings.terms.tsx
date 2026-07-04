import { createFileRoute, Link } from "@tanstack/react-router";
import { SheetPage, SheetCard } from "@/components/sheet/sheet-page";

export const Route = createFileRoute("/_app/settings/terms")({
  head: () => ({ meta: [{ title: "Terms · Purple" }] }),
  component: TermsSheetPage,
});

function TermsSheetPage() {
  return (
    <SheetPage title="Terms" closeTo="/settings">
      <SheetCard className="space-y-4">
        <p className="body-serif text-sm text-muted-foreground leading-relaxed">
          Purple is a personal health journal. It is not a medical device and not a substitute for
          professional advice, diagnosis, or treatment. In an emergency, call your local emergency
          number.
        </p>
        <p className="body-serif text-sm text-muted-foreground leading-relaxed">
          You own your data. We don&rsquo;t sell it, we don&rsquo;t advertise against it, and you can
          export or delete it from Settings at any time.
        </p>
        <p className="body-serif text-sm text-muted-foreground leading-relaxed">
          Use Purple honestly. Don&rsquo;t abuse the service, attempt to break it, or upload content
          that isn&rsquo;t yours to share. We may suspend accounts that do.
        </p>
        <p className="body-serif text-sm text-muted-foreground leading-relaxed">
          The software is provided &ldquo;as is&rdquo; without warranty of any kind. To the extent
          allowed by law, the makers of Purple are not liable for damages arising from your use of
          it.
        </p>
        <p className="body-serif text-sm text-muted-foreground leading-relaxed">
          See also our{" "}
          <Link to="/settings/privacy" className="underline underline-offset-4">
            privacy &amp; safety
          </Link>{" "}
          page.
        </p>
      </SheetCard>
    </SheetPage>
  );
}
