import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft, Loader2, MessageCircle, EyeOff, Eye } from "lucide-react";
import { useEffect, useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { ProposeChangeDialog } from "@/components/care/propose-change-dialog";
import { JournalEntryReadOnly } from "@/components/care/journal-entry-readonly";
import { DoseRowsReadOnly } from "@/components/care/dose-rows-readonly";
import { MedsListReadOnly } from "@/components/care/meds-list-readonly";
import { SeizureListReadOnly } from "@/components/care/seizure-list-readonly";
import { ReportsListReadOnly } from "@/components/care/reports-list-readonly";
import { LogSeizureSheet } from "@/components/care/log-seizure-sheet";
import { AddJournalSheet } from "@/components/care/add-journal-sheet";
import { getOrCreateDirectThread } from "@/lib/care-chat.functions";
import { AddBiometricSheet } from "@/components/care/add-biometric-sheet";
import { OwnerSwitcher } from "@/components/care/owner-switcher";
import { CaregiverAlertsCard } from "@/components/care/caregiver-alerts-card";
import { MetricCard } from "@/components/biometrics/metric-card";
import { NarrativeBlock } from "@/components/ui-oura/v2/narrative-block";
import { HydrationTimeline, type HydrationRow } from "@/components/hydration/hydration-timeline";
import { QuickAddWater } from "@/components/hydration/quick-add-water";
import { LogAuraSheet } from "@/components/hydration/log-aura-sheet";
import { listHydrationForDay } from "@/lib/hydration.functions";
import { listAurasForDay } from "@/lib/auras.functions";
import {
  METRIC_ORDER,
  METRICS,
  type MetricKey,
} from "@/lib/biometric-metrics";
import {
  caregiverReadBiometrics,
  caregiverReadJournal,
  caregiverReadMeds,
  caregiverReadOverview,
  caregiverReadReports,
  caregiverReadSeizures,
  caregiverReadToday,
  caregiverMarkDose,
  getOwnerActivityCounts,
  markOwnerSeen,
  setCaregiverHiddenFeatures,
} from "@/lib/care.functions";
import { useRouteTheme } from "@/lib/use-route-theme";
import { ROLE_LABELS, type CareRole } from "@/lib/care.scopes";
import { isFeatureEnabled, type FeatureKey } from "@/lib/feature-catalog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_app/care/$ownerId")({
  head: () => ({ meta: [{ title: "Caregiver dashboard — Purple" }] }),
  component: CareDashboardPage,
});

type TabKey = "today" | "meds" | "biometrics" | "hydration" | "journal" | "seizures" | "reports" | "chat";

// Owner-driven feature gates per tab. Tabs not listed here are always shown
// when the caregiver has the scope (they're not condition-specific).
const TAB_OWNER_FEATURE: Partial<Record<TabKey, FeatureKey>> = {
  hydration: "hydration",
  seizures: "seizure_log",
};

function CareDashboardPage() {
  useRouteTheme("light");
  const { t } = useTranslation();
  const { ownerId } = useParams({ from: "/_app/care/$ownerId" });

  const fetchOverview = useServerFn(caregiverReadOverview);
  const overview = useQuery({
    queryKey: ["care", "overview", ownerId],
    queryFn: () => fetchOverview({ data: { owner_id: ownerId } }),
    retry: false,
  });

  const scopes = overview.data?.scopes ?? [];
  const has = (s: string) => scopes.includes(s);

  const ownerConditions = (overview.data as any)?.ownerConditions ?? [];
  const ownerOverrides = (overview.data as any)?.ownerFeatureOverrides ?? {};
  const caregiverHidden: string[] =
    (overview.data as any)?.caregiverHiddenFeatures ?? [];
  const ownerEnables = (key: TabKey) => {
    const f = TAB_OWNER_FEATURE[key];
    if (!f) return true;
    return isFeatureEnabled(f, ownerConditions, ownerOverrides);
  };

  const allScopedTabs: { key: TabKey; label: string; scope: string }[] = useMemo(
    () =>
      [
        { key: "biometrics" as TabKey, label: "Biometrics", scope: "biometrics:read" },
        { key: "today" as TabKey, label: "Today", scope: "today:read" },
        { key: "meds" as TabKey, label: "Meds", scope: "meds:read" },
        { key: "hydration" as TabKey, label: "Hydration", scope: "biometrics:read" },
        { key: "journal" as TabKey, label: "Journal", scope: "journal:read" },
        { key: "seizures" as TabKey, label: "Seizures", scope: "seizures:read" },
        { key: "reports" as TabKey, label: "Reports", scope: "reports:read" },
        { key: "chat" as TabKey, label: "Chat", scope: "today:read" },
      ].filter((t) => has(t.scope)),
    [scopes.join(",")],
  );

  // Owner-allowed tabs (after owner condition/overrides). Caregiver can
  // additionally hide any of these locally via the "Customize" menu.
  const ownerAllowedTabs = useMemo(
    () => allScopedTabs.filter((t) => ownerEnables(t.key)),
    [allScopedTabs, ownerConditions.join(","), JSON.stringify(ownerOverrides)],
  );
  const tabs = useMemo(
    () => ownerAllowedTabs.filter((t) => !caregiverHidden.includes(t.key)),
    [ownerAllowedTabs, caregiverHidden.join(",")],
  );

  const setHiddenFn = useServerFn(setCaregiverHiddenFeatures);
  const setHidden = useMutation({
    mutationFn: (hidden: string[]) =>
      setHiddenFn({
        data: { relationship_id: overview.data!.relationship.id, hidden },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["care", "overview", ownerId] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Couldn't update"),
  });
  const toggleHide = (key: TabKey, show: boolean) => {
    const next = show
      ? caregiverHidden.filter((k) => k !== key)
      : Array.from(new Set([...caregiverHidden, key]));
    setHidden.mutate(next);
  };

  const [active, setActive] = useState<TabKey>("biometrics");
  const current: TabKey = tabs.some((t) => t.key === active) ? active : (tabs[0]?.key ?? "today");

  // Activity counts (unread badges)
  const countsFn = useServerFn(getOwnerActivityCounts);
  const queryClient = useQueryClient();
  const counts = useQuery({
    queryKey: ["care", "counts", ownerId],
    queryFn: () => countsFn({ data: { owner_id: ownerId } }),
    enabled: !overview.isLoading && !overview.isError,
    staleTime: 15_000,
  });

  // Mark current tab seen
  const markSeenFn = useServerFn(markOwnerSeen);
  const markSeen = useMutation({
    mutationFn: (tab: TabKey) =>
      markSeenFn({ data: { owner_id: ownerId, tab } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["care", "counts", ownerId] });
      void queryClient.invalidateQueries({ queryKey: ["care", "owners-switcher"] });
    },
  });
  useEffect(() => {
    if (overview.data) markSeen.mutate(current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId, current, overview.data?.relationship?.id]);

  if (overview.isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-5 sm:px-10 lg:px-16 pt-12 sm:pt-20 lg:pt-24 pb-24">
        <p className="text-sm text-muted-foreground inline-flex items-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin" /> Loading dashboard…
        </p>
      </div>
    );
  }

  if (overview.isError || !overview.data) {
    return (
      <div className="mx-auto max-w-3xl px-5 sm:px-10 lg:px-16 pt-12 sm:pt-20 lg:pt-24 pb-24">
        <Link to="/settings/sharing" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {t("care.back")}
        </Link>
        <h1 className="mt-6 font-serif text-3xl text-foreground">{t("care.noAccessTitle")}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {(overview.error as any)?.message ?? t("care.noAccessBody")}
        </p>
      </div>
    );
  }

  const { relationship, profile } = overview.data;
  const displayName =
    profile?.community_display_name?.trim() ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() ||
    "Their account";
  // "Devyn's Dashboard" — use first name when we have it, fall back to the
  // full display name otherwise. Possessive suffix follows simple English rule.
  const firstName = profile?.first_name?.trim();
  const dashboardTitle = firstName
    ? `${firstName}${firstName.endsWith("s") ? "'" : "'s"} Dashboard`
    : `${displayName}${displayName.endsWith("s") ? "'" : "'s"} Dashboard`;

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-10 lg:px-16 pt-12 sm:pt-20 lg:pt-24 pb-24">
      <div className="flex items-center justify-between gap-3">
        <Link to="/care" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> All people
        </Link>
        <OwnerSwitcher currentOwnerId={ownerId} currentLabel={displayName} />
      </div>

      <p className="label-eyebrow text-muted-foreground mt-6">{t("care.eyebrow")}</p>
      <h1 className="mt-3 font-serif text-4xl sm:text-5xl leading-[1.04] tracking-[-0.02em] text-foreground">
        {dashboardTitle}
      </h1>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{ROLE_LABELS[relationship.role as CareRole]}</Badge>
        {(relationship as any).relationship_label ? (
          <Badge variant="outline">{(relationship as any).relationship_label}</Badge>
        ) : null}
        <span className="text-xs text-muted-foreground">
          {scopes.length} scope{scopes.length === 1 ? "" : "s"} granted
        </span>
        {relationship.expires_at && (
          <span className="text-xs text-muted-foreground">
            · access until {new Date(relationship.expires_at).toLocaleDateString()}
          </span>
        )}
      </div>

      {(profile as any)?.phone || (profile as any)?.pronouns ? (
        <div className="mt-4 rounded-xl border border-border bg-card p-4 text-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Contact</p>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-foreground">
            {(profile as any)?.phone && (
              <a href={`tel:${(profile as any).phone}`} className="hover:underline">
                📞 {(profile as any).phone}
              </a>
            )}
            {(profile as any)?.pronouns && (
              <span className="text-muted-foreground">{(profile as any).pronouns}</span>
            )}
          </div>
        </div>
      ) : null}

      {tabs.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">
          No read scopes granted yet. Ask them to grant access in Settings → Sharing.
        </p>
      ) : (
        <div className="mt-8">
          {/*
            Patient-related alerts surface above tabs on every tab, not only on
            Today. Tapping an alert still jumps to the relevant tab.
          */}
          <div className="mb-6">
            <CaregiverAlertsCard
              ownerId={ownerId}
              onJump={(tab) => setActive(tab as TabKey)}
            />
          </div>
          {/* Mobile: <Select>. Desktop: tabs. */}
          <div className="sm:hidden">
            <Select value={current} onValueChange={(v) => setActive(v as TabKey)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tabs.map((t) => (
                  <SelectItem key={t.key} value={t.key}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4 flex items-center justify-end gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <EyeOff className="h-3 w-3" /> Customize tabs
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs">Show tabs (just for you)</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {ownerAllowedTabs.map((t) => {
                  const shown = !caregiverHidden.includes(t.key);
                  return (
                    <DropdownMenuCheckboxItem
                      key={t.key}
                      checked={shown}
                      onCheckedChange={(v) => toggleHide(t.key, Boolean(v))}
                    >
                      {t.label}
                    </DropdownMenuCheckboxItem>
                  );
                })}
                {ownerAllowedTabs.length === 0 && (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    Nothing to customize.
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Tabs value={current} onValueChange={(v) => setActive(v as TabKey)} className="mt-2">
            <TabsList className="hidden sm:flex sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70 overflow-x-auto">
              {tabs.map((t) => (
                <TabsTrigger key={t.key} value={t.key} className="relative">
                  <span>{t.label}</span>
                  {(() => {
                    const n = counts.data?.counts?.[t.key as keyof typeof counts.data.counts] ?? 0;
                    if (n <= 0 || t.key === current) return null;
                    return (
                      <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-medium text-primary-foreground tabular-nums">
                        {n > 99 ? "99+" : n}
                      </span>
                    );
                  })()}
                </TabsTrigger>
              ))}
            </TabsList>
            {tabs.find((t) => t.key === "today") && (
              <TabsContent value="today" className="mt-4">
                <TodayPanel ownerId={ownerId} onJump={(tab) => setActive(tab)} />
              </TabsContent>
            )}
            {tabs.find((t) => t.key === "meds") && (
              <TabsContent value="meds" className="mt-4">
                <MedsPanel
                  ownerId={ownerId}
                  relationshipId={relationship.id}
                  canPropose={has("meds:propose")}
                  canWrite={has("meds:write")}
                />
              </TabsContent>
            )}
            {tabs.find((t) => t.key === "biometrics") && (
              <TabsContent value="biometrics" className="mt-4">
                <BiometricsPanel
                  ownerId={ownerId}
                  ownerName={displayName}
                  canWrite={has("biometrics:write")}
                />
              </TabsContent>
            )}
            {tabs.find((t) => t.key === "hydration") && (
              <TabsContent value="hydration" className="mt-4">
                <HydrationPanel
                  ownerId={ownerId}
                  canWrite={has("biometrics:write")}
                  auraEnabled={isFeatureEnabled("aura", ownerConditions, ownerOverrides)}
                />
              </TabsContent>
            )}
            {tabs.find((t) => t.key === "journal") && (
              <TabsContent value="journal" className="mt-4">
                <JournalPanel
                  ownerId={ownerId}
                  relationshipId={relationship.id}
                  canComment={has("journal:comment")}
                  canWrite={has("journal:write")}
                  ownerName={displayName}
                />
              </TabsContent>
            )}
            {tabs.find((t) => t.key === "seizures") && (
              <TabsContent value="seizures" className="mt-4">
                <SeizuresPanel
                  ownerId={ownerId}
                  ownerName={displayName}
                  canWrite={has("seizures:write")}
                />
              </TabsContent>
            )}
            {tabs.find((t) => t.key === "reports") && (
              <TabsContent value="reports" className="mt-4">
                <ReportsPanel ownerId={ownerId} />
              </TabsContent>
            )}
            {tabs.find((t) => t.key === "chat") && (
              <TabsContent value="chat" className="mt-4">
                <ChatPanel relationshipId={relationship.id} ownerName={displayName} />
              </TabsContent>
            )}
          </Tabs>
        </div>
      )}
    </div>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">{children}</div>;
}

function ChatPanel({
  relationshipId,
  ownerName,
}: {
  relationshipId: string;
  ownerName: string;
}) {
  const openFn = useServerFn(getOrCreateDirectThread);
  const navigate = useNavigate();
  const q = useQuery({
    queryKey: ["care-chat", "direct-thread", relationshipId],
    queryFn: () => openFn({ data: { relationshipId } }),
    staleTime: 60_000,
  });
  return (
    <Section>
      <div className="flex flex-col items-start gap-3">
        <p className="label-eyebrow text-muted-foreground">Direct chat</p>
        <p className="text-sm text-muted-foreground">
          Send a private message to {ownerName}. Saved like WhatsApp — full history is kept.
        </p>
        <button
          type="button"
          disabled={q.isLoading || !q.data}
          onClick={() => {
            if (q.data) navigate({ to: "/chat-care", search: { thread: q.data.threadId } });
          }}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {q.isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MessageCircle className="h-4 w-4" />
          )}
          Open chat with {ownerName}
        </button>
      </div>
    </Section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

/* ----- Today ----- */
function TodayPanel({
  ownerId,
  onJump,
}: {
  ownerId: string;
  onJump?: (tab: TabKey) => void;
}) {
  const fn = useServerFn(caregiverReadToday);
  const q = useQuery({
    queryKey: ["care", "today", ownerId],
    queryFn: () => fn({ data: { owner_id: ownerId } }),
  });
  if (q.isLoading) return <Empty>Loading…</Empty>;
  if (q.isError) return <Empty>{(q.error as any)?.message ?? "Couldn't load"}</Empty>;
  const { forecast, alerts } = q.data!;
  return (
    <div className="space-y-6">
      <Section>
        <p className="label-eyebrow text-muted-foreground">Today's read</p>
        {forecast ? (
          <>
            <p className="mt-2 font-serif text-3xl text-foreground capitalize">
              {forecast.band} risk
              {typeof forecast.risk_score === "number" && (
                <span className="ml-2 text-base text-muted-foreground tabular-nums">
                  {forecast.risk_score}/100
                </span>
              )}
            </p>
            {forecast.ai_narrative && (
              <div className="mt-4">
                <NarrativeBlock>{forecast.ai_narrative}</NarrativeBlock>
              </div>
            )}
          </>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            No risk forecast for today.
          </p>
        )}
      </Section>

      <Section>
        <h2 className="font-serif text-xl text-foreground">Active alerts</h2>
        {alerts.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">None.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {alerts.map((a: any) => (
              <li key={a.id} className="rounded-xl border border-border p-3">
                <p className="text-sm font-medium text-foreground">{a.title}</p>
                {a.body && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{a.body}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

/* ----- Meds ----- */
function MedsPanel({
  ownerId,
  relationshipId,
  canPropose,
  canWrite,
}: {
  ownerId: string;
  relationshipId: string;
  canPropose: boolean;
  canWrite: boolean;
}) {
  const fn = useServerFn(caregiverReadMeds);
  const markDoseFn = useServerFn(caregiverMarkDose);
  const queryClient = useQueryClient();
  const q = useQuery({
    queryKey: ["care", "meds", ownerId],
    queryFn: () => fn({ data: { owner_id: ownerId } }),
  });

  const markDose = useMutation({
    mutationFn: ({
      doseId,
      action,
    }: {
      doseId: string;
      action: "taken" | "skip";
    }) =>
      markDoseFn({ data: { owner_id: ownerId, dose_id: doseId, action } }),
    onSuccess: (_res, vars) => {
      toast.success(vars.action === "taken" ? "Marked as taken" : "Marked as skipped");
      void queryClient.invalidateQueries({ queryKey: ["care", "meds", ownerId] });
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Couldn't update dose");
    },
  });

  if (q.isLoading) return <Empty>Loading…</Empty>;
  if (q.isError) return <Empty>{(q.error as any)?.message ?? "Couldn't load"}</Empty>;
  const { meds, doses } = q.data!;
  // Today's doses only (matches the patient's "Today" doses card on /meds).
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end = new Date(); end.setHours(23, 59, 59, 999);
  const todayDoses = (doses ?? []).filter((d: any) => {
    const t = new Date(d.scheduled_at).getTime();
    return t >= start.getTime() && t <= end.getTime();
  }).sort((a: any, b: any) => +new Date(a.scheduled_at) - +new Date(b.scheduled_at));

  return (
    <div className="space-y-6">
      <Section>
        <h2 className="font-serif text-xl text-foreground">Today's doses</h2>
        {canWrite && (
          <p className="mt-1 text-xs text-muted-foreground">
            Actions you take here are logged on their account as caregiver writes.
          </p>
        )}
        <div className="mt-4">
          <DoseRowsReadOnly
            doses={todayDoses}
            meds={meds}
            onAction={
              canWrite
                ? (doseId, action) => markDose.mutate({ doseId, action })
                : undefined
            }
            pendingId={markDose.isPending ? (markDose.variables?.doseId ?? null) : null}
          />
        </div>
      </Section>

      <div>
        <h2 className="font-serif text-xl text-foreground mb-3">Medications</h2>
        <MedsListReadOnly
          meds={meds}
          trailing={(m) =>
            canPropose ? (
              <ProposeChangeDialog
                relationshipId={relationshipId}
                type="add_meds_note"
                targetId={m.id}
                targetLabel={m.name}
              />
            ) : null
          }
        />
      </div>
    </div>
  );
}

/* ----- Biometrics ----- */
function BiometricsPanel({
  ownerId,
  ownerName,
  canWrite,
}: {
  ownerId: string;
  ownerName: string;
  canWrite: boolean;
}) {
  const fn = useServerFn(caregiverReadBiometrics);
  const q = useQuery({
    queryKey: ["care", "biometrics", ownerId],
    queryFn: () => fn({ data: { owner_id: ownerId } }),
  });
  if (q.isLoading) return <Empty>Loading…</Empty>;
  if (q.isError) return <Empty>{(q.error as any)?.message ?? "Couldn't load"}</Empty>;
  const rows = q.data!.rows;

  if (rows.length === 0) {
    return (
      <div className="space-y-4">
        {canWrite && (
          <div className="flex justify-end">
            <AddBiometricSheet ownerId={ownerId} ownerName={ownerName} />
          </div>
        )}
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <p className="font-serif text-lg text-foreground">No biometrics yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Once a wearable is connected, the last 30 days appear here.
          </p>
        </div>
      </div>
    );
  }

  // Build per-metric series matching the patient /biometrics page.
  const seriesByMetric: Record<MetricKey, Array<{ date: string; value: number | null }>> =
    {} as never;
  for (const key of METRIC_ORDER) {
    const meta = METRICS[key];
    seriesByMetric[key] = rows.map((r: any) => {
      const raw = r[meta.column];
      const num = typeof raw === "number" ? raw : raw == null ? null : Number(raw);
      return {
        date: String(r.recorded_at ?? ""),
        value: Number.isFinite(num as number) ? (num as number) : null,
      };
    });
  }

  return (
    <div className="space-y-4">
      {canWrite && (
        <div className="flex justify-end">
          <AddBiometricSheet ownerId={ownerId} ownerName={ownerName} />
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        {METRIC_ORDER.map((m) => (
          <MetricCard key={m} metric={m} series={seriesByMetric[m]} disableLink />
        ))}
      </div>
    </div>
  );
}

/* ----- Journal ----- */
function JournalPanel({
  ownerId,
  relationshipId,
  canComment,
  canWrite,
  ownerName,
}: {
  ownerId: string;
  relationshipId: string;
  canComment: boolean;
  canWrite: boolean;
  ownerName: string;
}) {
  const fn = useServerFn(caregiverReadJournal);
  const q = useQuery({
    queryKey: ["care", "journal", ownerId],
    queryFn: () => fn({ data: { owner_id: ownerId } }),
  });
  if (q.isLoading) return <Empty>Loading…</Empty>;
  if (q.isError) return <Empty>{(q.error as any)?.message ?? "Couldn't load"}</Empty>;
  const entries = q.data!.entries;
  return (
    <div className="space-y-3">
      {canWrite && (
        <div className="flex justify-end">
          <AddJournalSheet ownerId={ownerId} ownerName={ownerName} />
        </div>
      )}
      {entries.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">No recent journal entries.</p>
        </div>
      )}
      {entries.map((e: any) => (
        <div key={e.id}>
          <JournalEntryReadOnly entry={e} />
          {canComment && (
            <div className="mt-2 flex justify-end">
              <ProposeChangeDialog
                relationshipId={relationshipId}
                type="add_journal_comment"
                targetId={e.id}
                targetLabel={e.ai_summary ?? new Date(e.captured_at).toLocaleDateString()}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ----- Seizures ----- */
function SeizuresPanel({
  ownerId,
  ownerName,
  canWrite,
}: {
  ownerId: string;
  ownerName: string;
  canWrite: boolean;
}) {
  const fn = useServerFn(caregiverReadSeizures);
  const q = useQuery({
    queryKey: ["care", "seizures", ownerId],
    queryFn: () => fn({ data: { owner_id: ownerId } }),
  });
  if (q.isLoading) return <Empty>Loading…</Empty>;
  if (q.isError) return <Empty>{(q.error as any)?.message ?? "Couldn't load"}</Empty>;
  const events = q.data!.events;
  return (
    <div className="space-y-4">
      {canWrite && (
        <div className="flex justify-end">
          <LogSeizureSheet ownerId={ownerId} ownerName={ownerName} />
        </div>
      )}
      <SeizureListReadOnly events={events} />
    </div>
  );
}

/* ----- Reports ----- */
function ReportsPanel({ ownerId }: { ownerId: string }) {
  const fn = useServerFn(caregiverReadReports);
  const q = useQuery({
    queryKey: ["care", "reports", ownerId],
    queryFn: () => fn({ data: { owner_id: ownerId } }),
  });
  if (q.isLoading) return <Empty>Loading…</Empty>;
  if (q.isError) return <Empty>{(q.error as any)?.message ?? "Couldn't load"}</Empty>;
  const reports = q.data!.reports;
  return <ReportsListReadOnly reports={reports} />;
}

/* ----- Hydration ----- */
function HydrationPanel({
  ownerId,
  canWrite,
  auraEnabled = false,
}: {
  ownerId: string;
  canWrite: boolean;
  auraEnabled?: boolean;
}) {
  const day = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const from = day.toISOString();
  const to = new Date(day.getTime() + 86400000).toISOString();

  const listH = useServerFn(listHydrationForDay);
  const listA = useServerFn(listAurasForDay);

  const hydration = useQuery({
    queryKey: ["hydration", ownerId, day.toISOString()],
    queryFn: () => listH({ data: { user_id: ownerId, from, to } }),
  });
  const auras = useQuery({
    queryKey: ["auras", ownerId, day.toISOString()],
    queryFn: () => listA({ data: { user_id: ownerId, from, to } }),
  });

  return (
    <div className="space-y-4">
      {canWrite && (
        <Section>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Log on their behalf
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Anything you add will be tagged as logged by a caregiver.
          </p>
          <div className="mt-3 space-y-3">
            <QuickAddWater ownerId={ownerId} />
            {auraEnabled && <div><LogAuraSheet ownerId={ownerId} /></div>}
          </div>
        </Section>
      )}
      {hydration.isLoading || auras.isLoading ? (
        <Empty>Loading…</Empty>
      ) : (
        <HydrationTimeline
          day={day}
          hydration={(hydration.data ?? []) as HydrationRow[]}
          auras={auras.data ?? []}
        />
      )}
    </div>
  );
}