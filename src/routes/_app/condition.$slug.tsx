import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { AlertTriangle, ArrowLeft, Sparkles, Activity, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouteTheme } from "@/lib/use-route-theme";
import {
  getCondition,
  labelForTrait,
} from "@/lib/condition-catalog";
import {
  generateCareProfile,
  readConditionPage,
  type CareProfile,
} from "@/lib/care-profile.functions";
import { promptsForConditions, getSuggestedQuestions } from "@/lib/condition-prompts";

export const Route = createFileRoute("/_app/condition/$slug")({
  beforeLoad: ({ params }) => {
    if (!getCondition(params.slug)) throw notFound();
  },
  head: ({ params }) => {
    const def = getCondition(params.slug);
    const title = def ? `${def.label} · Purple` : "Condition · Purple";
    return {
      meta: [
        { title },
        {
          name: "description",
          content: def
            ? `Personalized notes, common symptoms, and what to watch for with ${def.label.toLowerCase()}.`
            : "Per-condition view in Purple.",
        },
      ],
    };
  },
  component: ConditionPage,
});

function ConditionPage() {
  useRouteTheme("dark");
  const { slug } = Route.useParams();
  const def = getCondition(slug)!;

  const readPage = useServerFn(readConditionPage);
  const regenerate = useServerFn(generateCareProfile);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["condition-page", slug],
    queryFn: () => readPage({ data: { slug } }),
  });

  const profile: CareProfile | null = data?.profile ?? null;
  const hasIt = data?.hasIt ?? false;

  // Per-condition slices, derived from this single condition's traits, so the
  // page is informative even before/without an AI care profile.
  const conditionScopedPrompts = useMemo(() => promptsForConditions([slug]), [slug]);
  const conditionScopedQuestions = useMemo(() => getSuggestedQuestions([slug]), [slug]);

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-10 lg:px-16 pt-6 sm:pt-10 pb-32">
      <Link
        to="/my-health"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        My Health
      </Link>

      <header className="mt-6">
        <p className="label-eyebrow">{def.category.replace(/_/g, " ")}</p>
        <h1 className="mt-2 font-serif text-4xl sm:text-5xl leading-[1.05] tracking-tight text-foreground">
          {def.label}
        </h1>
        {def.aka.length > 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            Also: {def.aka.join(", ")}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {def.traits.map((t) => (
            <span
              key={t}
              className="rounded-full border border-border bg-card px-2.5 py-0.5 text-[11px] uppercase tracking-wider text-muted-foreground"
            >
              {labelForTrait(t)}
            </span>
          ))}
          {hasIt && (
            <span className="rounded-full bg-primary/15 text-primary px-2.5 py-0.5 text-[11px] uppercase tracking-wider">
              On your list
            </span>
          )}
        </div>
      </header>

      {/* Personalized notes from AI care profile, if present */}
      <section className="mt-10 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="font-serif text-lg text-foreground">For you</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={isLoading}
            onClick={async () => {
              await regenerate({ data: { force: true } });
              refetch();
            }}
          >
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Refresh"}
          </Button>
        </div>
        {profile ? (
          <>
            <p className="mt-3 text-base text-foreground">{profile.todayGreeting}</p>
            {profile.toneNotes && (
              <p className="mt-2 text-xs text-muted-foreground italic">
                Purple's tone for you: {profile.toneNotes}
              </p>
            )}
          </>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Personalized notes haven't been generated yet. Tap Refresh to create them.
          </p>
        )}
      </section>

      {/* Journal prompts scoped to this condition */}
      <section className="mt-8">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <h2 className="font-serif text-lg text-foreground">Journal prompts</h2>
        </div>
        <ul className="mt-3 space-y-2">
          {(profile?.journalPrompts ?? conditionScopedPrompts).map((p) => (
            <li
              key={p}
              className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground"
            >
              {p}
            </li>
          ))}
        </ul>
        <div className="mt-3">
          <Link to="/journal/new">
            <Button variant="outline" size="sm">Open journal</Button>
          </Link>
        </div>
      </section>

      {/* Ask Purple starters */}
      <section className="mt-8">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h2 className="font-serif text-lg text-foreground">Ask Purple</h2>
        </div>
        <ul className="mt-3 space-y-2">
          {(profile?.askPurpleStarters ?? conditionScopedQuestions).map((q) => (
            <li
              key={q}
              className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground"
            >
              {q}
            </li>
          ))}
        </ul>
        <div className="mt-3">
          <Link to="/chat">
            <Button variant="outline" size="sm">Open Ask Purple</Button>
          </Link>
        </div>
      </section>

      {/* What to watch for (red flags from catalog + AI watchFor) */}
      {(def.redFlags.length > 0 || (profile?.watchFor?.length ?? 0) > 0) && (
        <section className="mt-8 rounded-2xl border border-[color:var(--data-alert)]/40 bg-[color:var(--data-alert)]/5 p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[color:var(--data-alert)]" />
            <h2 className="font-serif text-lg text-foreground">Watch for</h2>
          </div>
          <ul className="mt-3 space-y-1.5 text-sm text-foreground">
            {[...new Set([...(profile?.watchFor ?? []), ...def.redFlags])]
              .slice(0, 8)
              .map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-[color:var(--data-alert)]">•</span>
                  <span>{f}</span>
                </li>
              ))}
          </ul>
          <p className="mt-3 text-[11px] text-muted-foreground">
            These are signals to bring to a clinician — not a diagnosis. If something feels
            urgent, contact your care team or local emergency services.
          </p>
        </section>
      )}

      {/* Common symptoms + meds (catalog reference) */}
      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-serif text-base text-foreground">Common symptoms</h3>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {def.commonSymptoms.length > 0
              ? def.commonSymptoms.map((s) => <li key={s}>· {s}</li>)
              : <li>—</li>}
          </ul>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-serif text-base text-foreground">Common medications</h3>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {def.commonMeds.length > 0
              ? def.commonMeds.map((m) => <li key={m}>· {m}</li>)
              : <li>—</li>}
          </ul>
        </div>
      </section>

      <p className="mt-10 text-[11px] text-muted-foreground">
        Purple is a private journal, not a medical device. Information here is educational
        and shaped by what you've told us — never a substitute for your clinician.
      </p>
    </div>
  );
}