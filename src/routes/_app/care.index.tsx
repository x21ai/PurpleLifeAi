import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Mail, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { OwnerCard, type OwnerCardData } from "@/components/care/owner-card";
import { listCaregiverOwners } from "@/lib/care.functions";
import { useRouteTheme } from "@/lib/use-route-theme";

export const Route = createFileRoute("/_app/care/")({
  head: () => ({
    meta: [{ title: "People you care for · Purple" }],
  }),
  component: CareIndexPage,
});

function CareIndexPage() {
  useRouteTheme("light");
  const fn = useServerFn(listCaregiverOwners);
  const q = useQuery({
    queryKey: ["care", "owners-switcher"],
    queryFn: () => fn(),
    staleTime: 30_000,
  });

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-10 lg:px-16 pt-12 sm:pt-20 lg:pt-24 pb-24">
      <p className="label-eyebrow text-muted-foreground">Caregiver</p>
      <h1 className="mt-3 font-serif text-4xl sm:text-5xl leading-[1.04] tracking-[-0.02em] text-foreground">
        People you care for
      </h1>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground">
        Tap a card to see their day, meds, and updates. They control what you can see and can revoke access any time.
      </p>

      {q.isLoading && (
        <p className="mt-10 text-sm text-muted-foreground inline-flex items-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin" /> Loading…
        </p>
      )}

      {q.isError && (
        <p className="mt-10 text-sm text-destructive">
          {(q.error as Error)?.message ?? "Couldn't load."}
        </p>
      )}

      {q.data && q.data.owners.length === 0 && q.data.pending.length === 0 && (
        <EmptyState />
      )}

      {q.data && q.data.pending.length > 0 && (
        <section className="mt-10">
          <h2 className="label-eyebrow text-muted-foreground">Pending invites</h2>
          <ul className="mt-3 space-y-2">
            {q.data.pending.map((p) => (
              <li
                key={p.relationship_id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-sm text-foreground">
                      Invite to {p.invite_email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Sent {new Date(p.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {p.invite_token && (
                  <Button asChild size="sm" variant="secondary">
                    <Link
                      to="/care/accept"
                      search={{ token: p.invite_token }}
                    >
                      Accept
                    </Link>
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {q.data && q.data.owners.length > 0 && (
        <section className="mt-10">
          <h2 className="label-eyebrow text-muted-foreground">Active</h2>
          <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
            {q.data.owners.map((o) => (
              <OwnerCard key={o.owner_id} owner={o as OwnerCardData} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <Users className="h-5 w-5 text-primary" />
      </div>
      <h2 className="mt-4 font-serif text-2xl text-foreground">No one is sharing with you yet</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
        When someone invites you as a caregiver, they'll appear here. Ask them to add you from their Sharing settings.
      </p>
      <p className="mt-6 text-sm text-muted-foreground">
        Want to share your own health with someone you trust?
      </p>
      <Link
        to="/settings/sharing"
        className="mt-2 inline-flex items-center rounded-full border border-border bg-background px-4 py-2 text-sm text-foreground hover:bg-secondary/50 transition-colors"
      >
        Share with a caregiver
      </Link>
    </div>
  );
}