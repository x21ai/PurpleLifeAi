import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Mail, Users, UserPlus, Copy, Check, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { OwnerCard, type OwnerCardData } from "@/components/care/owner-card";
import {
  listCaregiverOwners,
  listMyCaregivers,
  revokeRelationship,
} from "@/lib/care.functions";
import { ROLE_LABELS, type CareRole } from "@/lib/care.scopes";
import { useRouteTheme } from "@/lib/use-route-theme";

export const Route = createFileRoute("/_app/care/")({
  head: () => ({
    meta: [{ title: "Care · Purple" }],
  }),
  component: CareIndexPage,
});

function CareIndexPage() {
  useRouteTheme("light");
  const ownersFn = useServerFn(listCaregiverOwners);
  const caregiversFn = useServerFn(listMyCaregivers);
  const q = useQuery({
    queryKey: ["care", "owners-switcher"],
    queryFn: () => ownersFn(),
    staleTime: 30_000,
  });
  const cg = useQuery({
    queryKey: ["care", "my-caregivers"],
    queryFn: () => caregiversFn(),
    staleTime: 30_000,
  });

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-10 lg:px-16 pt-12 sm:pt-20 lg:pt-24 pb-24">
      <p className="label-eyebrow text-muted-foreground">Care</p>
      <h1 className="mt-3 font-serif text-4xl sm:text-5xl leading-[1.04] tracking-[-0.02em] text-foreground">
        Care
      </h1>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground">
        Manage who you care for and who cares for you.
      </p>

      {/* People you care for */}
      <section className="mt-12">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl text-foreground">People you care for</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              They control what you can see and can revoke access any time.
            </p>
          </div>
        </div>

        {q.isLoading && (
          <p className="mt-6 text-sm text-muted-foreground inline-flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" /> Loading…
          </p>
        )}
        {q.isError && (
          <p className="mt-6 text-sm text-destructive">
            {(q.error as Error)?.message ?? "Couldn't load."}
          </p>
        )}
        {q.data && q.data.owners.length === 0 && q.data.pending.length === 0 && (
          <OwnersEmpty />
        )}
        {q.data && q.data.pending.length > 0 && (
          <div className="mt-4">
            <p className="label-eyebrow text-muted-foreground">Pending invites</p>
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
                      <Link to="/care/accept" search={{ token: p.invite_token }}>
                        Accept
                      </Link>
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        {q.data && q.data.owners.length > 0 && (
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
            {q.data.owners.map((o) => (
              <OwnerCard key={o.owner_id} owner={o as OwnerCardData} />
            ))}
          </div>
        )}
      </section>

      {/* My caregivers */}
      <MyCaregiversSection
        data={cg.data}
        isLoading={cg.isLoading}
        isError={cg.isError}
        error={cg.error as Error | null}
      />
    </div>
  );
}

function OwnersEmpty() {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <Users className="h-5 w-5 text-primary" />
      </div>
      <h3 className="mt-4 font-serif text-xl text-foreground">No one is sharing with you yet</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
        When someone invites you as a caregiver, they'll appear here. Ask them to add you from their Sharing settings.
      </p>
    </div>
  );
}

type Relationship = {
  id: string;
  caregiver_id: string | null;
  invite_email: string | null;
  role: string;
  status: string;
  relationship_label: string | null;
  invite_token: string | null;
  created_at: string;
};

function MyCaregiversSection({
  data,
  isLoading,
  isError,
  error,
}: {
  data: { relationships: Relationship[] } | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}) {
  const rels = (data?.relationships ?? []).filter(
    (r) => r.status === "active" || r.status === "pending",
  );
  const active = rels.filter((r) => r.status === "active");
  const pending = rels.filter((r) => r.status === "pending");

  return (
    <section className="mt-14">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl text-foreground">My caregivers</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            People you've invited to help with your care.
          </p>
        </div>
        <Button asChild size="sm">
          <Link to="/settings/sharing">
            <UserPlus className="h-4 w-4" />
            Invite caregiver
          </Link>
        </Button>
      </div>

      {isLoading && (
        <p className="mt-6 text-sm text-muted-foreground inline-flex items-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin" /> Loading…
        </p>
      )}
      {isError && (
        <p className="mt-6 text-sm text-destructive">
          {error?.message ?? "Couldn't load."}
        </p>
      )}

      {data && rels.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <UserPlus className="h-5 w-5 text-primary" />
          </div>
          <h3 className="mt-4 font-serif text-xl text-foreground">No caregivers yet</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Invite a family member, friend, or clinician to follow along and help.
          </p>
          <Button asChild size="sm" className="mt-4">
            <Link to="/settings/sharing">Invite caregiver</Link>
          </Button>
        </div>
      )}

      {pending.length > 0 && (
        <div className="mt-4">
          <p className="label-eyebrow text-muted-foreground">Pending</p>
          <ul className="mt-3 space-y-2">
            {pending.map((r) => (
              <CaregiverRow key={r.id} rel={r} />
            ))}
          </ul>
        </div>
      )}

      {active.length > 0 && (
        <div className="mt-6">
          <p className="label-eyebrow text-muted-foreground">Active</p>
          <ul className="mt-3 space-y-2">
            {active.map((r) => (
              <CaregiverRow key={r.id} rel={r} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function CaregiverRow({ rel }: { rel: Relationship }) {
  const qc = useQueryClient();
  const revokeFn = useServerFn(revokeRelationship);
  const [copied, setCopied] = useState(false);
  const revoke = useMutation({
    mutationFn: () => revokeFn({ data: { relationship_id: rel.id } }),
    onSuccess: () => {
      toast.success("Access revoked");
      qc.invalidateQueries({ queryKey: ["care", "my-caregivers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const roleLabel = ROLE_LABELS[rel.role as CareRole] ?? rel.role;
  const isPending = rel.status === "pending";

  const copyInvite = async () => {
    if (!rel.invite_token) return;
    const url = `${window.location.origin}/care/accept?token=${rel.invite_token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Invite link copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy");
    }
  };

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 shrink-0">
          <Users className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm text-foreground">
            {rel.invite_email ?? "Caregiver"}
          </p>
          <p className="text-xs text-muted-foreground">
            {roleLabel}
            {rel.relationship_label ? ` · ${rel.relationship_label}` : ""}
            {isPending ? " · Pending" : ""}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isPending && rel.invite_token && (
          <Button size="sm" variant="secondary" onClick={copyInvite}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy link"}
          </Button>
        )}
        <Button asChild size="sm" variant="ghost">
          <Link to="/settings/sharing">Manage</Link>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            if (confirm("Revoke this caregiver's access?")) revoke.mutate();
          }}
          disabled={revoke.isPending}
          aria-label="Revoke"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </li>
  );
}