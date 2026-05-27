import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft } from "lucide-react";

import { listPeopleSharingWithMe } from "@/lib/care.functions";
import { useRouteTheme } from "@/lib/use-route-theme";
import { ROLE_LABELS, type CareRole } from "@/lib/care.scopes";

export const Route = createFileRoute("/_app/care/$ownerId")({
  head: () => ({ meta: [{ title: "Caregiver dashboard — Purple" }] }),
  component: CareDashboardPage,
});

function CareDashboardPage() {
  useRouteTheme("light");
  const { ownerId } = useParams({ from: "/_app/care/$ownerId" });
  const fetchShared = useServerFn(listPeopleSharingWithMe);
  const q = useQuery({ queryKey: ["care", "shared-with-me"], queryFn: () => fetchShared() });

  const rel = (q.data?.relationships ?? []).find((r) => r.owner_id === ownerId);

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-10 lg:px-16 pt-12 sm:pt-20 lg:pt-24 pb-24">
      <Link to="/settings/sharing" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Sharing
      </Link>
      <p className="label-eyebrow text-muted-foreground mt-6">Caregiver view</p>
      <h1 className="mt-3 font-serif text-5xl text-foreground">Their dashboard</h1>
      {q.isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
      ) : !rel ? (
        <p className="mt-6 text-sm text-muted-foreground">You don't have access to this person.</p>
      ) : (
        <div className="mt-8 rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Your role</p>
          <p className="mt-1 font-serif text-2xl text-foreground">{ROLE_LABELS[rel.role as CareRole]}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            Read-only dashboards for each granted scope are coming next. For now, anything you note here
            goes into their approval queue and only shows up once they approve it.
          </p>
        </div>
      )}
    </div>
  );
}