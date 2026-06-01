import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useMemo } from "react";

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
import {
  caregiverReadBiometrics,
  caregiverReadJournal,
  caregiverReadMeds,
  caregiverReadOverview,
  caregiverReadReports,
  caregiverReadSeizures,
  caregiverReadToday,
} from "@/lib/care.functions";
import { useRouteTheme } from "@/lib/use-route-theme";
import { ROLE_LABELS, type CareRole } from "@/lib/care.scopes";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_app/care/$ownerId")({
  head: () => ({ meta: [{ title: "Caregiver dashboard — Purple" }] }),
  component: CareDashboardPage,
});

type TabKey = "today" | "meds" | "biometrics" | "journal" | "seizures" | "reports";

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

  const tabs: { key: TabKey; label: string; scope: string }[] = useMemo(
    () =>
      [
        { key: "today" as TabKey, label: "Today", scope: "today:read" },
        { key: "meds" as TabKey, label: "Meds", scope: "meds:read" },
        { key: "biometrics" as TabKey, label: "Biometrics", scope: "biometrics:read" },
        { key: "journal" as TabKey, label: "Journal", scope: "journal:read" },
        { key: "seizures" as TabKey, label: "Seizures", scope: "seizures:read" },
        { key: "reports" as TabKey, label: "Reports", scope: "reports:read" },
      ].filter((t) => has(t.scope)),
    [scopes.join(",")],
  );

  const [active, setActive] = useState<TabKey>("today");
  const current: TabKey = tabs.some((t) => t.key === active) ? active : (tabs[0]?.key ?? "today");

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

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-10 lg:px-16 pt-12 sm:pt-20 lg:pt-24 pb-24">
      <Link to="/settings/sharing" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {t("care.back")}
      </Link>

      <p className="label-eyebrow text-muted-foreground mt-6">{t("care.eyebrow")}</p>
      <h1 className="mt-3 font-serif text-4xl sm:text-5xl leading-[1.04] tracking-[-0.02em] text-foreground">
        {displayName}
      </h1>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{ROLE_LABELS[relationship.role as CareRole]}</Badge>
        <span className="text-xs text-muted-foreground">
          {scopes.length} scope{scopes.length === 1 ? "" : "s"} granted
        </span>
        {relationship.expires_at && (
          <span className="text-xs text-muted-foreground">
            · access until {new Date(relationship.expires_at).toLocaleDateString()}
          </span>
        )}
      </div>

      {tabs.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">
          No read scopes granted yet. Ask them to grant access in Settings → Sharing.
        </p>
      ) : (
        <div className="mt-8">
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
          <Tabs value={current} onValueChange={(v) => setActive(v as TabKey)} className="mt-4">
            <TabsList className="hidden sm:flex">
              {tabs.map((t) => (
                <TabsTrigger key={t.key} value={t.key}>
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {tabs.find((t) => t.key === "today") && (
              <TabsContent value="today" className="mt-4">
                <TodayPanel ownerId={ownerId} />
              </TabsContent>
            )}
            {tabs.find((t) => t.key === "meds") && (
              <TabsContent value="meds" className="mt-4">
                <MedsPanel
                  ownerId={ownerId}
                  relationshipId={relationship.id}
                  canPropose={has("meds:propose")}
                />
              </TabsContent>
            )}
            {tabs.find((t) => t.key === "biometrics") && (
              <TabsContent value="biometrics" className="mt-4">
                <BiometricsPanel ownerId={ownerId} />
              </TabsContent>
            )}
            {tabs.find((t) => t.key === "journal") && (
              <TabsContent value="journal" className="mt-4">
                <JournalPanel
                  ownerId={ownerId}
                  relationshipId={relationship.id}
                  canComment={has("journal:comment")}
                />
              </TabsContent>
            )}
            {tabs.find((t) => t.key === "seizures") && (
              <TabsContent value="seizures" className="mt-4">
                <SeizuresPanel ownerId={ownerId} />
              </TabsContent>
            )}
            {tabs.find((t) => t.key === "reports") && (
              <TabsContent value="reports" className="mt-4">
                <ReportsPanel ownerId={ownerId} />
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

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

/* ----- Today ----- */
function TodayPanel({ ownerId }: { ownerId: string }) {
  const fn = useServerFn(caregiverReadToday);
  const q = useQuery({
    queryKey: ["care", "today", ownerId],
    queryFn: () => fn({ data: { owner_id: ownerId } }),
  });
  if (q.isLoading) return <Empty>Loading…</Empty>;
  if (q.isError) return <Empty>{(q.error as any)?.message ?? "Couldn't load"}</Empty>;
  const { forecast, alerts } = q.data!;
  return (
    <Section>
      <h2 className="font-serif text-xl text-foreground">Today</h2>
      {forecast ? (
        <div className="mt-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Risk band</p>
          <p className="mt-1 font-serif text-3xl text-foreground capitalize">{forecast.band}</p>
          {forecast.ai_narrative && (
            <p className="mt-2 text-sm text-foreground/80 whitespace-pre-wrap">{forecast.ai_narrative}</p>
          )}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">No forecast for today.</p>
      )}
      <div className="mt-5">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Active alerts</p>
        {alerts.length === 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">None.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {alerts.map((a: any) => (
              <li key={a.id} className="rounded-xl border border-border p-3">
                <p className="text-sm font-medium text-foreground">{a.title}</p>
                {a.body && <p className="mt-0.5 text-xs text-muted-foreground">{a.body}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Section>
  );
}

/* ----- Meds ----- */
function MedsPanel({
  ownerId,
  relationshipId,
  canPropose,
}: {
  ownerId: string;
  relationshipId: string;
  canPropose: boolean;
}) {
  const fn = useServerFn(caregiverReadMeds);
  const q = useQuery({
    queryKey: ["care", "meds", ownerId],
    queryFn: () => fn({ data: { owner_id: ownerId } }),
  });
  if (q.isLoading) return <Empty>Loading…</Empty>;
  if (q.isError) return <Empty>{(q.error as any)?.message ?? "Couldn't load"}</Empty>;
  const { meds, doses } = q.data!;
  return (
    <Section>
      <h2 className="font-serif text-xl text-foreground">Medications</h2>
      {meds.length === 0 ? (
        <Empty>No active medications.</Empty>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {meds.map((m: any) => {
            const recent = doses.filter((d: any) => d.medication_id === m.id).slice(0, 6);
            return (
              <li key={m.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{m.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.dosage ?? "—"} · {(m.times_of_day ?? []).join(", ") || "no schedule"}
                    </p>
                    {m.notes && <p className="mt-1 text-xs text-foreground/70 whitespace-pre-wrap">{m.notes}</p>}
                  </div>
                  {canPropose && (
                    <ProposeChangeDialog
                      relationshipId={relationshipId}
                      type="add_meds_note"
                      targetId={m.id}
                      targetLabel={m.name}
                    />
                  )}
                </div>
                {recent.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {recent.map((d: any) => (
                      <span
                        key={d.id}
                        className={
                          "inline-block rounded-full px-2 py-0.5 text-[10px] " +
                          (d.status === "taken"
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                            : d.status === "missed"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-muted text-muted-foreground")
                        }
                        title={new Date(d.scheduled_at).toLocaleString()}
                      >
                        {d.status}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

/* ----- Biometrics ----- */
function BiometricsPanel({ ownerId }: { ownerId: string }) {
  const fn = useServerFn(caregiverReadBiometrics);
  const q = useQuery({
    queryKey: ["care", "biometrics", ownerId],
    queryFn: () => fn({ data: { owner_id: ownerId } }),
  });
  if (q.isLoading) return <Empty>Loading…</Empty>;
  if (q.isError) return <Empty>{(q.error as any)?.message ?? "Couldn't load"}</Empty>;
  const rows = q.data!.rows;
  return (
    <Section>
      <h2 className="font-serif text-xl text-foreground">Biometrics (last 7 days)</h2>
      {rows.length === 0 ? (
        <Empty>No biometrics yet.</Empty>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground uppercase tracking-wide">
                <th className="py-2 pr-3">When</th>
                <th className="py-2 pr-3">HR</th>
                <th className="py-2 pr-3">HRV</th>
                <th className="py-2 pr-3">Sleep</th>
                <th className="py-2 pr-3">SpO₂</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r: any, i: number) => (
                <tr key={i} className="text-foreground/80">
                  <td className="py-2 pr-3 whitespace-nowrap">{new Date(r.recorded_at).toLocaleString()}</td>
                  <td className="py-2 pr-3">{r.hr_bpm ?? "—"}</td>
                  <td className="py-2 pr-3">{r.hrv_rmssd_ms ?? "—"}</td>
                  <td className="py-2 pr-3">{r.sleep_score ?? "—"}</td>
                  <td className="py-2 pr-3">{r.spo2_pct ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}

/* ----- Journal ----- */
function JournalPanel({
  ownerId,
  relationshipId,
  canComment,
}: {
  ownerId: string;
  relationshipId: string;
  canComment: boolean;
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
    <Section>
      <h2 className="font-serif text-xl text-foreground">Journal</h2>
      {entries.length === 0 ? (
        <Empty>No recent entries.</Empty>
      ) : (
        <ul className="mt-3 space-y-3">
          {entries.map((e: any) => (
            <li key={e.id} className="rounded-xl border border-border p-3">
              <p className="text-xs text-muted-foreground">
                {new Date(e.captured_at).toLocaleString()} · {e.kind}
              </p>
              {e.ai_summary && <p className="mt-1 text-sm font-medium text-foreground">{e.ai_summary}</p>}
              {e.text && (
                <p className="mt-1 text-sm text-foreground/80 whitespace-pre-wrap line-clamp-6">{e.text}</p>
              )}
              {canComment && (
                <div className="mt-2">
                  <ProposeChangeDialog
                    relationshipId={relationshipId}
                    type="add_journal_comment"
                    targetId={e.id}
                    targetLabel={e.ai_summary ?? new Date(e.captured_at).toLocaleDateString()}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

/* ----- Seizures ----- */
function SeizuresPanel({ ownerId }: { ownerId: string }) {
  const fn = useServerFn(caregiverReadSeizures);
  const q = useQuery({
    queryKey: ["care", "seizures", ownerId],
    queryFn: () => fn({ data: { owner_id: ownerId } }),
  });
  if (q.isLoading) return <Empty>Loading…</Empty>;
  if (q.isError) return <Empty>{(q.error as any)?.message ?? "Couldn't load"}</Empty>;
  const events = q.data!.events;
  return (
    <Section>
      <h2 className="font-serif text-xl text-foreground">Seizure events</h2>
      {events.length === 0 ? (
        <Empty>None logged.</Empty>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {events.map((e: any) => (
            <li key={e.id} className="py-3 first:pt-0 last:pb-0">
              <p className="text-sm font-medium text-foreground">
                {new Date(e.started_at).toLocaleString()}
                {e.duration_seconds ? ` · ${Math.round(e.duration_seconds / 60) || 1} min` : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                {e.type ?? "Unspecified"}
                {typeof e.severity === "number" ? ` · severity ${e.severity}` : ""}
                {e.rescue_med_given ? " · rescue med" : ""}
                {e.injury ? " · injury" : ""}
              </p>
              {e.notes && <p className="mt-1 text-sm text-foreground/80 whitespace-pre-wrap">{e.notes}</p>}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}