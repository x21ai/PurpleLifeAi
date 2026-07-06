import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { PlatformFlagGate } from "@/lib/platform-flags";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Loader2 } from "lucide-react";
import { getFriendBasics } from "@/lib/friendships.functions";
import { labelForCondition } from "@/lib/condition-prompts";

export const Route = createFileRoute("/_app/friends/$friendshipId")({
  head: () => ({
    meta: [{ title: "About a friend · Purple" }],
  }),
  component: GatedFriendBasicsPage,
  errorComponent: ({ reset }) => {
    const router = useRouter();
    return (
      <div className="mx-auto max-w-xl px-5 sm:px-8 pt-10 pb-16 text-sm text-muted-foreground">
        Couldn't load this friend.{" "}
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="underline"
        >
          Try again
        </button>
      </div>
    );
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-5 sm:px-8 pt-10 pb-16 text-sm text-muted-foreground">
      Friendship not found.
    </div>
  ),
});

function GatedFriendBasicsPage() {
  return (
    <PlatformFlagGate flag="friends" redirectTo="/today">
      <FriendBasicsPage />
    </PlatformFlagGate>
  );
}

function FriendBasicsPage() {
  const { friendshipId } = Route.useParams();
  const fetchBasics = useServerFn(getFriendBasics);
  const q = useQuery({
    queryKey: ["friend-basics", friendshipId],
    queryFn: () => fetchBasics({ data: { friendship_id: friendshipId } }),
  });

  return (
    <div className="mx-auto max-w-xl px-5 sm:px-8 pt-10 sm:pt-14 pb-16">
      <Link
        to="/settings/sharing"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> Back to Sharing
      </Link>
      <p className="label-eyebrow mt-6">A friend on Purple</p>
      <h1 className="app-hero-title text-[28px] sm:text-[32px] text-foreground mt-2">
        About this friend
      </h1>

      {q.isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">
          <Loader2 className="inline h-3 w-3 animate-spin" /> Loading…
        </p>
      ) : q.data && !q.data.shared ? (
        <p className="mt-6 text-sm text-muted-foreground">
          No shared details , just a friend on Purple. They haven't opted to share basics, or you
          haven't either.
        </p>
      ) : q.data && q.data.shared ? (
        <section className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-center gap-4">
            {q.data.basics.avatar_url ? (
              <img
                src={q.data.basics.avatar_url}
                alt=""
                className="h-14 w-14 rounded-full object-cover ring-1 ring-border"
              />
            ) : (
              <div className="h-14 w-14 rounded-full bg-secondary ring-1 ring-border" />
            )}
            <div className="min-w-0">
              <p className="text-base text-foreground">
                {[q.data.basics.first_name, q.data.basics.last_name].filter(Boolean).join(" ") ||
                  "A friend"}
              </p>
              {q.data.basics.country && (
                <p className="text-xs text-muted-foreground mt-0.5">{q.data.basics.country}</p>
              )}
            </div>
          </div>

          {q.data.basics.conditions.length > 0 && (
            <div className="mt-5">
              <p className="label-eyebrow text-muted-foreground">Tracking</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {q.data.basics.conditions.map((c) => (
                  <span
                    key={c}
                    className="rounded-full bg-secondary px-2.5 py-1 text-xs text-foreground"
                  >
                    {labelForCondition(c)}
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className="mt-6 text-[11px] text-muted-foreground leading-relaxed">
            That's all that's shared. No journal, no biometrics, no medications, no reports , ever.
            Turn this off anytime from Settings → Sharing.
          </p>
        </section>
      ) : null}
    </div>
  );
}
