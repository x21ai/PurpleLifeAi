import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms — Purple" },
      { name: "description", content: "The terms of using Purple — plain language, no surprises." },
      { property: "og:title", content: "Terms — Purple" },
      { property: "og:description", content: "The terms of using Purple — plain language, no surprises." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <article className="mx-auto max-w-2xl px-5 sm:px-8 pt-10 pb-16 prose-quiet">
      <p className="label-eyebrow">Terms</p>
      <h1 className="mt-4 font-serif text-5xl sm:text-6xl leading-[1.04] tracking-tight text-foreground">
        The deal, in plain words.
      </h1>
      <div className="mt-8 space-y-5 text-base sm:text-[17px] leading-relaxed text-muted-foreground">
        <p>
          Purple is a personal health journal. It is not a medical device and not a substitute for
          professional advice, diagnosis, or treatment. In an emergency, call your local emergency number.
        </p>
        <p>
          You own your data. We don&rsquo;t sell it, we don&rsquo;t advertise against it, and you can
          export or delete it from Settings at any time.
        </p>
        <p>
          Use Purple honestly. Don&rsquo;t abuse the service, attempt to break it, or upload content that
          isn&rsquo;t yours to share. We may suspend accounts that do.
        </p>
        <p>
          The software is provided &ldquo;as is&rdquo; without warranty of any kind. To the extent allowed
          by law, the makers of Purple are not liable for damages arising from your use of it.
        </p>
        <p>
          See also our <Link to="/privacy" className="underline underline-offset-4">privacy & safety</Link> page
          and our <Link to="/charter" className="underline underline-offset-4">founding charter</Link>.
        </p>
      </div>
    </article>
  );
}