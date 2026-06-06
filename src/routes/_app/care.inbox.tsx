import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { ArrowLeft, Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouteTheme } from "@/lib/use-route-theme";
import {
  decidePendingChange,
  decidePendingChangesBulk,
  listPendingChangesDetailed,
} from "@/lib/care.functions";

type FilterKey = "all" | "meds" | "journal" | "other";
const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "meds", label: "Meds" },
  { key: "journal", label: "Journal" },
  { key: "other", label: "Other" },
];

function bucketOf(type: string): FilterKey {
  if (type.includes("meds")) return "meds";
  if (type.includes("journal")) return "journal";
  return "other";
}

export const Route = createFileRoute("/_app/care/inbox")({
  head: () => ({ meta: [{ title: "Changes waiting for you · Purple" }] }),
  component: InboxPage,
  errorComponent: ({ error, reset }) => (
    <div className="mx-auto max-w-3xl px-5 sm:px-10 pt-16 pb-24">
      <h1 className="font-serif text-3xl text-foreground">Inbox</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        We couldn't load your inbox. {error?.message ? `(${error.message})` : ""}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground hover:bg-secondary"
      >
        Try again
      </button>
    </div>
  ),
  notFoundComponent: () => <div className="p-10">Not found.</div>,
});

function InboxPage() {
  useRouteTheme("light");
  const qc = useQueryClient();
  const fetchPending = useServerFn(listPendingChangesDetailed);
  const decide = useServerFn(decidePendingChange);
  const bulk = useServerFn(decidePendingChangesBulk);
  const [filter, setFilter] = useState<FilterKey>("all");

  const pending = useQuery({
    queryKey: ["care", "pending-detailed"],
    queryFn: () => fetchPending(),
  });

  const decideMut = useMutation({
    mutationFn: (vars: { id: string; decision: "approved" | "rejected"; note?: string }) =>
      decide({ data: vars }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["care", "pending-detailed"] });
      qc.invalidateQueries({ queryKey: ["care", "pending"] });
      toast.success(vars.decision === "approved" ? "Change applied" : "Change rejected");
    },
    onError: (e: any) => toast.error(e?.message ?? "Couldn't save decision"),
  });
  const bulkMut = useMutation({
    mutationFn: (vars: { ids: string[]; decision: "approved" | "rejected" }) =>
      bulk({ data: vars }),
    onSuccess: (res, vars) => {
      qc.invalidateQueries({ queryKey: ["care", "pending-detailed"] });
      qc.invalidateQueries({ queryKey: ["care", "pending"] });
      const verb = vars.decision === "approved" ? "approved" : "rejected";
      toast.success(
        `${res.ok} ${verb}${res.failed ? ` · ${res.failed} failed` : ""}`,
      );
    },
    onError: (e: any) => toast.error(e?.message ?? "Couldn't save decisions"),
  });

  const allChanges = pending.data?.changes ?? [];
  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = { all: allChanges.length, meds: 0, journal: 0, other: 0 };
    for (const ch of allChanges) c[bucketOf(String(ch.type))]++;
    return c;
  }, [allChanges]);
  const changes = useMemo(
    () =>
      filter === "all"
        ? allChanges
        : allChanges.filter((c) => bucketOf(String(c.type)) === filter),
    [allChanges, filter],
  );
  const visibleIds = changes.map((c) => c.id);
  const bulkBusy = bulkMut.isPending || decideMut.isPending;

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-10 lg:px-16 pt-12 sm:pt-20 lg:pt-24 pb-24">
      <Link
        to="/settings/sharing"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Sharing & access
      </Link>
      <p className="label-eyebrow text-muted-foreground mt-6">Caregiver inbox</p>
      <h1 className="mt-3 font-serif text-[40px] sm:text-6xl leading-[1.02] tracking-[-0.02em] text-foreground">
        Changes waiting<br />for you
      </h1>
      <p className="mt-6 body-serif text-foreground/75 max-w-[600px]">
        Caregivers proposed these edits to your record. Nothing is applied until you approve it.
      </p>

      <section className="mt-10">
        {/* Filter chips */}
        {allChanges.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={
                  "rounded-full border px-3 py-1 text-xs " +
                  (filter === f.key
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground")
                }
              >
                {f.label} <span className="ml-1 tabular-nums opacity-70">{counts[f.key]}</span>
              </button>
            ))}
            {visibleIds.length > 1 && (
              <div className="ml-auto flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={bulkBusy}
                  onClick={() => {
                    if (!confirm(`Approve ${visibleIds.length} changes?`)) return;
                    bulkMut.mutate({ ids: visibleIds, decision: "approved" });
                  }}
                >
                  <Check className="h-3 w-3 mr-1" /> Approve all
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={bulkBusy}
                  onClick={() => {
                    if (!confirm(`Reject ${visibleIds.length} changes?`)) return;
                    bulkMut.mutate({ ids: visibleIds, decision: "rejected" });
                  }}
                >
                  <X className="h-3 w-3 mr-1" /> Reject all
                </Button>
              </div>
            )}
          </div>
        )}
        {pending.isLoading ? (
          <p className="text-sm text-muted-foreground">
            <Loader2 className="inline h-3 w-3 animate-spin" /> Loading…
          </p>
        ) : changes.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <p className="font-serif text-xl text-foreground">You're all caught up.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              When a caregiver proposes a change, it'll show up here.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {changes.map((c) => (
              <PendingChangeCard
                key={c.id}
                change={c}
                disabled={decideMut.isPending}
                onDecide={(decision, note) => decideMut.mutate({ id: c.id, decision, note })}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

type Change = {
  id: string;
  type: string;
  type_label: string;
  created_at: string;
  caregiver_profile: { first_name: string | null; last_name: string | null; community_display_name: string | null } | null;
  current_value: string | null;
  proposed_text: string;
};

function PendingChangeCard({
  change,
  disabled,
  onDecide,
}: {
  change: Change;
  disabled: boolean;
  onDecide: (decision: "approved" | "rejected", note?: string) => void;
}) {
  const [note, setNote] = useState("");
  const caregiverName =
    change.caregiver_profile?.community_display_name ||
    [change.caregiver_profile?.first_name, change.caregiver_profile?.last_name].filter(Boolean).join(" ") ||
    "A caregiver";

  return (
    <li className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-serif text-lg text-foreground">{change.type_label}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {caregiverName} · {new Date(change.created_at).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-muted/30 p-3">
          <p className="label-eyebrow text-muted-foreground mb-1">Current</p>
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {change.current_value?.trim() || (
              <span className="text-muted-foreground italic">No existing content</span>
            )}
          </p>
        </div>
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
          <p className="label-eyebrow text-primary mb-1">Proposed addition</p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{change.proposed_text}</p>
        </div>
      </div>

      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note to caregiver (optional)"
        rows={2}
        className="mt-4"
      />

      <div className="mt-3 flex gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDecide("rejected", note || undefined)}
          disabled={disabled}
        >
          <X className="h-3 w-3 mr-1" /> Reject
        </Button>
        <Button size="sm" onClick={() => onDecide("approved", note || undefined)} disabled={disabled}>
          <Check className="h-3 w-3 mr-1" /> Approve & apply
        </Button>
      </div>
    </li>
  );
}