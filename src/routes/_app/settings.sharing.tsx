import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Archive, ArrowLeft, ArrowRight, Copy, Download, Loader2, Mail, MessageCircle, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetColumn } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ExpiryControl } from "@/components/care/expiry-control";
import { AppleHealthCard } from "@/components/settings/apple-health-card";
import { CircleSection } from "@/components/sharing/circle-section";
import { usePlatformFlag } from "@/lib/platform-flags";
import { useRouteTheme } from "@/lib/use-route-theme";
import { useTranslation } from "react-i18next";
import {
  inviteCaregiver,
  listMyCaregivers,
  listCareAuditLog,
  listPendingChanges,
  listPeopleSharingWithMe,
  revokeRelationship,
  archiveRelationship,
  deleteRelationship,
  unarchiveRelationship,
  setScopes,
  setRelationshipLabel,
  exportCareAuditCsv,
  listOwnerAuditFeed,
  pauseAllWrites,
  getRelationshipWriteState,
  setCareDigestPreference,
  getCareDigestPreference,
  setRelationshipDigestMuted,
} from "@/lib/care.functions";
import { getOrCreateDirectThread } from "@/lib/care-chat.functions";
import { ProGate } from "@/components/pro/pro-gate";
import { useIsPro } from "@/lib/pro-gate";
import { userMessage } from "@/lib/user-message";
import {
  CARE_RESOURCES,
  CARE_VERBS,
  ROLE_DEFAULT_SCOPES,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  SCOPE_LABELS,
  RELATIONSHIP_LABELS,
  type RelationshipLabel,
  type CareRole,
  type CareScope,
} from "@/lib/care.scopes";

export const Route = createFileRoute("/_app/settings/sharing")({
  head: () => ({ meta: [{ title: "Sharing & access · Purple" }] }),
  component: SharingPage,
  errorComponent: ({ error, reset }) => (
    <div className="mx-auto max-w-3xl px-5 sm:px-10 pt-16 pb-24">
      <h1 className="app-hero-title text-3xl text-foreground">Sharing & access</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        We couldn't load your sharing settings. {error?.message ? `(${error.message})` : ""}
      </p>
      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground hover:bg-secondary"
        >
          Try again
        </button>
        <Link
          to="/settings"
          className="rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground hover:bg-secondary"
        >
          Back to settings
        </Link>
      </div>
    </div>
  ),
});

function SharingPage() {
  useRouteTheme("light");
  const { t } = useTranslation();
  const qc = useQueryClient();
  // The friend "circle" accept/join routes are dark-launched; only show the
  // invite UI when the flag is on so invites never lead to a dead end.
  const { enabled: friendsEnabled } = usePlatformFlag("friends");

  const fetchMyCaregivers = useServerFn(listMyCaregivers);
  const fetchSharingWithMe = useServerFn(listPeopleSharingWithMe);
  const fetchPending = useServerFn(listPendingChanges);

  const caregivers = useQuery({ queryKey: ["care", "mine"], queryFn: () => fetchMyCaregivers() });
  const archivedCaregivers = useQuery({
    queryKey: ["care", "mine", "archived"],
    queryFn: () => fetchMyCaregivers({ data: { archived: true } }),
  });
  const [showArchived, setShowArchived] = useState(false);
  const sharedWithMe = useQuery({ queryKey: ["care", "shared-with-me"], queryFn: () => fetchSharingWithMe() });
  const pending = useQuery({ queryKey: ["care", "pending"], queryFn: () => fetchPending() });
  const { isPro } = useIsPro();
  const activeCaregiverCount = (caregivers.data?.relationships ?? []).filter(
    (r) => r.status === "active" || r.status === "pending",
  ).length;
  const canInviteFree = isPro || activeCaregiverCount < 1;

  const revoke = useServerFn(revokeRelationship);
  const revokeMut = useMutation({
    mutationFn: (relationship_id: string) => revoke({ data: { relationship_id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["care", "mine"] });
      toast.success("Access revoked");
    },
    onError: (e: any) => toast.error(userMessage(e, "Couldn't revoke")),
  });

  const archiveFn = useServerFn(archiveRelationship);
  const archiveMut = useMutation({
    mutationFn: (relationship_id: string) => archiveFn({ data: { relationship_id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["care", "mine"] });
      qc.invalidateQueries({ queryKey: ["care", "mine", "archived"] });
      toast.success("Removed from your list");
    },
    onError: (e: any) => toast.error(userMessage(e, "Couldn't archive")),
  });

  const deleteFn = useServerFn(deleteRelationship);
  const deleteMut = useMutation({
    mutationFn: (relationship_id: string) => deleteFn({ data: { relationship_id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["care", "mine"] });
      qc.invalidateQueries({ queryKey: ["care", "mine", "archived"] });
      toast.success("Caregiver deleted");
    },
    onError: (e: any) => toast.error(userMessage(e, "Couldn't delete")),
  });

  const unarchiveFn = useServerFn(unarchiveRelationship);
  const unarchiveMut = useMutation({
    mutationFn: (relationship_id: string) => unarchiveFn({ data: { relationship_id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["care", "mine"] });
      qc.invalidateQueries({ queryKey: ["care", "mine", "archived"] });
      toast.success("Restored to your list");
    },
    onError: (e: any) => toast.error(userMessage(e, "Couldn't restore")),
  });

  const archivedRows = archivedCaregivers.data?.relationships ?? [];

  const pendingCount = pending.data?.changes.length ?? 0;

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-10 lg:px-16 pt-12 sm:pt-20 lg:pt-24 pb-24">
      <Link to="/settings" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {t("nav.settings")}
      </Link>
      <p className="label-eyebrow text-muted-foreground mt-6">{t("sharing.eyebrow")}</p>
      <h1 className="mt-3 app-hero-title text-[32px] sm:text-[40px] text-foreground">
        {t("sharing.title1")}<br />{t("sharing.title2")}
      </h1>
      <p className="today-lede mt-6 max-w-[600px] text-foreground/55">
        {t("sharing.intro")}
      </p>

      {/* Pending approvals strip → inbox */}
      <Link
        to="/care/inbox"
        className="mt-10 flex items-center justify-between gap-3 sharing-glass-card p-5 sm:p-6 transition-colors hover:bg-secondary/40"
      >
        <div className="flex items-center gap-3">
          {pendingCount > 0 ? <Badge variant="default">{pendingCount}</Badge> : null}
          <div>
            <p className="font-serif text-base text-foreground">
              {pending.isLoading
                ? t("common.loading")
                : pendingCount === 0
                ? "Nothing waiting for your review"
                : `${pendingCount} ${pendingCount === 1 ? "change is" : "changes are"} waiting for you`}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Open the caregiver inbox to review</p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </Link>

      {/* Daily digest preference */}
      <DigestPreferenceCard />

      {/* Apple Health auto-sync */}
      <AppleHealthCard />

      {/* People I share with */}
      <section className="mt-6 sharing-glass-card p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-xl text-foreground">People I share with</h2>
          {canInviteFree ? (
            <InviteCaregiverSheet onInvited={() => qc.invalidateQueries({ queryKey: ["care", "mine"] })} />
          ) : (
            <ProGate feature="caregiver_seats" variant="inline">{null}</ProGate>
          )}
        </div>
        {caregivers.isLoading ? (
          <p className="mt-3 text-sm text-muted-foreground"><Loader2 className="inline h-3 w-3 animate-spin" /> Loading…</p>
        ) : (caregivers.data?.relationships ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No one yet. Invite someone you trust above.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {caregivers.data!.relationships.map((r) => {
              const myScopes = (caregivers.data!.scopes ?? []).filter((s) => s.relationship_id === r.id && s.granted).map((s) => s.scope);
              return (
                <li key={r.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-foreground truncate">{r.invite_email}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {(r as any).relationship_label ? (
                          <>
                            <span className="text-foreground">{(r as any).relationship_label}</span>
                            <span> · </span>
                          </>
                        ) : null}
                        {ROLE_LABELS[r.role as CareRole]} ·{" "}
                        <StatusPill status={r.status} />
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{myScopes.length} scope{myScopes.length === 1 ? "" : "s"} granted</p>
                      {r.status !== "revoked" && (
                        <RelationshipLabelEditor
                          relationshipId={r.id}
                          value={(r as any).relationship_label ?? null}
                          onSaved={() => qc.invalidateQueries({ queryKey: ["care", "mine"] })}
                        />
                      )}
                      {r.status === "active" && (
                        <div className="mt-2">
                          <ExpiryControl relationshipId={r.id} expiresAt={r.expires_at} />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {r.status === "active" && r.caregiver_id && (
                        <MessageCaregiverButton relationshipId={r.id} />
                      )}
                      <ManageRelationshipSheet
                        relationshipId={r.id}
                        role={r.role as CareRole}
                        currentScopes={myScopes as CareScope[]}
                        onSaved={() => qc.invalidateQueries({ queryKey: ["care", "mine"] })}
                      />
                      {r.status !== "revoked" && (
                        <RevokeRelationshipButton
                          email={r.invite_email ?? ""}
                          onConfirm={() => revokeMut.mutate(r.id)}
                          disabled={revokeMut.isPending}
                        />
                      )}
                      {r.status === "revoked" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Archive"
                            disabled={archiveMut.isPending}
                            onClick={() => archiveMut.mutate(r.id)}
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                          <DeleteRelationshipButton
                            email={r.invite_email ?? ""}
                            onConfirm={() => deleteMut.mutate(r.id)}
                            disabled={deleteMut.isPending}
                          />
                        </>
                      )}
                    </div>
                  </div>
                  {r.status === "active" && (
                    <PauseWritesRow relationshipId={r.id} />
                  )}
                  {r.status === "active" && (
                    <DigestMuteRow
                      relationshipId={r.id}
                      initialMuted={Boolean((r as any).digest_muted)}
                    />
                  )}
                  {r.status === "pending" && (
                    <div className="mt-2 flex items-center gap-2">
                      <code className="flex-1 truncate rounded-md bg-muted px-2 py-1 text-[11px] text-foreground">
                        {typeof window !== "undefined" ? window.location.origin : ""}/care/accept?token={r.invite_token}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const url =
                            (typeof window !== "undefined" ? window.location.origin : "") +
                            "/care/accept?token=" +
                            r.invite_token;
                          navigator.clipboard?.writeText(url).then(
                            () => toast.success("Invite link copied"),
                            () => toast.error("Couldn't copy"),
                          );
                        }}
                      >
                        <Copy className="h-3 w-3 mr-1" /> Copy link
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {archivedRows.length > 0 && (
          <div className="mt-5 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => setShowArchived((v) => !v)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {showArchived ? "Hide" : "Show"} archived ({archivedRows.length})
            </button>
            {showArchived && (
              <ul className="mt-3 divide-y divide-border opacity-90">
                {archivedRows.map((r) => (
                  <li key={r.id} className="py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-foreground truncate">{r.invite_email}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {ROLE_LABELS[r.role as CareRole]} · Archived
                        {(r as any).archived_at
                          ? ` ${new Date((r as any).archived_at).toLocaleDateString()}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Restore"
                        disabled={unarchiveMut.isPending}
                        onClick={() => unarchiveMut.mutate(r.id)}
                      >
                        <Undo2 className="h-4 w-4" />
                      </Button>
                      <DeleteRelationshipButton
                        email={r.invite_email ?? ""}
                        onConfirm={() => deleteMut.mutate(r.id)}
                        disabled={deleteMut.isPending}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {/* Activity feed */}
      <ActivitySection
        relationships={(caregivers.data?.relationships ?? []).filter((r) => r.status === "active")}
      />

      {/* People sharing with me */}
      <section className="mt-6 sharing-glass-card p-5 sm:p-6">
        <h2 className="font-serif text-xl text-foreground">People sharing with me</h2>
        {sharedWithMe.isLoading ? (
          <p className="mt-3 text-sm text-muted-foreground"><Loader2 className="inline h-3 w-3 animate-spin" /> Loading…</p>
        ) : (sharedWithMe.data?.relationships ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No one has shared their account with you yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {sharedWithMe.data!.relationships.map((r) => (
              <li key={r.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">{ROLE_LABELS[r.role as CareRole]}</p>
                  <p className="text-xs text-muted-foreground"><StatusPill status={r.status} /></p>
                </div>
                {r.status === "active" && (
                  <Link to="/care/$ownerId" params={{ ownerId: r.owner_id }} className="text-sm text-primary hover:underline">
                    Open dashboard →
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Your circle (friends, zero data access). Gated until friend accept/join ship. */}
      {friendsEnabled && <CircleSection />}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    revoked: "bg-muted text-muted-foreground",
  };
  return <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${map[status] ?? ""}`}>{status}</span>;
}

/* ----------------- Revoke confirmation ----------------- */

function MessageCaregiverButton({ relationshipId }: { relationshipId: string }) {
  const openFn = useServerFn(getOrCreateDirectThread);
  const [busy, setBusy] = useState(false);
  const handleOpen = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const r = await openFn({ data: { relationshipId } });
      window.location.assign(`/chat-care?thread=${r.threadId}`);
    } catch (e) {
      toast.error(userMessage(e, "Couldn't open chat"));
      setBusy(false);
    }
  };
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Message"
      onClick={handleOpen}
      disabled={busy}
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <MessageCircle className="h-4 w-4" />
      )}
    </Button>
  );
}

function RevokeRelationshipButton({
  email,
  onConfirm,
  disabled,
}: {
  email: string;
  onConfirm: () => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <Button variant="ghost" size="icon" aria-label="Revoke" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revoke access for {email || "this person"}?</AlertDialogTitle>
          <AlertDialogDescription>
            They'll lose access immediately. Past activity stays in your audit log.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={disabled}
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Revoke access
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DeleteRelationshipButton({
  email,
  onConfirm,
  disabled,
}: {
  email: string;
  onConfirm: () => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Permanently delete {email || "this caregiver"}?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes them from your list for good. Their past activity stays in your audit log.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={disabled}
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ----------------- Pause writes switch ----------------- */

function PauseWritesRow({ relationshipId }: { relationshipId: string }) {
  const qc = useQueryClient();
  const fetchState = useServerFn(getRelationshipWriteState);
  const state = useQuery({
    queryKey: ["care", "write-state", relationshipId],
    queryFn: () => fetchState({ data: { relationship_id: relationshipId } }),
  });
  const pause = useServerFn(pauseAllWrites);
  const m = useMutation({
    mutationFn: (paused: boolean) => pause({ data: { relationship_id: relationshipId, paused } }),
    onSuccess: (_, paused) => {
      qc.invalidateQueries({ queryKey: ["care", "write-state", relationshipId] });
      qc.invalidateQueries({ queryKey: ["care", "mine"] });
      toast.success(paused ? "Writes paused, read-only access" : "Writes resumed");
    },
    onError: (e: any) => toast.error(userMessage(e, "That change didn't save. Try again in a moment.")),
  });

  if (!state.data || state.data.total === 0) return null;
  const paused = state.data.paused;
  return (
    <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2">
      <div>
        <p className="text-xs font-medium text-foreground">Pause all writes</p>
        <p className="text-[11px] text-muted-foreground">
          {paused ? "Read-only, they can view but not change anything." : "They can write within their scopes."}
        </p>
      </div>
      <Switch checked={paused} disabled={m.isPending} onCheckedChange={(v) => m.mutate(v)} />
    </div>
  );
}

/* ----------------- Daily digest preference ----------------- */

function DigestPreferenceCard() {
  const qc = useQueryClient();
  const fetchPref = useServerFn(getCareDigestPreference);
  const setPref = useServerFn(setCareDigestPreference);
  const pref = useQuery({ queryKey: ["care", "digest-pref"], queryFn: () => fetchPref() });
  const m = useMutation({
    mutationFn: (enabled: boolean) => setPref({ data: { enabled } }),
    onSuccess: (_, enabled) => {
      qc.invalidateQueries({ queryKey: ["care", "digest-pref"] });
      toast.success(enabled ? "Daily digest on" : "Daily digest off");
    },
    onError: (e: any) => toast.error(userMessage(e, "That change didn't save. Try again in a moment.")),
  });
  return (
    <section className="mt-6 flex items-center justify-between gap-3 sharing-glass-card p-5 sm:p-6">
      <div>
        <h2 className="font-serif text-base text-foreground">Daily caregiver digest</h2>
        <p className="text-xs text-muted-foreground mt-1 max-w-md">
          A once-a-day email summarising what your caregivers did in the last 24 hours.
        </p>
      </div>
      <Switch
        checked={pref.data?.enabled ?? true}
        disabled={pref.isLoading || m.isPending}
        onCheckedChange={(v) => m.mutate(v)}
      />
    </section>
  );
}

/* ----------------- Per-caregiver digest mute ----------------- */

function DigestMuteRow({
  relationshipId,
  initialMuted,
}: {
  relationshipId: string;
  initialMuted: boolean;
}) {
  const qc = useQueryClient();
  const setFn = useServerFn(setRelationshipDigestMuted);
  const [muted, setMuted] = useState(initialMuted);
  const m = useMutation({
    mutationFn: (next: boolean) =>
      setFn({ data: { relationship_id: relationshipId, muted: next } }),
    onSuccess: (_, next) => {
      qc.invalidateQueries({ queryKey: ["care", "mine"] });
      toast.success(next ? "Muted in your daily digest" : "Will appear in your daily digest");
    },
    onError: (e: any) => {
      setMuted(initialMuted);
      toast.error(userMessage(e, "That change didn't save. Try again in a moment."));
    },
  });
  return (
    <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2">
      <div>
        <p className="text-xs font-medium text-foreground">Mute in daily digest</p>
        <p className="text-[11px] text-muted-foreground">
          {muted
            ? "Their activity is excluded from your daily summary email."
            : "Their activity appears in your daily summary email."}
        </p>
      </div>
      <Switch
        checked={muted}
        disabled={m.isPending}
        onCheckedChange={(v) => {
          setMuted(v);
          m.mutate(v);
        }}
      />
    </div>
  );
}

/* ----------------- Activity feed ----------------- */

function ActivitySection({
  relationships,
}: {
  relationships: Array<{ id: string; invite_email: string | null }>;
}) {
  const [caregiverFilter, setCaregiverFilter] = useState<string | "all">("all");
  const [resourceFilter, setResourceFilter] = useState<string>("all");
  const fetchFeed = useServerFn(listOwnerAuditFeed);
  const feed = useQuery({
    queryKey: ["care", "audit-feed", caregiverFilter, resourceFilter],
    queryFn: () =>
      fetchFeed({
        data: {
          limit: 100,
          caregiverRelId: caregiverFilter === "all" ? null : caregiverFilter,
          resourceType: resourceFilter === "all" ? null : resourceFilter,
        },
      }),
  });

  const exportCsv = useServerFn(exportCareAuditCsv);
  const [exporting, setExporting] = useState(false);
  async function onExport() {
    setExporting(true);
    try {
      const res = await exportCsv({ data: { days: 90 } });
      const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `purple-care-activity-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${res.rowCount} rows`);
    } catch (e: any) {
      toast.error(userMessage(e, "The export didn't finish. Try again, your data is safe."));
    } finally {
      setExporting(false);
    }
  }

  const entries = feed.data?.entries ?? [];
  const resourceTypes = Array.from(new Set(entries.map((e) => e.resource_type).filter(Boolean) as string[]));

  return (
    <section className="mt-6 sharing-glass-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-serif text-xl text-foreground">Activity</h2>
          <p className="text-xs text-muted-foreground mt-1">
            What your caregivers have done. Last 100 actions.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={onExport} disabled={exporting}>
          {exporting ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Download className="h-3 w-3 mr-1" />}
          Export CSV
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <select
          value={caregiverFilter}
          onChange={(e) => setCaregiverFilter(e.target.value as any)}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground [&>option]:bg-popover [&>option]:text-popover-foreground"
        >
          <option value="all">All caregivers</option>
          {relationships.map((r) => (
            <option key={r.id} value={r.id}>
              {r.invite_email}
            </option>
          ))}
        </select>
        <select
          value={resourceFilter}
          onChange={(e) => setResourceFilter(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground [&>option]:bg-popover [&>option]:text-popover-foreground"
        >
          <option value="all">All resources</option>
          {resourceTypes.map((rt) => (
            <option key={rt} value={rt}>
              {rt.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      {feed.isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">
          <Loader2 className="inline h-3 w-3 animate-spin" /> Loading…
        </p>
      ) : entries.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No activity yet.</p>
      ) : (
        <ul className="mt-4 max-h-96 overflow-y-auto divide-y divide-border text-xs">
          {entries.map((e: any) => (
            <li key={e.id} className="py-2 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-foreground capitalize">
                  <span className="font-medium">{e.caregiver_email ?? "Someone"}</span>{" "}
                  {String(e.action).replace(/_/g, " ")}
                  {e.resource_type ? (
                    <span className="text-muted-foreground"> · {String(e.resource_type).replace(/_/g, " ")}</span>
                  ) : null}
                </p>
              </div>
              <span className="text-muted-foreground tabular-nums whitespace-nowrap">
                {new Date(e.at).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ----------------- Invite sheet ----------------- */

function InviteCaregiverSheet({ onInvited }: { onInvited: () => void }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CareRole>("caregiver");
  const [relationshipLabel, setRelationshipLabelValue] = useState<RelationshipLabel | "">("");
  const invite = useServerFn(inviteCaregiver);
  const m = useMutation({
    mutationFn: () =>
      invite({
        data: {
          email,
          role,
          relationship_label: relationshipLabel || null,
        },
      }),
    onSuccess: (res: { acceptUrl?: string; emailSent?: boolean }) => {
      const url = res?.acceptUrl;
      if (res?.emailSent) {
        toast.success(`Invite sent to ${email}`, {
          description: url
            ? "You can also copy the link below to share manually."
            : undefined,
          action: url
            ? {
                label: "Copy link",
                onClick: () => {
                  navigator.clipboard?.writeText(url);
                  toast.success("Invite link copied");
                },
              }
            : undefined,
        });
      } else {
        toast.message("Invite created, share the link", {
          description:
            "Email couldn't be delivered automatically. Copy the link and send it yourself.",
          duration: 10000,
          action: url
            ? {
                label: "Copy link",
                onClick: () => {
                  navigator.clipboard?.writeText(url);
                  toast.success("Invite link copied");
                },
              }
            : undefined,
        });
      }
      setEmail("");
      setOpen(false);
      onInvited();
    },
    onError: (e: any) => toast.error(userMessage(e, "Couldn't send invite")),
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" type="button" onClick={() => setOpen(true)}>
          <Mail className="h-3 w-3 mr-1" /> Invite
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto">
        <SheetColumn>
          <SheetHeader>
            <SheetTitle className="font-serif text-2xl">Invite someone</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-5">
          <div>
            <Label htmlFor="invite-email">Their email</Label>
            <Input
              id="invite-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="partner@example.com" // live-data-guard:allow (input placeholder, not stored data)
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="invite-relationship">How are they related to you?</Label>
            <select
              id="invite-relationship"
              value={relationshipLabel}
              onChange={(e) => setRelationshipLabelValue(e.target.value as RelationshipLabel | "")}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground [&>option]:bg-popover [&>option]:text-popover-foreground"
            >
              <option value="">Not specified</option>
              {RELATIONSHIP_LABELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Just a label so you remember who's who. Doesn't change what they can see.
            </p>
          </div>
          <div>
            <Label>What kind of access?</Label>
            <div className="mt-2 grid gap-2">
              {(["emergency", "caregiver", "provider", "viewer"] as CareRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`glass-press text-left rounded-xl border p-3 transition-colors ${
                    role === r ? "border-primary bg-primary/10" : "border-border hover:bg-secondary/40"
                  }`}
                >
                  <p className="font-serif text-base text-foreground">{ROLE_LABELS[r]}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{ROLE_DESCRIPTIONS[r]}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {ROLE_DEFAULT_SCOPES[r].length} scope{ROLE_DEFAULT_SCOPES[r].length === 1 ? "" : "s"} by default. You can tweak after.
                  </p>
                </button>
              ))}
            </div>
          </div>
          <Button onClick={() => m.mutate()} disabled={!email || m.isPending} className="w-full">
            {m.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send invite"}
          </Button>
          <p className="text-xs text-muted-foreground">
            They'll get a link to accept. Until they do, nothing is shared.
          </p>
          </div>
        </SheetColumn>
      </SheetContent>
    </Sheet>
  );
}

/* ----------------- Manage scopes sheet ----------------- */

function RelationshipLabelEditor({
  relationshipId,
  value,
  onSaved,
}: {
  relationshipId: string;
  value: string | null;
  onSaved: () => void;
}) {
  const save = useServerFn(setRelationshipLabel);
  const m = useMutation({
    mutationFn: (next: string | null) =>
      save({ data: { relationship_id: relationshipId, relationship_label: next } }),
    onSuccess: () => {
      toast.success("Relationship updated");
      onSaved();
    },
    onError: (e: any) => toast.error(userMessage(e, "That didn't save. Your changes are still here, try again.")),
  });
  return (
    <div className="mt-2 inline-flex items-center gap-2">
      <Label htmlFor={`rel-${relationshipId}`} className="text-[11px] text-muted-foreground">
        Relationship
      </Label>
      <select
        id={`rel-${relationshipId}`}
        value={value ?? ""}
        disabled={m.isPending}
        onChange={(e) => m.mutate(e.target.value ? e.target.value : null)}
        className="rounded-md border border-border bg-background px-2 py-1 text-[11px] text-foreground [&>option]:bg-popover [&>option]:text-popover-foreground"
      >
        <option value="">Not specified</option>
        {RELATIONSHIP_LABELS.map((l) => (
          <option key={l} value={l}>{l}</option>
        ))}
      </select>
    </div>
  );
}

function ManageRelationshipSheet({
  relationshipId,
  role,
  currentScopes,
  onSaved,
}: {
  relationshipId: string;
  role: CareRole;
  currentScopes: CareScope[];
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [granted, setGranted] = useState<Set<string>>(() => new Set(currentScopes));
  const allScopes = useMemo<CareScope[]>(() => {
    const out: CareScope[] = [];
    for (const r of CARE_RESOURCES) for (const v of CARE_VERBS) out.push(`${r}:${v}` as CareScope);
    return out;
  }, []);

  const save = useServerFn(setScopes);
  const m = useMutation({
    mutationFn: () =>
      save({
        data: {
          relationship_id: relationshipId,
          scopes: allScopes.map((s) => ({ scope: s, granted: granted.has(s) })),
        },
      }),
    onSuccess: () => {
      toast.success("Permissions updated");
      setOpen(false);
      onSaved();
    },
    onError: (e: any) => toast.error(userMessage(e, "That didn't save. Your changes are still here, try again.")),
  });

  function toggle(scope: string) {
    setGranted((prev) => {
      const n = new Set(prev);
      if (n.has(scope)) n.delete(scope); else n.add(scope);
      return n;
    });
  }

  const fetchAudit = useServerFn(listCareAuditLog);
  const audit = useQuery({
    queryKey: ["care", "audit", relationshipId],
    queryFn: () => fetchAudit({ data: { relationship_id: relationshipId, limit: 50 } }),
    enabled: open,
  });

  return (
    <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (o) setGranted(new Set(currentScopes)); }}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" type="button" onClick={() => setOpen(true)}>
          Manage
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto">
        <SheetColumn>
          <SheetHeader>
            <SheetTitle className="font-serif text-2xl">Manage permissions</SheetTitle>
          </SheetHeader>
          <p className="text-xs text-muted-foreground mt-1">
            {ROLE_LABELS[role]} · toggle exactly what this person can do.
          </p>
          <div className="mt-4 space-y-4">
          {CARE_RESOURCES.map((res) => (
            <div key={res} className="glass-inset p-3">
              <p className="font-serif text-sm capitalize text-foreground">{res}</p>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CARE_VERBS.map((v) => {
                  const scope = `${res}:${v}` as CareScope;
                  return (
                    <label key={scope} className="flex items-center justify-between gap-2 rounded-lg border border-border px-2 py-1.5">
                      <span className="text-xs text-foreground capitalize">{v}</span>
                      <Switch checked={granted.has(scope)} onCheckedChange={() => toggle(scope)} />
                    </label>
                  );
                })}
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">{SCOPE_LABELS[`${res}:read` as CareScope]}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 glass-inset p-4">
          <p className="font-serif text-sm text-foreground">Recent activity (last 30 days)</p>
          {audit.isLoading ? (
            <p className="mt-2 text-xs text-muted-foreground inline-flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" /> Loading…
            </p>
          ) : (audit.data?.entries ?? []).length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">No activity yet.</p>
          ) : (
            <ul className="mt-3 max-h-48 overflow-y-auto divide-y divide-border text-xs">
              {audit.data!.entries.map((e: any) => (
                <li key={e.id} className="py-2 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-foreground capitalize">
                      {String(e.action).replace(/_/g, " ")}
                      {e.resource_type ? (
                        <span className="text-muted-foreground"> · {String(e.resource_type).replace(/_/g, " ")}</span>
                      ) : null}
                    </p>
                  </div>
                  <span className="text-muted-foreground tabular-nums whitespace-nowrap">
                    {new Date(e.at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mt-5 flex gap-2">
          <Button className="flex-1" onClick={() => m.mutate()} disabled={m.isPending}>
            {m.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
        </div>
        </SheetColumn>
      </SheetContent>
    </Sheet>
  );
}